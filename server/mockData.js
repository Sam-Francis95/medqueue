const history = require('./history');

function seedHistory() {
  const h = history.getHistory();
  if (Object.keys(h).length > 0) return;

  const DAYS = ['monday','tuesday','wednesday','thursday','friday','saturday'];
  const HOURS = [9,10,11,12,13,14,15,16];
  const BASE = 5;

  function jitter(val, pct) {
    return parseFloat((val * (1 + (Math.random() - 0.5) * pct)).toFixed(1));
  }

  function getMultiplier(hour) {
    if (hour === 10 || hour === 11) return 1.6;
    if (hour === 13 || hour === 14) return 0.75;
    return 1.0;
  }

  for (let d = 0; d < 7; d++) {
    const dayName = DAYS[d % DAYS.length];
    HOURS.forEach(hour => {
      const key = `${dayName}_${hour}`;
      const mult = getMultiplier(hour);
      const entries = [];
      const count = Math.floor(Math.random() * 3) + 3;
      for (let i = 0; i < count; i++) {
        entries.push(jitter(BASE * mult, 0.3));
      }
      h[key] = entries;
    });
  }

  history.saveHistory(h);
  console.log('ClinicFlow: mock history seeded -', Object.keys(h).length, 'slots');
}

function seedAnalytics() {
  const analytics = require('./analytics');
  const data = analytics.getAnalytics();
  if (data.length > 0) return;

  const now = Date.now();
  const ONE_DAY = 24 * 60 * 60 * 1000;
  
  for (let i = 30; i >= 1; i--) {
    const d = new Date(now - (i * ONE_DAY));
    // Skip Sundays
    if (d.getDay() === 0) continue;
    
    // Randomize data
    const patientsSeen = Math.floor(Math.random() * 20) + 20; // 20-40 patients
    const patientsSkipped = Math.floor(Math.random() * 3);
    const averageConsultation = parseFloat((Math.random() * 4 + 8).toFixed(1)); // 8-12 mins
    const totalBreakTime = Math.floor(Math.random() * 1800) + 1800; // 30-60 mins in seconds
    
    // Hourly distribution curve (bell shape around 11am and 4pm)
    const consultationsPerHour = {
      9: Math.floor(patientsSeen * 0.1),
      10: Math.floor(patientsSeen * 0.15),
      11: Math.floor(patientsSeen * 0.2),
      12: Math.floor(patientsSeen * 0.1),
      13: Math.floor(patientsSeen * 0.05), // Lunch dip
      14: Math.floor(patientsSeen * 0.1),
      15: Math.floor(patientsSeen * 0.15),
      16: Math.floor(patientsSeen * 0.1),
      17: Math.floor(patientsSeen * 0.05)
    };

    data.push({
      date: d.toISOString().split('T')[0],
      timestamp: d.getTime(),
      patientsSeen,
      patientsSkipped,
      averageConsultation,
      totalBreakTime,
      consultationsPerHour
    });
  }
  
  analytics.saveAnalytics(data);
  console.log('ClinicFlow: mock analytics seeded -', data.length, 'days');
}

module.exports = { seedHistory, seedAnalytics };
