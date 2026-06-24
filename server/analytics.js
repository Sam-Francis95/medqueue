const fs = require('fs');
const path = require('path');

const DATA_FILE = path.join(__dirname, 'analytics.json');

function initializeFile() {
  if (!fs.existsSync(DATA_FILE)) {
    fs.writeFileSync(DATA_FILE, JSON.stringify([]));
  }
}

function getAnalytics() {
  initializeFile();
  try {
    const data = fs.readFileSync(DATA_FILE, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    console.error('Error reading analytics file:', error);
    return [];
  }
}

function saveAnalytics(data) {
  try {
    fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2));
  } catch (error) {
    console.error('Error writing analytics file:', error);
  }
}

function saveDailyStats(summary) {
  const data = getAnalytics();
  
  // Create a record for today
  const record = {
    date: new Date().toISOString().split('T')[0],
    timestamp: Date.now(),
    patientsSeen: summary.patientsSeen || 0,
    patientsSkipped: summary.patientsSkipped || 0,
    averageConsultation: summary.averageConsultation || 0,
    totalBreakTime: summary.totalBreakTime || 0,
    consultationsPerHour: summary.consultationsPerHour || {}
  };
  
  // If a record for today already exists (e.g., closing clinic multiple times), overwrite it
  const existingIndex = data.findIndex(d => d.date === record.date);
  if (existingIndex !== -1) {
    // Merge or overwrite? Let's overwrite for simplicity, 
    // or add to it if we want to support multiple closures per day.
    // For now, overwrite is safest to prevent duplicate counting if they just tested the button.
    data[existingIndex] = record;
  } else {
    data.push(record);
  }
  
  // Keep only the last 365 days
  if (data.length > 365) {
    data.shift();
  }
  
  saveAnalytics(data);
  return record;
}

module.exports = {
  getAnalytics,
  saveDailyStats,
  saveAnalytics
};
