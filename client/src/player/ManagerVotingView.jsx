import React, { useState } from 'react';
import CountdownBar from '../CountdownBar.jsx';
import Scene from '../components/Scene.jsx';
import PaperCard from '../components/PaperCard.jsx';
import StampButton from '../components/StampButton.jsx';

export default function ManagerVotingView({ jobTitle, jobDescription, candidateResume, deadline, onVote }) {
  const [voted, setVoted] = useState(null);

  function handleVote(decision) {
    if (voted) return;
    setVoted(decision);
    onVote(decision);
  }

  return (
    <Scene type="manager">
      <PaperCard attach="pin" pin="blue" tilt={-0.4} centered stack={false}>
        <h3 className="job-title">{jobTitle}</h3>
        <p className="job-desc">{jobDescription}</p>
        <CountdownBar deadline={deadline} soundKey="manager-countdown" />
      </PaperCard>

      <PaperCard attach="tape" tilt={0.5}>
        <div className="resume-display">
          <h3>Candidate's Resume</h3>
          <p>{candidateResume}</p>
        </div>

        <p className="hand-note centered" style={{ textAlign: 'center' }}>
          Do we hire this human, or automate the job?
        </p>
        <div className="stamp-row">
          <StampButton
            label="Hire"
            variant="hire"
            onClick={() => handleVote('hire')}
            disabled={Boolean(voted)}
            stamped={voted === 'hire'}
          />
          <StampButton
            label="Automate"
            variant="automate"
            onClick={() => handleVote('automate')}
            disabled={Boolean(voted)}
            stamped={voted === 'automate'}
          />
        </div>
        {voted && <p className="hint centered" style={{ textAlign: 'center' }}>Stamped. Waiting for other Managers…</p>}
      </PaperCard>
    </Scene>
  );
}
