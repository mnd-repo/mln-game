import React from 'react';
import Scene from '../components/Scene.jsx';
import PaperCard from '../components/PaperCard.jsx';

export default function LobbyScreen({ name, setName, onJoin, error, connected }) {
  return (
    <Scene type="lobby">
      <div className="masthead">
        <span className="kicker">HR presents a hiring exercise</span>
        <h1>THE AUTOMATION TEST</h1>
      </div>

      <PaperCard attach="pin" pin="yellow" tilt={-0.8} centered>
        <form onSubmit={onJoin}>
          <label htmlFor="name">Your name</label>
          <input
            id="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            maxLength={30}
            autoFocus
            placeholder="e.g. Jordan"
          />
          <button type="submit" className="btn btn-block" disabled={!connected}>
            Join Game
          </button>
        </form>
      </PaperCard>

      <p className="disclaimer">
        Heads up: this game involves a twist you won't see coming. Whatever you
        write or vote on during the game will be shared with the group.
      </p>

      {error && <p className="error">{error}</p>}
    </Scene>
  );
}
