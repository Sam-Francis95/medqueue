let ioInstance = null;

function setIO(io) {
  ioInstance = io;
}

function sendSMS(phone, message, patientName) {
  if (!phone) return;
  
  // Simulate network delay
  setTimeout(() => {
    console.log(`[SIMULATED SMS] To: ${phone} | Msg: ${message}`);
    
    // Emit to frontend Receptionist to show a Toast notification
    if (ioInstance) {
      ioInstance.emit('notification:simulated', {
        type: 'sms',
        phone,
        patientName,
        message,
        timestamp: Date.now()
      });
    }
  }, 1500);
}

module.exports = {
  setIO,
  sendSMS
};
