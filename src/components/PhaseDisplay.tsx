import React from 'react';
import { useSelector } from 'react-redux';
import { RootState } from '../store/store';

const PhaseDisplay: React.FC = () => {
  const currentPhase = useSelector((state: RootState) => state.game.currentPhase);

  return (
    <div className="phase-display">
      <h4>Current Phase: {currentPhase}</h4>
    </div>
  );
};

export default PhaseDisplay;
