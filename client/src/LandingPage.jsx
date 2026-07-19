import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Scene from './components/Scene.jsx';
import PaperCard from './components/PaperCard.jsx';

export default function LandingPage() {
  const navigate = useNavigate();
  const [code, setCode] = useState('');
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState(null);

  async function createGame() {
    setCreating(true);
    setError(null);
    try {
      const res = await fetch('/api/games', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ roundsTotal: 5 })
      });
      const data = await res.json();
      sessionStorage.setItem(`hostToken:${data.gameId}`, data.hostToken);
      sessionStorage.setItem(`code:${data.gameId}`, data.code);
      navigate(`/host/${data.gameId}`);
    } catch (e) {
      setError('Could not create game. Is the server running?');
      setCreating(false);
    }
  }

  function joinGame(e) {
    e.preventDefault();
    if (!code.trim()) return;
    navigate(`/play/${code.trim().toUpperCase()}`);
  }

  return (
    <Scene type="lobby">
      <div className="masthead">
        <span className="kicker">HR presents a hiring exercise</span>
        <h1>THE AUTOMATION TEST</h1>
        <p className="subtitle">Pin your resume to the board. Management decides your fate.</p>
      </div>

      <PaperCard attach="pin" pin="blue" tilt={-1.1} centered>
        <h2 className="paper-title">Host a game</h2>
        <p className="job-desc">Create a room and put it up on the big screen.</p>
        <button className="btn btn-block" onClick={createGame} disabled={creating}>
          {creating ? 'Setting up the board…' : 'Create Game'}
        </button>
      </PaperCard>

      <PaperCard attach="tape" tilt={0.8} centered>
        <h2 className="paper-title">Join a game</h2>
        <p className="job-desc">Got a code from the host? Pin in here.</p>
        <form onSubmit={joinGame}>
          <input
            placeholder="Enter join code"
            value={code}
            onChange={(e) => setCode(e.target.value)}
            maxLength={5}
          />
          <button type="submit" className="btn btn-accent btn-block">Join</button>
        </form>
      </PaperCard>

      {error && <p className="error">{error}</p>}
    </Scene>
  );
}
