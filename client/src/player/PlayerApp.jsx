import React, { useCallback, useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { useGameSocket } from '../hooks/useGameSocket.js';
import Scene from '../components/Scene.jsx';
import PaperCard from '../components/PaperCard.jsx';
import LobbyScreen from './LobbyScreen.jsx';
import JobSeekerWritingView from './JobSeekerWritingView.jsx';
import ManagerVotingView from './ManagerVotingView.jsx';
import RoundCompleteView from './RoundCompleteView.jsx';
import WritingPhaseWaitView from './WritingPhaseWaitView.jsx';
import WriterSubmittedView from './WriterSubmittedView.jsx';

export default function PlayerApp() {
  const { code } = useParams();
  const [playerId, setPlayerId] = useState(() => sessionStorage.getItem(`playerId:${code}`));
  const [name, setName] = useState('');
  const [joined, setJoined] = useState(!!playerId);
  const [roster, setRoster] = useState({ players: [], status: 'lobby' });
  const [phase, setPhase] = useState({ view: 'lobby' });
  const [error, setError] = useState(null);

  const onMessage = useCallback(
    (type, payload) => {
      switch (type) {
        case 'joined':
          setPlayerId(payload.playerId);
          sessionStorage.setItem(`playerId:${code}`, payload.playerId);
          setJoined(true);
          break;
        case 'roster_update':
          setRoster(payload);
          break;
        case 'writing_phase_start':
          // Sent only to non-writers (spectators): generic screen, no job details.
          setPhase({ view: 'writing_wait', ...payload });
          break;
        case 'round_start':
          // Sent privately only to the player who was assigned to write this job.
          setPhase({ view: 'writing', ...payload });
          break;
        case 'resume_locked':
          // Sent privately to a writer once their own resume is locked in.
          setPhase((p) => ({ ...p, view: 'writer_submitted' }));
          break;
        case 'voting_start':
          setPhase({
            view: payload.isJobSeeker ? 'seeker_waiting' : 'voting',
            ...payload
          });
          break;
        case 'round_result':
          setPhase({ view: 'result', ...payload });
          break;
        case 'game_reveal':
          setPhase({ view: 'game_over' });
          break;
        case 'error':
          setError(payload.message);
          break;
      }
    },
    [playerId, code]
  );

  const { send, connected } = useGameSocket(onMessage);

  useEffect(() => {
    if (connected && playerId) {
      send('rejoin_game', { code, playerId });
    }
  }, [connected, playerId, code, send]);

  function handleJoin(e) {
    e.preventDefault();
    if (!name.trim()) return;
    send('join_game', { code, name: name.trim() });
  }

  if (!joined) {
    return (
      <LobbyScreen
        name={name}
        setName={setName}
        onJoin={handleJoin}
        error={error}
        connected={connected}
      />
    );
  }

  switch (phase.view) {
    case 'writing':
      return (
        <JobSeekerWritingView
          jobTitle={phase.jobTitle}
          jobDescription={phase.jobDescription}
          deadline={phase.deadline}
          onSubmit={(text) => send('submit_resume', { text })}
        />
      );
    case 'writer_submitted':
      return <WriterSubmittedView />;
    case 'writing_wait':
      return <WritingPhaseWaitView deadline={phase.deadline} />;
    case 'seeker_waiting':
      return (
        <Scene type="writer">
          <PaperCard attach="pin" pin="yellow" tilt={0.5} centered>
            <h2 className="paper-title">Ban quản lý đang bỏ phiếu…</h2>
            <p className="hint">Kiên nhẫn đợi quyết định.</p>
          </PaperCard>
        </Scene>
      );
    case 'voting':
      return (
        <ManagerVotingView
          jobTitle={phase.jobTitle}
          jobDescription={phase.jobDescription}
          candidateResume={phase.candidateResume}
          deadline={phase.deadline}
          onVote={(decision) => send('submit_vote', { decision })}
        />
      );
    case 'result':
      return <RoundCompleteView />;
    case 'game_over':
      return (
        <Scene type="lobby">
          <PaperCard attach="pin" pin="blue" tilt={-0.3} centered>
            <h2 className="paper-title">Kết thúc Game!</h2>
            <p className="hint">Hướng lên màn hình lớn cho kết quả.</p>
          </PaperCard>
        </Scene>
      );
    default:
      return (
        <Scene type="lobby">
          <PaperCard attach="pin" pin="red" tilt={0.4} centered>
            <h2 className="paper-title">Đã vào phòng!</h2>
            <p className="hint">Đang đợi Host bắt đầu…</p>
            <p className="hand-note">{roster.players.length} người chơi đã vào</p>
          </PaperCard>
        </Scene>
      );
  }
}
