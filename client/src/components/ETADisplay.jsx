import React, { useState, useEffect } from 'react';
import { calculateETA } from '../utils/eta';

export default function ETADisplay({ patient, queueState, historyData }) {
  const [eta, setEta] = useState(0);
  const [isRecalculating, setIsRecalculating] = useState(false);

  useEffect(() => {
    setIsRecalculating(true);
    const newEta = calculateETA(patient, queueState, historyData);
    setEta(newEta);
    
    const timer = setTimeout(() => {
      setIsRecalculating(false);
    }, 500);
    
    return () => clearTimeout(timer);
  }, [queueState.stats.rollingAverage, patient.status, queueState.lists.called, queueState.lists.withDoctor, queueState.lists.returned.length]);

  if (queueState.isBreak) {
    return <span className="text-amber-600 font-medium text-sm px-2 py-1 bg-amber-50 rounded-md border border-amber-200">Paused</span>;
  }

  return (
    <span className={`font-bold inline-block px-3 py-1 rounded-md bg-gray-50 border border-gray-200 min-w-[80px] text-center transition-all duration-500 ${isRecalculating ? 'text-[10px] uppercase tracking-widest text-brand-600 border-brand-300 bg-brand-50' : 'text-lg text-gray-800'}`}>
      {isRecalculating ? <span className="animate-pulse">Recalculating...</span> : `~${eta}m`}
    </span>
  );
}
