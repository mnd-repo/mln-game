import { nanoid } from 'nanoid';
import { generateAiResume, getAiVerdict } from './aiClient.js';
import { splitManagers } from './split.js';

function sleep(ms) {
  return new Promise((res) => setTimeout(res, ms));
}

export class GameRoom {
  constructor({ gameId, queries, jobPool, roundsTotal, broadcast, writingSeconds, votingSeconds }) {
    this.gameId = gameId;
    this.q = queries;
    this.jobPool = jobPool;
    this.roundsTotal = roundsTotal; // target number of writers/rounds from config
    this.broadcast = broadcast; // (payload) => void, sends to all sockets for this game
    this.writingSeconds = writingSeconds;
    this.votingSeconds = votingSeconds;

    this.hostSocket = null;
    this.players = new Map(); // playerId -> { socket, name }
    this.usedJobIds = new Set();

    this.status = 'lobby'; // lobby | writing | voting | complete | reveal
    this.writingRounds = []; // all rounds for this game, created up front at writing phase start
    this.submittedWriters = new Set();
    this.gradingIndex = -1; // index into writingRounds currently being graded
    this.currentRound = null; // alias to writingRounds[gradingIndex] while grading
    this.timer = null;
  }

  send(socket, type, payload) {
    if (!socket || socket.readyState !== 1) return;
    socket.send(JSON.stringify({ type, payload }));
  }

  broadcastAll(type, payload) {
    if (this.hostSocket) this.send(this.hostSocket, type, payload);
    for (const p of this.players.values()) this.send(p.socket, type, payload);
  }

  rosterPayload() {
    return {
      players: [...this.players.entries()].map(([id, p]) => ({ id, name: p.name })),
      status: this.status,
      currentRound: this.currentRound?.roundNumber ?? 0,
      roundsTotal: this.writingRounds.length || this.roundsTotal
    };
  }

  attachHost(socket) {
    this.hostSocket = socket;
    this.send(socket, 'roster_update', this.rosterPayload());
  }

  addPlayer(playerId, name, socket) {
    this.players.set(playerId, { socket, name });
    this.broadcastAll('roster_update', this.rosterPayload());
  }

  reconnectPlayer(playerId, socket) {
    const p = this.players.get(playerId);
    if (p) p.socket = socket;
  }

  removePlayer(playerId) {
    this.players.delete(playerId);
    this.broadcastAll('roster_update', this.rosterPayload());
  }

  pickJob() {
    const notUsed = this.jobPool.filter((j) => !this.usedJobIds.has(j.id));
    const pool = notUsed.length > 0 ? notUsed : this.jobPool;
    const job = pool[Math.floor(Math.random() * pool.length)];
    this.usedJobIds.add(job.id);
    return job;
  }

  shuffledIds() {
    const ids = [...this.players.keys()];
    for (let i = ids.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [ids[i], ids[j]] = [ids[j], ids[i]];
    }
    return ids;
  }

  startGame() {
    if (this.players.size < 4) {
      throw new Error('Need at least 4 players to start.');
    }
    this.status = 'writing';
    this.q.updateGameStatus.run('writing', this.gameId);
    this.beginWritingPhase();
  }

  // Front-loads every writing slot at once: picks N distinct players (N = min(roundsTotal,
  // playerCount)), hands each a different job description, and starts a single shared timer.
  beginWritingPhase() {
    const writerCount = Math.min(this.roundsTotal, this.players.size);
    const writerIds = this.shuffledIds().slice(0, writerCount);

    this.writingRounds = [];
    this.submittedWriters = new Set();
    this.gradingIndex = -1;
    this.currentRound = null;

    const deadline = Date.now() + this.writingSeconds * 1000;
    this.writingDeadline = deadline;

    writerIds.forEach((jobSeekerId, idx) => {
      const job = this.pickJob();
      const roundId = nanoid();
      const roundNumber = idx + 1;

      this.q.insertRound.run(roundId, this.gameId, roundNumber, jobSeekerId, job.title, job.description);

      const record = {
        id: roundId,
        roundNumber,
        jobSeekerId,
        job,
        deadline,
        humanResume: null,
        aiResume: null,
        aiVerdict: null,
        submitted: false
      };
      this.writingRounds.push(record);

      // Kick off AI resume generation in parallel with the human's timer.
      generateAiResume(job.description).then((resume) => {
        record.aiResume = resume;
      });

      // Each writer privately gets their own job description.
      this.send(this.players.get(jobSeekerId)?.socket, 'round_start', {
        roundNumber,
        roundsTotal: writerCount,
        jobTitle: job.title,
        jobDescription: job.description,
        deadline
      });
    });

    // Everyone else (spectators + host) gets a generic "writing round in progress" signal,
    // with no job details, since there are multiple different jobs in flight at once.
    const writerIdSet = new Set(writerIds);
    for (const [id, p] of this.players.entries()) {
      if (!writerIdSet.has(id)) {
        this.send(p.socket, 'writing_phase_start', { deadline, roundsTotal: writerCount, writerCount });
      }
    }
    this.send(this.hostSocket, 'writing_phase_start', {
      deadline,
      roundsTotal: writerCount,
      writerCount,
      submitted: 0
    });

    clearTimeout(this.timer);
    this.timer = setTimeout(() => this.lockAllWriting(), this.writingSeconds * 1000 + 500);
  }

  submitResume(playerId, text) {
    if (this.status !== 'writing') return;
    const r = this.writingRounds.find((rr) => rr.jobSeekerId === playerId && !rr.submitted);
    if (!r) return;

    r.submitted = true;
    r.humanResume = text || '(no resume submitted)';
    this.q.setHumanResume.run(r.humanResume, Date.now(), r.id);
    this.submittedWriters.add(playerId);

    // Let this writer know their resume is locked in while they wait on the others.
    this.send(this.players.get(playerId)?.socket, 'resume_locked', { roundNumber: r.roundNumber });
    this.send(this.hostSocket, 'writer_progress', {
      submitted: this.submittedWriters.size,
      total: this.writingRounds.length
    });

    // Once every writer is done, move on immediately rather than waiting out the timer -
    // mirrors the "all voters done" early-completion behavior used during grading.
    if (this.submittedWriters.size >= this.writingRounds.length) {
      this.lockAllWriting();
    }
  }

  lockAllWriting() {
    if (this.status !== 'writing') return;
    clearTimeout(this.timer);

    for (const r of this.writingRounds) {
      if (!r.submitted) {
        r.submitted = true;
        r.humanResume = '(no resume submitted in time)';
        this.q.setHumanResume.run(r.humanResume, Date.now(), r.id);
      }
    }

    this.broadcastAll('writing_phase_locked', {});
    this.startGradingRound(0);
  }

  // Walks through the N submitted resumes one at a time, reusing the existing
  // voting/split/complete-round flow for each.
  async startGradingRound(index) {
    if (index >= this.writingRounds.length) {
      this.finishGame();
      return;
    }

    this.gradingIndex = index;
    const r = this.writingRounds[index];
    this.currentRound = r;
    this.q.updateGameRound.run(r.roundNumber, this.gameId);

    // Ensure the AI resume is ready before voting; wait briefly if it hasn't resolved yet.
    let waited = 0;
    while (!r.aiResume && waited < 8000) {
      await sleep(200);
      waited += 200;
    }
    if (!r.aiResume) r.aiResume = 'I bring strong, adaptable experience to this role.';

    if (!r.aiVerdict) {
      const verdict = await getAiVerdict(r.job.description, r.humanResume);
      r.aiVerdict = verdict;
      this.q.setAiResumeAndVerdict.run(r.aiResume, verdict.reasoning, verdict.decision, r.id);
    }

    this.startVoting();
  }

  startVoting() {
    const r = this.currentRound;
    this.status = 'voting';
    this.q.setRoundStatus.run('voting', r.id);

    // Management pool is unchanged in size round to round - every player except this
    // round's writer, including writers whose own round has already been graded.
    const managerIds = [...this.players.keys()].filter((id) => id !== r.jobSeekerId);
    const { groupHuman, groupAi } = splitManagers(managerIds, r.id);

    r.votes = new Map();
    r.assignments = new Map();

    for (const id of groupHuman) {
      r.assignments.set(id, 'human');
      this.q.insertAssignment.run(r.id, id, 'human');
    }
    for (const id of groupAi) {
      r.assignments.set(id, 'ai');
      this.q.insertAssignment.run(r.id, id, 'ai');
    }

    const deadline = Date.now() + this.votingSeconds * 1000;
    r.votingDeadline = deadline;

    // Job seeker sees a waiting screen; managers each get their assigned resume.
    this.send(this.players.get(r.jobSeekerId)?.socket, 'voting_start', {
      roundNumber: r.roundNumber,
      roundsTotal: this.writingRounds.length,
      isJobSeeker: true,
      deadline
    });

    for (const [id, group] of r.assignments.entries()) {
      const resumeText = group === 'human' ? r.humanResume : r.aiResume;
      this.send(this.players.get(id)?.socket, 'voting_start', {
        roundNumber: r.roundNumber,
        roundsTotal: this.writingRounds.length,
        isJobSeeker: false,
        candidateResume: resumeText,
        jobTitle: r.job.title,
        jobDescription: r.job.description,
        deadline
      });
    }
    this.send(this.hostSocket, 'voting_start', {
      roundNumber: r.roundNumber,
      roundsTotal: this.writingRounds.length,
      isHost: true,
      jobTitle: r.job.title,
      deadline
    });

    clearTimeout(this.timer);
    this.timer = setTimeout(() => this.completeRound(r.id), this.votingSeconds * 1000 + 500);
  }

  submitVote(managerId, decision) {
    const r = this.currentRound;
    if (!r || this.status !== 'voting') return;
    if (!r.assignments.has(managerId)) return;
    if (decision !== 'hire' && decision !== 'automate') return;
    r.votes.set(managerId, decision);
    this.q.insertVote.run(r.id, managerId, decision, Date.now());

    // If every assigned manager has voted, end the round immediately rather than
    // waiting out the rest of the voting timer.
    if (r.votes.size >= r.assignments.size) {
      this.completeRound(r.id);
    }
  }

  completeRound(roundId) {
    const r = this.currentRound;
    if (!r || r.id !== roundId || this.status !== 'voting') return;
    clearTimeout(this.timer);
    this.status = 'complete';
    this.q.setRoundStatus.run('complete', r.id);

    // Deliberately no decision/verdict is broadcast here - the whole point of the
    // game is that results stay hidden until the final reveal. Just acknowledge
    // the round wrapped up and move on.
    this.broadcastAll('round_result', { roundNumber: r.roundNumber, roundsTotal: this.writingRounds.length });

    setTimeout(() => this.startGradingRound(this.gradingIndex + 1), 2500);
  }

  finishGame() {
    this.status = 'reveal';
    this.q.updateGameStatus.run('reveal', this.gameId);
    const dashboard = this.buildDashboard();
    this.broadcastAll('game_reveal', dashboard);
  }

  buildDashboard() {
    const rounds = this.q.getRoundsByGame.all(this.gameId);
    const result = rounds.map((round) => {
      const assignments = this.q.getAssignmentsByRound.all(round.id);
      const votes = this.q.getVotesByRound.all(round.id);
      const votesByManager = new Map(votes.map((v) => [v.manager_id, v.decision]));

      let humanHire = 0,
        humanTotal = 0,
        aiHire = 0,
        aiTotal = 0;
      for (const a of assignments) {
        const decision = votesByManager.get(a.manager_id);
        if (!decision) continue;
        if (a.group_shown === 'human') {
          humanTotal++;
          if (decision === 'hire') humanHire++;
        } else {
          aiTotal++;
          if (decision === 'hire') aiHire++;
        }
      }

      const jobSeeker = this.q.getPlayer.get(round.job_seeker_id);

      return {
        roundNumber: round.round_number,
        jobTitle: round.job_title,
        jobSeekerName: jobSeeker?.name ?? 'Unknown',
        humanResume: round.human_resume,
        aiResume: round.ai_resume,
        aiVerdictDecision: round.ai_verdict_decision,
        aiVerdictReasoning: round.ai_verdict_text,
        humanApprovalRate: humanTotal > 0 ? humanHire / humanTotal : null,
        aiApprovalRate: aiTotal > 0 ? aiHire / aiTotal : null,
        humanVotes: humanTotal,
        aiVotes: aiTotal
      };
    });

    return { rounds: result };
  }

  getDashboardForApi() {
    return this.buildDashboard();
  }
}
