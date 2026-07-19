import React, { useState } from 'react';
import Scene from '../components/Scene.jsx';
import PaperCard from '../components/PaperCard.jsx';

function pct(n) {
  if (n === null || n === undefined) return '—';
  return `${Math.round(n * 100)}%`;
}

export default function RevealDashboard({ dashboard }) {
  const [twistShown, setTwistShown] = useState(false);
  const { rounds } = dashboard;

  if (!twistShown) {
    return (
      <Scene type="manager">
        <PaperCard attach="pin" pin="red" tilt={-0.5} centered className="reveal-twist">
          <h2 className="paper-title" style={{ fontSize: '1.6rem' }}>Before we see the results…</h2>
          <p className="twist-line">
            Half of every vote you cast was actually judging a resume written by
            AI — not by the human contestant.
          </p>
          <button className="btn" onClick={() => setTwistShown(true)}>Show Me The Data</button>
        </PaperCard>
      </Scene>
    );
  }

  const humanRates = rounds.map((r) => r.humanApprovalRate).filter((x) => x !== null);
  const aiRates = rounds.map((r) => r.aiApprovalRate).filter((x) => x !== null);
  const avgHuman = humanRates.length ? humanRates.reduce((a, b) => a + b, 0) / humanRates.length : null;
  const avgAi = aiRates.length ? aiRates.reduce((a, b) => a + b, 0) / aiRates.length : null;

  return (
    <Scene type="manager" wide>
      <div className="masthead">
        <h1>THE FULL REVEAL</h1>
      </div>

      <PaperCard attach="pin" pin="blue" tilt={-0.3} centered>
        <h2 className="paper-title">Overall Approval</h2>
        <div className="stat-row">
          <div className="stat">
            <span className="stat-label">Human resumes</span>
            <span className="stat-value human">{pct(avgHuman)}</span>
          </div>
          <div className="stat">
            <span className="stat-label">AI resumes</span>
            <span className="stat-value ai">{pct(avgAi)}</span>
          </div>
        </div>
      </PaperCard>

      {rounds.map((r, i) => (
        <PaperCard
          key={r.roundNumber}
          attach={i % 2 === 0 ? 'pin' : 'tape'}
          pin={['red', 'blue', 'yellow', 'green'][i % 4]}
          tilt={i % 2 === 0 ? -0.6 : 0.6}
          className="round-reveal"
        >
          <h3 className="job-title">Round {r.roundNumber}: {r.jobTitle}</h3>
          <p className="job-seeker-name">Job Seeker: {r.jobSeekerName}</p>

          <div className="resume-compare">
            <div className="resume-block">
              <h4><span className="pushpin pin-blue" style={{ position: 'static', width: 10, height: 10 }} />Human Resume</h4>
              <p>{r.humanResume}</p>
              <p className="approval">Approval: {pct(r.humanApprovalRate)} ({r.humanVotes} votes)</p>
            </div>
            <div className="resume-block is-ai">
              <h4><span className="pushpin pin-red" style={{ position: 'static', width: 10, height: 10 }} />AI Resume</h4>
              <p>{r.aiResume}</p>
              <p className="approval">Approval: {pct(r.aiApprovalRate)} ({r.aiVotes} votes)</p>
            </div>
          </div>

          <div className="ai-verdict">
            <strong>The AI's own verdict on the human</strong>
            <p>
              "{r.aiVerdictReasoning}" — Decision:{' '}
              <span className={r.aiVerdictDecision === 'hire' ? 'decision-hire' : 'decision-automate'}>
                {r.aiVerdictDecision === 'hire' ? 'HIRE' : 'AUTOMATE'}
              </span>
            </p>
          </div>
        </PaperCard>
      ))}

      <PaperCard attach="pin" pin="yellow" tilt={-0.2} centered className="closing-line">
        <p>
          While you were racing to save a fictional job from automation, an AI
          was quietly competing against you on the real task in front of you
          the whole time.
        </p>
      </PaperCard>
    </Scene>
  );
}
