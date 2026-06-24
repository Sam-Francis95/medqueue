const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const queue = require('./queue');
const db = require('./database');
const appointments = require('./appointments');
const analytics = require('./analytics');
const notifier = require('./notifier');
const mockData = require('./mockData');
const history = require('./history');

mockData.seedHistory();
mockData.seedAnalytics();

const app = express();
app.use(cors());
app.use(express.json());

const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: '*',
  }
});

notifier.setIO(io);

io.on('connection', (socket) => {
  console.log('Client connected:', socket.id);

  // Send initial state on connect
  socket.emit('queue:updated', queue.getState());

  // Allow client to request state (fixes race condition on page reload)
  socket.on('state:get', () => {
    socket.emit('queue:updated', queue.getState());
  });

  // Setup Config
  socket.on('setup:init', (config) => {
    queue.setConfig(config);
    io.emit('queue:updated', queue.getState());
  });

  // Patient Actions
  socket.on('patient:add', (data, callback) => {
    const isDuplicate = queue.checkDuplicateName(data.name);
    if (isDuplicate) {
      if (callback) callback({ warning: true, message: `Already registered today.` });
      return; // Stop here, client will ask for confirmation and then call patient:add_force
    }
    const p = queue.addPatient(data);
    io.emit('queue:updated', queue.getState());
    if (callback) callback({ success: true, patient: p });
  });

  socket.on('patient:add_force', (data, callback) => {
    const p = queue.addPatient(data);
    io.emit('queue:updated', queue.getState());
    if (callback) callback({ success: true, patient: p });
  });

  // Remote Tracking endpoint
  socket.on('patient:status:get', (token, callback) => {
    const state = queue.getState();
    const tokenStr = String(token);
    let patient = null;
    let status = null;
    let queuePosition = -1;

    // Search where the patient is
    if (state.lists.withDoctor && String(state.lists.withDoctor.token) === tokenStr) {
      patient = state.lists.withDoctor;
      status = 'with_doctor';
    } else if (state.lists.called && String(state.lists.called.token) === tokenStr) {
      patient = state.lists.called;
      status = 'called';
    } else {
      queuePosition = state.lists.waiting.findIndex(p => String(p.token) === tokenStr);
      if (queuePosition !== -1) {
        patient = state.lists.waiting[queuePosition];
        status = 'waiting';
      }
    }

    if (!patient) {
      if (callback) callback({ error: 'Patient not found' });
      return;
    }

    if (callback) callback({
      patient,
      status,
      queuePosition: queuePosition !== -1 ? queuePosition + 1 : 0,
      rollingAverage: state.stats.rollingAverage || 10
    });
  });

  socket.on('patient:emergency', ({ token }) => {
    queue.markEmergency(token);
    io.emit('queue:updated', queue.getState());
  });

  socket.on('patient:edit', ({ token, name, age }) => {
    queue.editPatient(token, name, age);
    io.emit('queue:updated', queue.getState());
  });

  socket.on('patient:note', ({ token, note }) => {
    queue.addNote(token, note);
    io.emit('queue:updated', queue.getState());
  });

  // Receptionist Controls
  socket.on('token:call_next', () => {
    queue.callNext(io);
    io.emit('queue:updated', queue.getState());
    io.emit('token:called'); // For any specific client-side listeners
  });

  socket.on('token:confirm', () => {
    queue.confirmPresent(io);
    io.emit('queue:updated', queue.getState());
    io.emit('token:confirmed');
  });

  socket.on('token:skip', () => {
    queue.skipPatient(io, false);
    io.emit('queue:updated', queue.getState());
    io.emit('token:skipped');
  });

  socket.on('token:return', ({ token }) => {
    queue.returnPatient(token);
    io.emit('queue:updated', queue.getState());
    io.emit('token:returned');
  });

  socket.on('consult:end', () => {
    queue.endConsultation(io);
    io.emit('queue:updated', queue.getState());
    io.emit('consult:ended');
  });

  socket.on('consult:transfer', ({ department }) => {
    queue.transferPatient(io, department);
    io.emit('queue:updated', queue.getState());
  });

  socket.on('secondary:complete', ({ token, department }) => {
    queue.completeSecondary(token, department);
    io.emit('queue:updated', queue.getState());
  });

  socket.on('break:toggle', () => {
    const isBreak = queue.toggleBreak();
    io.emit('queue:updated', queue.getState());
    if (isBreak) {
      io.emit('break:started');
    } else {
      io.emit('break:ended');
    }
  });

  socket.on('day:close', (callback) => {
    const summary = queue.closeDay();
    analytics.saveDailyStats(summary);
    io.emit('queue:updated', queue.getState());
    io.emit('day:closed');
    if (callback) callback(summary);
  });

  // History access for Layer 3 ETA
  socket.on('history:get', (callback) => {
    const h = history.getHistory();
    if (callback) callback(h);
  });

  socket.on('analytics:get', (callback) => {
    const data = analytics.getAnalytics();
    if (callback) callback(data);
  });

  // Appointments
  socket.on('appointments:get', ({ date }, callback) => {
    const data = appointments.getAppointments(date);
    if (callback) callback(data);
  });

  socket.on('appointments:add', (data, callback) => {
    const newAppt = appointments.addAppointment(data);
    io.emit('appointments:updated', { date: data.date, appointments: appointments.getAppointments(data.date) });
    if (callback) callback({ success: true, appointment: newAppt });
  });

  socket.on('appointments:update', ({ id, date, updates }, callback) => {
    const updated = appointments.updateAppointment(id, date, updates);
    if (updated) {
      io.emit('appointments:updated', { date, appointments: appointments.getAppointments(date) });
      if (callback) callback({ success: true, appointment: updated });
    } else {
      if (callback) callback({ success: false, message: 'Not found' });
    }
  });

  socket.on('appointments:delete', ({ id, date }, callback) => {
    const deleted = appointments.deleteAppointment(id, date);
    if (deleted) {
      io.emit('appointments:updated', { date, appointments: appointments.getAppointments(date) });
      if (callback) callback({ success: true });
    } else {
      if (callback) callback({ success: false });
    }
  });

  socket.on('appointments:checkin', ({ id, date }, callback) => {
    const appts = appointments.getAppointments(date);
    const appt = appts.find(a => a.id === id);
    if (!appt) {
      if (callback) callback({ success: false, message: 'Appointment not found' });
      return;
    }

    // Mark as checked in
    appointments.updateAppointment(id, date, { status: 'CheckedIn' });
    io.emit('appointments:updated', { date, appointments: appointments.getAppointments(date) });

    // Add to live queue
    const patientAdded = queue.addPatient({ 
      name: appt.name, 
      age: appt.age, 
      isAppointment: true,
      note: appt.note
    });

    if (patientAdded) {
      io.emit('queue:updated', queue.getState());
      if (callback) callback({ success: true });
    } else {
      if (callback) callback({ success: false, message: 'Failed to add to queue' });
    }
  });

  // Patient Database (CRM) access
  socket.on('db:patients:get', (callback) => {
    const db = require('./database');
    if (callback) callback(db.getPatients());
  });

  socket.on('disconnect', () => {
    console.log('Client disconnected:', socket.id);
  });
});

const PORT = process.env.PORT || 4000;
server.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});
