import React, { useCallback, useState } from 'react';
import { useParams } from 'react-router-dom';
import { useGameSocket } from '../hooks/useGameSocket.js';
import RevealDashboard from './RevealDashboard.jsx';
import CountdownBar from '../CountdownBar.jsx';
import Scene from '../components/Scene.jsx';
import PaperCard from '../components/PaperCard.jsx';

function RoundTabs({ current, total }) {
  if (!total) return null;
  return (
    <div className="round-tabs">
      {Array.from({ length: total }, (_, i) => i + 1).map((n) => (
          <span
            key={n}
            className={`round-tab${n === current ? ' current' : n < current ? ' done' : ''}`}
          >
            Vòng {n}
          </span>
        ))}
      </div>
    );
  }

  export default function HostApp() {
    const { gameId } = useParams();
    const [code, setCode] = useState(sessionStorage.getItem(`code:${gameId}`) || '');
    const [roster, setRoster] = useState({ players: [], status: 'lobby', currentRound: 0, roundsTotal: 5 });
    const [phase, setPhase] = useState({ view: 'lobby' });
    const [dashboard, setDashboard] = useState(null);

    const onMessage = useCallback((type, payload) => {
      switch (type) {
        case 'host_connected':
          setCode(payload.code);
          break;
        case 'roster_update':
          setRoster(payload);
          break;
        case 'round_start':
          setPhase({ view: 'writing', ...payload });
          break;
        case 'resume_locked':
          setPhase((p) => ({ ...p, view: 'evaluating' }));
          break;
        case 'voting_start':
          setPhase({ view: 'voting', ...payload });
          break;
        case 'round_result':
          setPhase({ view: 'result', ...payload });
          break;
        case 'game_reveal':
          setDashboard(payload);
          setPhase({ view: 'reveal' });
          break;
        case 'error':
          alert(payload.message);
          break;
      }
    }, []);

    const { send, connected } = useGameSocket(onMessage);

    React.useEffect(() => {
      const hostToken = sessionStorage.getItem(`hostToken:${gameId}`);
      if (connected && hostToken) {
        send('host_connect', { gameId, hostToken });
      }
    }, [connected, gameId, send]);

    if (phase.view === 'reveal' && dashboard) {
      return <RevealDashboard dashboard={dashboard} />;
    }

    const sceneType = phase.view === 'writing' ? 'writer' : phase.view === 'voting' || phase.view === 'result' ? 'manager' : 'lobby';

    return (
      <Scene type={sceneType} wide>
        <div className="masthead">
          <h1>VƯỢT QUA TỰ ĐỘNG HÓA</h1>
          <p className="join-code-banner">
            Tham gia tại <strong>{window.location.host}</strong> với mã phòng
            <span className="code">{code}</span>
          </p>
        </div>

        {phase.view !== 'lobby' && <RoundTabs current={phase.roundNumber} total={phase.roundsTotal || roster.roundsTotal} />}

        {phase.view === 'lobby' && (
          <PaperCard attach="pin" pin="blue" tilt={-0.4} centered>
            <h2 className="paper-title">Người chơi ({roster.players.length})</h2>
            <ul className="roster-list">
              {roster.players.map((p) => (
                <li key={p.id}>{p.name}</li>
              ))}
            </ul>
            {roster.players.length === 0 && <p className="hint">Đang đợi người chơi tham gia…</p>}
            <button className="btn" disabled={roster.players.length < 4} onClick={() => send('start_game', {})}>
              Bắt đầu
            </button>
            {roster.players.length < 4 && <p className="hint">Cần ít nhất 4 người chơi để bắt đầu.</p>}
          </PaperCard>
        )}

        {phase.view === 'writing' && (
          <PaperCard attach="pin" pin="red" tilt={-0.5} centered>
            <p className="round-label">Vòng {phase.roundNumber} / {phase.roundsTotal}</p>
            <h2 className="paper-title">{phase.jobTitle}</h2>
            <p className="job-desc">{phase.jobDescription}</p>
            <CountdownBar deadline={phase.deadline} />
            <p className="hand-note">Ứng viên đang viết hồ sơ…</p>
          </PaperCard>
        )}

        {phase.view === 'evaluating' && (
          <PaperCard attach="pin" pin="yellow" tilt={0.4} centered>
            <h2 className="paper-title">Đang xem xét hồ sơ…</h2>
            <p className="hint">Ban quản lý bỏ phiếu trong giây lát.</p>
          </PaperCard>
        )}

        {phase.view === 'voting' && (
          <PaperCard attach="pin" pin="blue" tilt={-0.3} centered>
            <h2 className="paper-title">{phase.jobTitle}</h2>
            <CountdownBar deadline={phase.deadline} />
            <p className="hand-note">Ban quản lý bỏ phiếu: Thuê hay Tự động hóa?</p>
          </PaperCard>
        )}

        {phase.view === 'result' && (
          <PaperCard attach="pin" pin="green" tilt={0.3} centered>
            <h2 className="paper-title">Bỏ phiếu hoàn thành</h2>
            <p className="hint">Khóa phiếu. Kết quả được tiết lộ sau.</p>
          </PaperCard>
        )}
      </Scene>
    );
  }
