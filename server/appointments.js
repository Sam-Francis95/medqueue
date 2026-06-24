const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const notifier = require('./notifier');

const DATA_FILE = path.join(__dirname, 'appointments.json');

function initializeFile() {
  if (!fs.existsSync(DATA_FILE)) {
    fs.writeFileSync(DATA_FILE, JSON.stringify({}));
  }
}

function getAll() {
  initializeFile();
  try {
    const data = fs.readFileSync(DATA_FILE, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    console.error('Error reading appointments file:', error);
    return {};
  }
}

function saveAll(data) {
  try {
    fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2));
  } catch (error) {
    console.error('Error writing appointments file:', error);
  }
}

function getAppointments(date) {
  const data = getAll();
  return data[date] || [];
}

function addAppointment(appt) {
  const data = getAll();
  if (!data[appt.date]) {
    data[appt.date] = [];
  }
  const newAppt = {
    ...appt, // should include phone if provided
    id: crypto.randomBytes(8).toString('hex'),
    status: 'Scheduled',
    createdAt: Date.now()
  };
  data[appt.date].push(newAppt);
  
  // Sort by time
  data[appt.date].sort((a, b) => a.time.localeCompare(b.time));
  
  saveAll(data);
  
  if (appt.phone) {
    notifier.sendSMS(
      appt.phone, 
      `Hi ${appt.name}, your appointment is confirmed for ${appt.date} at ${appt.time}.`,
      appt.name
    );
  }
  
  return newAppt;
}

function updateAppointment(id, date, updates) {
  const data = getAll();
  if (!data[date]) return null;
  
  const index = data[date].findIndex(a => a.id === id);
  if (index !== -1) {
    data[date][index] = { ...data[date][index], ...updates };
    // If time was updated, re-sort
    if (updates.time) {
      data[date].sort((a, b) => a.time.localeCompare(b.time));
    }
    saveAll(data);
    return data[date][index];
  }
  return null;
}

function deleteAppointment(id, date) {
  const data = getAll();
  if (!data[date]) return false;
  
  const initialLength = data[date].length;
  data[date] = data[date].filter(a => a.id !== id);
  
  if (data[date].length < initialLength) {
    saveAll(data);
    return true;
  }
  return false;
}

module.exports = {
  getAppointments,
  addAppointment,
  updateAppointment,
  deleteAppointment
};
