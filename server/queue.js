const history = require('./history');
const db = require('./database');
const notifier = require('./notifier');

let setupConfig = null;
let currentToken = 1;

// Lists
let waiting = [];     // Lane 3
let returned = [];    // Lane 2
let skipped = [];     // Skipped, waiting to return
let completed = [];   // Finished consultations
let called = null;    // Currently called patient
let withDoctor = null;// Lane 1
let pharmacyQueue = [];
let xrayQueue = [];

// Stats
let isBreak = false;
let breakStartTime = null;
let totalBreakTime = 0; // seconds
let patientsSeen = 0;
let patientsSkipped = 0;
let realConsultations = []; // Last 5 durations in minutes
let rollingAverage = 0;
let consultationsPerHour = {};

// Internal timer reference
let confirmationTimer = null;

function getConfig() {
  return setupConfig;
}

function setConfig(config) {
  setupConfig = config;
  rollingAverage = config.defaultTime || 15;
}

function getState() {
  // Combine for the frontend queue table
  const allPatients = [
    ...completed.map(p => ({ ...p, status: 'Completed' })),
    ...(withDoctor ? [{ ...withDoctor, status: 'With Doctor' }] : []),
    ...(called ? [{ ...called, status: 'Called' }] : []),
    ...returned.map(p => ({ ...p, status: 'Returned' })),
    ...waiting.map(p => ({ ...p, status: 'Waiting' })),
    ...skipped.map(p => ({ ...p, status: 'Skipped' })),
    ...pharmacyQueue.map(p => ({ ...p, status: 'Pharmacy' })),
    ...xrayQueue.map(p => ({ ...p, status: 'X-Ray' }))
  ];

  return {
    setupConfig,
    lists: {
      withDoctor,
      called,
      returned,
      waiting,
      skipped,
      completed,
      pharmacyQueue,
      xrayQueue
    },
    allPatients,
    isBreak,
    stats: {
      patientsSeen,
      patientsSkipped,
      rollingAverage,
      totalBreakTime,
      consultationsPerHour
    }
  };
}

function checkDuplicateName(name) {
  const state = getState();
  return state.allPatients.some(p => p.name.toLowerCase() === name.toLowerCase());
}

function addPatient(nameOrObj, ageArg = null) {
  let name, age, phone, isAppointment, note;
  if (typeof nameOrObj === 'object') {
    name = nameOrObj.name;
    age = nameOrObj.age;
    phone = nameOrObj.phone;
    isAppointment = nameOrObj.isAppointment;
    note = nameOrObj.note;
  } else {
    name = nameOrObj;
    age = ageArg;
  }

  const patient = { 
    token: currentToken++, 
    name, 
    age, 
    phone,
    isAppointment,
    note,
    skipCount: 0, 
    addedAt: Date.now() 
  };
  
  waiting.push(patient);
  
  if (phone) {
    notifier.sendSMS(
      phone, 
      `Hi ${name}, you've joined the live queue. You are number ${waiting.length} in line.`,
      name
    );
  }
  
  return patient;
}

function callNext(io) {
  if (called || withDoctor) return false;

  if (returned.length > 0) {
    called = returned.shift();
  } else if (waiting.length > 0) {
    called = waiting.shift();
  } else {
    return false;
  }

  // Start confirmation timer
  const waitSeconds = (setupConfig && setupConfig.walkTime === 'same') ? 60 : 180;
  
  called.callStartTime = Date.now();
  called.waitSeconds = waitSeconds;
  
  if (confirmationTimer) clearTimeout(confirmationTimer);
  
  confirmationTimer = setTimeout(() => {
    skipPatient(io, true);
  }, waitSeconds * 1000);

  // Send SMS to the Called patient
  if (called.phone) {
    notifier.sendSMS(
      called.phone, 
      `Hi ${called.name}, it's your turn! Please proceed to the doctor's office immediately.`,
      called.name
    );
  }

  // Send "Almost There" SMS to the patient who is now 2nd in line
  if (waiting.length >= 2) {
    const nextInLine = waiting[1];
    if (nextInLine.phone && !nextInLine.alertedAlmostThere) {
      nextInLine.alertedAlmostThere = true; // Prevent spamming
      notifier.sendSMS(
        nextInLine.phone,
        `Hi ${nextInLine.name}, you are almost up! Please ensure you are near the clinic.`,
        nextInLine.name
      );
    }
  }

  return true;
}

function confirmPresent(io) {
  if (!called) return false;
  
  if (confirmationTimer) {
    clearTimeout(confirmationTimer);
    confirmationTimer = null;
  }

  withDoctor = { ...called, startTime: Date.now() };
  called = null;
  return true;
}

function skipPatient(io, isAuto = false) {
  if (!called) return false;

  if (confirmationTimer) {
    clearTimeout(confirmationTimer);
    confirmationTimer = null;
  }

  called.skipCount++;
  patientsSkipped++;

  if (called.skipCount >= 2) {
    // Second skip -> end of waiting queue
    waiting.push(called);
  } else {
    // First skip -> skipped list
    skipped.push(called);
  }

  called = null;
  
  // Auto call next if it was an auto-skip
  if (isAuto) {
    io.emit('token:skipped');
    callNext(io);
    io.emit('queue:updated', getState());
  }

  return true;
}

function returnPatient(token) {
  const index = skipped.findIndex(p => p.token === token);
  if (index !== -1) {
    const patient = skipped.splice(index, 1)[0];
    returned.push(patient);
    return true;
  }
  return false;
}

function endConsultation(io) {
  if (!withDoctor) return false;

  const durationMs = Date.now() - withDoctor.startTime;
  const durationMins = durationMs / 60000;

  const hour = new Date().getHours();
  consultationsPerHour[hour] = (consultationsPerHour[hour] || 0) + 1;

  // Add to real consultations
  realConsultations.push(durationMins);
  if (realConsultations.length > 5) {
    realConsultations.shift();
  }

  // Update rolling average
  if (realConsultations.length >= 3) {
    const sum = realConsultations.reduce((a, b) => a + b, 0);
    rollingAverage = parseFloat((sum / realConsultations.length).toFixed(1));
  }

  // Save to history
  saveToHistory(durationMins);

  patientsSeen++;
  
  // Save to permanent CRM database
  db.savePatient(withDoctor);
  
  completed.push(withDoctor);
  withDoctor = null;

  return true;
}

function transferPatient(io, department) {
  if (!withDoctor) return false;

  const durationMins = (Date.now() - withDoctor.startTime) / 60000;
  saveToHistory(durationMins);
  patientsSeen++;
  db.savePatient(withDoctor);

  const p = { ...withDoctor, addedAt: Date.now() }; // reset time for the new queue
  if (department === 'Pharmacy') {
    pharmacyQueue.push(p);
  } else if (department === 'X-Ray') {
    xrayQueue.push(p);
  }

  withDoctor = null;
  return true;
}

function completeSecondary(token, department) {
  let list = department === 'Pharmacy' ? pharmacyQueue : xrayQueue;
  const index = list.findIndex(p => p.token === token);
  if (index !== -1) {
    const p = list.splice(index, 1)[0];
    completed.push(p);
    return true;
  }
  return false;
}

function saveToHistory(durationMins) {
  if (!setupConfig) return;
  const h = history.getHistory();
  const date = new Date();
  const day = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'][date.getDay()];
  const hour = date.getHours();
  const slot = setupConfig.mode === 'Holiday' ? `holiday_${hour}` : `${day}_${hour}`;
  
  if (!h[slot]) {
    h[slot] = [];
  }
  h[slot].push(durationMins);
  history.saveHistory(h);
}

function toggleBreak() {
  isBreak = !isBreak;
  if (isBreak) {
    breakStartTime = Date.now();
  } else {
    if (breakStartTime) {
      totalBreakTime += Math.floor((Date.now() - breakStartTime) / 1000);
      breakStartTime = null;
    }
  }
  return isBreak;
}

function closeDay() {
  const summary = {
    patientsSeen,
    averageConsultation: rollingAverage,
    totalBreakTime,
    patientsSkipped,
    consultationsPerHour
  };
  
  // Reset state for next day
  setupConfig = null;
  currentToken = 1;
  waiting = [];
  returned = [];
  skipped = [];
  completed = [];
  pharmacyQueue = [];
  xrayQueue = [];
  called = null;
  withDoctor = null;
  isBreak = false;
  breakStartTime = null;
  totalBreakTime = 0;
  patientsSeen = 0;
  patientsSkipped = 0;
  realConsultations = [];
  rollingAverage = 0;
  consultationsPerHour = {};

  return summary;
}

function findPatientRef(token) {
  if (withDoctor && withDoctor.token === token) return withDoctor;
  if (called && called.token === token) return called;
  let p = returned.find(p => p.token === token);
  if (p) return p;
  p = waiting.find(p => p.token === token);
  if (p) return p;
  p = skipped.find(p => p.token === token);
  if (p) return p;
  p = completed.find(p => p.token === token);
  return p;
}

function markEmergency(token) {
  const index = waiting.findIndex(p => p.token === token);
  if (index !== -1) {
    const patient = waiting.splice(index, 1)[0];
    patient.isEmergency = true;
    waiting.unshift(patient);
    return true;
  }
  const retIndex = returned.findIndex(p => p.token === token);
  if (retIndex !== -1) {
    const patient = returned.splice(retIndex, 1)[0];
    patient.isEmergency = true;
    returned.unshift(patient);
    return true;
  }
  return false;
}

function editPatient(token, name, age) {
  const p = findPatientRef(token);
  if (p) {
    p.name = name;
    p.age = age;
    return true;
  }
  return false;
}

function addNote(token, note) {
  const p = findPatientRef(token);
  if (p) {
    p.note = note;
    return true;
  }
  return false;
}

module.exports = {
  getConfig,
  setConfig,
  getState,
  checkDuplicateName,
  addPatient,
  callNext,
  confirmPresent,
  skipPatient,
  returnPatient,
  endConsultation,
  toggleBreak,
  closeDay,
  markEmergency,
  editPatient,
  addNote,
  transferPatient,
  completeSecondary
};
