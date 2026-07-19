import React, { useState } from 'react';
import CountdownBar from '../CountdownBar.jsx';
import Scene from '../components/Scene.jsx';
import PaperCard from '../components/PaperCard.jsx';

export default function JobSeekerWritingView({ jobTitle, jobDescription, deadline, onSubmit }) {
  const [text, setText] = useState('');
  const [submitted, setSubmitted] = useState(false);

  function handleSubmit() {
    if (submitted) return;
    setSubmitted(true);
    onSubmit(text);
  }

  return (
    <Scene type="writer">
      <PaperCard attach="pin" pin="red" tilt={-0.5} centered stack={false}>
        <span className="round-label">Bạn là ứng viên Tìm việc</span>
        <h3 className="job-title">{jobTitle}</h3>
        <p className="job-desc">{jobDescription}</p>
        <CountdownBar deadline={deadline} soundKey="writer-countdown" />
        <p className="hand-note">90 giây — cần thuyết phục Ban quản lý giữ việc của bạn.</p>
      </PaperCard>

      <PaperCard attach="tape" tilt={0.6}>
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Viết hồ sơ của bạn tại đây…"
          rows={10}
          disabled={submitted}
          autoFocus
        />
        <button className="btn btn-block" onClick={handleSubmit} disabled={submitted}>
          {submitted ? 'Đã nộp' : 'Nộp hồ sơ'}
        </button>
      </PaperCard>
    </Scene>
  );
}
