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
        <span className="round-label">You're the Job Seeker</span>
        <h3 className="job-title">{jobTitle}</h3>
        <p className="job-desc">{jobDescription}</p>
        <CountdownBar deadline={deadline} soundKey="writer-countdown" />
        <p className="hand-note">90 seconds — convince Management to keep a human here.</p>
      </PaperCard>

      <PaperCard attach="tape" tilt={0.6}>
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Write your resume here…"
          rows={10}
          disabled={submitted}
          autoFocus
        />
        <button className="btn btn-block" onClick={handleSubmit} disabled={submitted}>
          {submitted ? 'Submitted' : 'Submit Resume'}
        </button>
      </PaperCard>
    </Scene>
  );
}
