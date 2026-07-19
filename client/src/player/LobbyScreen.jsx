import React from 'react';
import Scene from '../components/Scene.jsx';
import PaperCard from '../components/PaperCard.jsx';

export default function LobbyScreen({ name, setName, onJoin, error, connected }) {
  return (
    <Scene type="lobby">
      <div className="masthead">
        <span className="kicker">Chào mừng đến phòng nhân sự</span>
        <h1>VƯỢT QUA TỰ ĐỘNG HÓA</h1>
      </div>

      <PaperCard attach="pin" pin="yellow" tilt={-0.8} centered>
        <form onSubmit={onJoin}>
          <label htmlFor="name">Tên bạn</label>
          <input
            id="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            maxLength={30}
            autoFocus
            placeholder="ví dụ: Nam"
          />
          <button type="submit" className="btn btn-block" disabled={!connected}>
            Vào Game
          </button>
        </form>
      </PaperCard>

      <p className="disclaimer">
        Mọi hồ sơ bạn nhập đều được chia sẻ với lớp.
      </p>

      {error && <p className="error">{error}</p>}
    </Scene>
  );
}
