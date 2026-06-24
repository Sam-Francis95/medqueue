export function calculatePosition(patientToken, lists) {
  // Ordered array representing the flow: With Doctor -> Called -> Returned -> Waiting
  const ordered = [
    ...(lists.withDoctor ? [lists.withDoctor] : []),
    ...(lists.called ? [lists.called] : []),
    ...lists.returned,
    ...lists.waiting
  ];

  const idx = ordered.findIndex(p => p.token === patientToken);
  
  if (idx === -1) return 0;
  
  return idx;
}

export function calculateETA(patient, queueState, historyData, returnFormat = 'minutes') {
  const { lists, stats, setupConfig } = queueState;
  
  // Layer 1: Rolling Average
  const rollingAverage = stats.rollingAverage;

  // Layer 2: Per Patient Positional ETA
  const position = calculatePosition(patient.token, lists);
  let baseEtaMins = position * rollingAverage;

  // Subtract time already spent by the current patient with the doctor
  if (lists.withDoctor && lists.withDoctor.startTime && position > 0) {
    const elapsedMins = (Date.now() - lists.withDoctor.startTime) / 60000;
    // If doctor is running overtime, we keep a minimum 1 minute wait for the immediate next person
    const subtractedTime = Math.min(elapsedMins, rollingAverage - 1);
    baseEtaMins -= subtractedTime;
  }

  // Layer 3: Historical Correction
  if (setupConfig) {
    const date = new Date();
    const day = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'][date.getDay()];
    const hour = date.getHours();
    const slot = setupConfig.mode === 'Holiday' ? `holiday_${hour}` : `${day}_${hour}`;

    const modeData = historyData?.[slot] || [];
    if (modeData.length >= 3) {
      const histAvg = modeData.reduce((a, b) => a + b, 0) / modeData.length;
      
      let multiplier = histAvg / rollingAverage;
      // Cap multiplier between 0.5 and 2.0 to prevent extreme values
      multiplier = Math.max(0.5, Math.min(2.0, multiplier));
      
      baseEtaMins = baseEtaMins * multiplier;
    }
  }

  if (returnFormat === 'seconds') {
    return Math.max(0, Math.floor(baseEtaMins * 60));
  }
  
  return Math.max(0, Math.round(baseEtaMins));
}

export function formatETA(d) {
  if (!d) return '';
  return d.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
}
