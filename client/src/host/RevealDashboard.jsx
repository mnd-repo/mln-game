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
          <h2 className="paper-title" style={{ fontSize: '1.6rem' }}>Trước khi xem kết quả…</h2>
          <p className="twist-line">
            Mục đích của Game này là gì?
          </p>
          <button className="btn" onClick={() => setTwistShown(true)}>Xem kết quả</button>
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
        <h1>KẾT QUẢ CUỐI CÙNG</h1>
      </div>

      <PaperCard attach="pin" pin="blue" tilt={-0.3} centered>
        <h2 className="paper-title">Tỷ lệ duyệt</h2>
        <div className="stat-row">
          <div className="stat">
            <span className="stat-label">Hồ sơ của bạn</span>
            <span className="stat-value human">{pct(avgHuman)}</span>
          </div>
          <div className="stat">
            <span className="stat-label">Hồ sơ AI</span>
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
          <h3 className="job-title">Vòng {r.roundNumber}: {r.jobTitle}</h3>
          <p className="job-seeker-name">Ứng viên: {r.jobSeekerName}</p>

          <div className="resume-compare">
            <div className="resume-block">
              <h4><span className="pushpin pin-blue" style={{ position: 'static', width: 10, height: 10 }} />Hồ sơ của người</h4>
              <p>{r.humanResume}</p>
              <p className="approval">Được duyệt: {pct(r.humanApprovalRate)} ({r.humanVotes} phiếu)</p>
            </div>
            <div className="resume-block is-ai">
              <h4><span className="pushpin pin-red" style={{ position: 'static', width: 10, height: 10 }} />Hồ sơ AI</h4>
              <p>{r.aiResume}</p>
              <p className="approval">Được duyệt: {pct(r.aiApprovalRate)} ({r.aiVotes} phiếu)</p>
            </div>
          </div>

          <div className="ai-verdict">
            <strong>AI phán quyết hồ sơ của bạn...</strong>
            <p>
              "{r.aiVerdictReasoning}" — Quyết định:{' '}
              <span className={r.aiVerdictDecision === 'hire' ? 'decision-hire' : 'decision-automate'}>
                {r.aiVerdictDecision === 'hire' ? 'GIỮ VIỆC' : 'TỰ ĐỘNG HÓA'}
              </span>
            </p>
          </div>
        </PaperCard>
      ))}

      <PaperCard attach="pin" pin="yellow" tilt={-0.2} centered className="closing-line">
        <p>
          Trong khi nhập vai nhưng người ảnh hưởng bởi tự động hóa... 
          Chính bạn cũng đang đối diện với tiềm nguy của AI
        </p>
      </PaperCard>
    </Scene>
  );
}
