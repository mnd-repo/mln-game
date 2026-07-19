import React, { useCallback, useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { useGameSocket } from '../hooks/useGameSocket.js';
import Scene from '../components/Scene.jsx';
import PaperCard from '../components/PaperCard.jsx';
import LobbyScreen from './LobbyScreen.jsx';
import JobSeekerWritingView from './JobSeekerWritingView.jsx';
import ManagerWaitingView from './ManagerWaitingView.jsx';
import ManagerVotingView from './ManagerVotingView.jsx';
import RoundCompleteView from './RoundCompleteView.jsx';

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
        case 'round_start':
          setPhase({
            view: payload.jobSeekerId === playerId ? 'writing' : 'waiting',
            ...payload
          });
          break;
        case 'resume_locked':
          setPhase((p) => ({ ...p, view: p.jobSeekerId === playerId ? 'evaluating' : 'waiting' }));
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
    case 'evaluating':
      return (
        <Scene type="writer">
          <PaperCard attach="pin" pin="green" tilt={-0.4} centered>
            <h2 className="paper-title">Resume submitted!</h2>
            <p className="hint">Management is reviewing it now…</p>
          </PaperCard>
        </Scene>
      );
    case 'waiting':
      return <ManagerWaitingView jobTitle={phase.jobTitle} />;
    case 'seeker_waiting':
      return (
        <Scene type="writer">
          <PaperCard attach="pin" pin="yellow" tilt={0.5} centered>
            <h2 className="paper-title">Management is voting…</h2>
            <p className="hint">Hang tight while they decide.</p>
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
            <h2 className="paper-title">Game complete!</h2>
            <p className="hint">Check the host screen for the full reveal.</p>
          </PaperCard>
        </Scene>
      );
    default:
      return (
        <Scene type="lobby">
          <PaperCard attach="pin" pin="red" tilt={0.4} centered>
            <h2 className="paper-title">You're in!</h2>
            <p className="hint">Waiting for the host to start the game…</p>
            <p className="hand-note">{roster.players.length} players connected</p>
          </PaperCard>
        </Scene>
      );
  }
}
