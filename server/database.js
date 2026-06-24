const fs = require('fs');
const path = require('path');

const DB_PATH = path.join(__dirname, 'patients.json');

function getPatients() {
  if (!fs.existsSync(DB_PATH)) {
    return [];
  }
  const data = fs.readFileSync(DB_PATH, 'utf8');
  try {
    return JSON.parse(data);
  } catch (e) {
    return [];
  }
}

function savePatient(patient) {
  const patients = getPatients();
  
  // Use name as primary key for now since we don't have phone numbers
  const existing = patients.find(p => p.name.toLowerCase() === patient.name.toLowerCase());
  
  if (existing) {
    existing.age = patient.age || existing.age;
    existing.lastVisit = Date.now();
    existing.visits = (existing.visits || 1) + 1;
    if (patient.note) existing.lastNote = patient.note;
  } else {
    patients.push({
      id: Date.now().toString(),
      name: patient.name,
      age: patient.age || null,
      firstVisit: Date.now(),
      lastVisit: Date.now(),
      visits: 1,
      lastNote: patient.note || null
    });
  }
  
  fs.writeFileSync(DB_PATH, JSON.stringify(patients, null, 2));
}

module.exports = { getPatients, savePatient };
