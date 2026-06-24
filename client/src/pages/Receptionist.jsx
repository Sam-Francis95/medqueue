import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { socket } from '../socket';
import QueueTable from '../components/QueueTable';
import AnalyticsStrip from '../components/AnalyticsStrip';
import WalkInWarning from '../components/WalkInWarning';
import { Home, Users, Calendar, BarChart2, Settings, Search, Bell, Plus, CheckCircle2, AlertCircle, Activity, Printer, Smartphone } from 'lucide-react';

export default function Receptionist() {
  const navigate = useNavigate();
  const [queueState, setQueueState] = useState(null);
  const [historyData, setHistoryData] = useState(null);
  const [newPatientName, setNewPatientName] = useState('');
  const [newPatientAge, setNewPatientAge] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [lastAddedToken, setLastAddedToken] = useState(null);
  const [duplicateWarning, setDuplicateWarning] = useState(null);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [notification, setNotification] = useState(null);
  
  // Patient Autocomplete State
  const [dbPatients, setDbPatients] = useState([]);
  const [showAutocomplete, setShowAutocomplete] = useState(false);

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const handleUpdate = (state) => setQueueState(state);
    socket.on('queue:updated', handleUpdate);
    socket.emit('state:get');
    socket.emit('history:get', (data) => setHistoryData(data));
    socket.emit('db:patients:get', (data) => setDbPatients(data));

    // Listen for Simulated SMS Notifications
    const handleNotification = (data) => {
      setNotification(data);
      setTimeout(() => setNotification(null), 8000); // Hide after 8s
    };
    socket.on('notification:simulated', handleNotification);

    return () => {
      socket.off('queue:updated', handleUpdate);
      socket.off('notification:simulated', handleNotification);
    };
  }, []);

  // Health Indicator logic
  let healthIndicator = { color: 'bg-gray-400', label: 'Building history...' };
  if (queueState && historyData) {
    const rolling = queueState.stats.rollingAverage;
    const date = new Date();
    const day = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'][date.getDay()];
    const hour = date.getHours();
    const slot = queueState.setupConfig?.mode === 'Holiday' ? `holiday_${hour}` : `${day}_${hour}`;
    
    const modeData = historyData?.[slot] || [];
    if (modeData.length >= 3 && rolling > 0) {
      const histAvg = modeData.reduce((a, b) => a + b, 0) / modeData.length;
      const ratio = rolling / histAvg;
      if (ratio <= 1.2) {
        healthIndicator = { color: 'bg-green-500', label: 'Flowing normally' };
      } else if (ratio <= 1.5) {
        healthIndicator = { color: 'bg-amber-500', label: 'Slightly backed up' };
      } else {
        healthIndicator = { color: 'bg-red-500', label: 'Significantly delayed' };
      }
    }
  }

  const handleAddPatient = (e) => {
    e.preventDefault();
    if (!newPatientName.trim()) return;
    socket.emit('patient:add', { name: newPatientName }, (response) => {
      if (response.warning) {
        setDuplicateWarning(response.message);
      } else {
        if (response.success && response.patient) {
          setLastAddedToken(response.patient.token);
          setTimeout(() => setLastAddedToken(null), 5000);
        }
        setNewPatientName('');
        setDuplicateWarning(null);
      }
    });
  };

  const handleForceAdd = () => {
    if (!newPatientAge.trim()) return;
    socket.emit('patient:add_force', { name: newPatientName, age: newPatientAge }, (forceRes) => {
      if (forceRes && forceRes.success && forceRes.patient) {
        setLastAddedToken(forceRes.patient.token);
        setTimeout(() => setLastAddedToken(null), 5000);
      }
      setNewPatientName('');
      setNewPatientAge('');
      setDuplicateWarning(null);
    });
  };

  const handleCloseClinic = () => {
    if(window.confirm('Are you sure you want to close the clinic for today?')) {
      socket.emit('day:close', (summary) => navigate('/summary', {state: {summary}}));
    }
  };

  const handleCallNext = () => {
    if (queueState.lists.waiting.length === 0 && queueState.lists.returned.length === 0) {
      window.alert('No patients in queue to call.');
      return;
    }
    socket.emit('token:call_next');
  };

  const handleFeatureSoon = () => {
    window.alert('Feature coming soon!');
  };

  if (!queueState) return <div className="h-screen w-full flex items-center justify-center bg-gray-50"><Activity className="animate-spin text-brand-500" size={32} /></div>;

  const withDoc = queueState.lists.withDoctor;

  return (
    <div className="flex h-screen bg-gray-50 font-['Inter'] text-sm text-gray-800 overflow-hidden">
      
      {/* NARROW SIDEBAR */}
      <div className="w-16 bg-white border-r border-gray-200 flex flex-col items-center py-6 shrink-0 z-20">
        <div className="w-8 h-8 bg-brand-600 rounded flex items-center justify-center text-white font-bold text-lg mb-8">
          M
        </div>
        <div className="flex flex-col gap-6 w-full items-center">
          <button className="p-2.5 bg-brand-50 text-brand-600 rounded-lg cursor-pointer"><Home size={20} strokeWidth={2} /></button>
          <button onClick={() => navigate('/database')} className="p-2.5 text-gray-400 hover:text-gray-600 cursor-pointer" title="Patient Database"><Users size={20} strokeWidth={2} /></button>
          <button onClick={() => navigate('/appointments')} className="p-2.5 text-gray-400 hover:text-gray-600 cursor-pointer" title="Appointments"><Calendar size={20} strokeWidth={2} /></button>
          <button onClick={() => navigate('/analytics')} className="p-2.5 text-gray-400 hover:text-gray-600 cursor-pointer" title="Analytics"><BarChart2 size={20} strokeWidth={2} /></button>
        </div>
        <div className="mt-auto mb-4">
          <button onClick={handleFeatureSoon} className="p-2.5 text-gray-400 hover:text-gray-600 cursor-pointer"><Settings size={20} strokeWidth={2} /></button>
        </div>
      </div>

      <div className="flex-1 flex flex-col h-full overflow-hidden">
        
        {/* TOPBAR */}
        <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-6 z-10 shrink-0">
          <div className="flex items-center gap-3">
            <h1 className="font-semibold text-base text-gray-800 tracking-tight">{queueState.setupConfig?.clinicName || 'MedQueue Clinic'}</h1>
            {queueState.setupConfig?.mode === 'Holiday' && (
              <span className="bg-brand-100 text-brand-700 text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wider">Holiday</span>
            )}
          </div>
          
          <div className="flex items-center gap-6">
            <div className="text-sm font-medium text-gray-600">
              {currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
            </div>
            <div className="w-7 h-7 bg-brand-100 rounded-full flex items-center justify-center text-brand-700 font-bold text-xs">
              DR
            </div>
          </div>
        </header>

        {/* HEALTH INDICATOR ROW */}
        <div className="px-6 py-2 bg-white border-b border-gray-200 flex items-center gap-2">
          <span className={`w-2 h-2 rounded-full ${healthIndicator.color}`} title="Queue Health Status"></span>
          <span className="text-xs font-medium text-gray-600">{healthIndicator.label}</span>
        </div>

        {/* MAIN LAYOUT */}
        <main className="flex-1 overflow-y-auto p-6 flex flex-col lg:flex-row gap-6">
          
          {/* LEFT COLUMN: Database / Queue */}
          <div className="flex-1 min-w-0 flex flex-col gap-6">
            <AnalyticsStrip stats={queueState.stats} />
            
            <div className="flex-1 bg-white border border-gray-200 rounded-lg shadow-sm flex flex-col overflow-hidden min-h-[400px]">
              <QueueTable 
                allPatients={queueState.allPatients.filter(p => p.name.toLowerCase().includes(searchTerm.toLowerCase()) || p.token.toString().includes(searchTerm))}
                rollingAverage={queueState.stats.rollingAverage}
                queueState={queueState}
                historyData={historyData}
                onCallNext={handleCallNext}
                onConfirm={() => socket.emit('token:confirm')}
                onSkip={() => socket.emit('token:skip')}
                onReturn={(t) => socket.emit('token:return', { token: t })}
                onEndConsultation={() => socket.emit('consult:end')}
              />
            </div>
          </div>

          {/* RIGHT COLUMN: Active Patient Profile & Controls */}
          <div className="w-full lg:w-[360px] xl:w-[400px] shrink-0 flex flex-col gap-6">
            
            {/* Active Consultation Panel */}
            <div className="bg-white border border-gray-200 flex flex-col relative shrink-0">
              <div className="px-5 py-4 border-b border-gray-200 bg-white">
                <h2 className="font-semibold text-sm text-gray-800 uppercase tracking-widest">Currently Serving</h2>
              </div>

              {withDoc ? (
                <div className="p-6 flex flex-col items-center">
                  <div className="text-5xl font-black text-gray-900 mb-2 tabular-nums">#{withDoc.token}</div>
                  <h3 className="font-bold text-xl text-gray-800 mb-6">{withDoc.name} {withDoc.age ? `(Age ${withDoc.age})` : ''}</h3>
                  
                  <div className={`text-3xl font-mono mb-8 font-medium ${(() => {
                      const elapsed = Math.floor((Date.now() - withDoc.startTime) / 60000);
                      const avg = queueState.stats.rollingAverage;
                      if (elapsed >= avg * 2) return 'text-red-600';
                      if (elapsed >= avg) return 'text-amber-500';
                      return 'text-gray-600';
                  })()}`}>
                    {(() => {
                      const totalSeconds = Math.floor((Date.now() - withDoc.startTime) / 1000);
                      const m = Math.floor(totalSeconds / 60).toString().padStart(2, '0');
                      const s = (totalSeconds % 60).toString().padStart(2, '0');
                      return `${m}:${s}`;
                    })()}
                  </div>

                  <div className="flex flex-col gap-2 w-full mt-4">
                    <button onClick={() => socket.emit('consult:end')} className="w-full bg-brand-600 hover:bg-brand-700 text-white font-medium py-3 rounded text-sm transition-colors flex justify-center items-center gap-2 cursor-pointer">
                      <CheckCircle2 size={16} /> Complete (Go Home)
                    </button>
                    <div className="flex gap-2">
                      <button onClick={() => socket.emit('consult:transfer', { department: 'Pharmacy' })} className="flex-1 bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 font-medium py-2 rounded text-sm transition-colors cursor-pointer">
                        To Pharmacy
                      </button>
                      <button onClick={() => socket.emit('consult:transfer', { department: 'X-Ray' })} className="flex-1 bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 font-medium py-2 rounded text-sm transition-colors cursor-pointer">
                        To X-Ray
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="p-8 flex flex-col items-center text-center text-gray-500">
                  <p className="text-sm mb-6">Ready to call next patient</p>
                  <button onClick={handleCallNext} className="w-full bg-brand-600 hover:bg-brand-700 text-white font-medium py-3 rounded text-sm transition-colors cursor-pointer">
                    Call Next Patient
                  </button>
                </div>
              )}
            </div>

            {/* Registration Panel */}
            <div className="bg-white border border-gray-200 flex flex-col shrink-0">
              <div className="px-5 py-4 border-b border-gray-200 bg-white">
                <h2 className="font-semibold text-sm text-gray-800 uppercase tracking-widest">New Registration</h2>
              </div>
              <div className="p-5 relative">
                <form onSubmit={handleAddPatient} className="flex flex-col gap-3 relative">
                  <input 
                    type="text" 
                    placeholder="Patient Full Name" 
                    value={newPatientName} 
                    onChange={(e) => { 
                      setNewPatientName(e.target.value); 
                      setDuplicateWarning(null); 
                      setShowAutocomplete(e.target.value.trim().length > 1);
                    }} 
                    onFocus={() => { if(newPatientName.length > 1) setShowAutocomplete(true) }}
                    onBlur={() => setTimeout(() => setShowAutocomplete(false), 200)}
                    className="w-full px-4 py-3 bg-white border border-gray-300 rounded focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500 text-sm" 
                    required 
                  />
                  
                  {/* Autocomplete Dropdown */}
                  {showAutocomplete && !duplicateWarning && dbPatients.length > 0 && (
                    <div className="absolute top-12 left-0 right-0 bg-white border border-gray-200 rounded-lg shadow-xl z-50 overflow-hidden max-h-48 overflow-y-auto">
                      {dbPatients.filter(p => p.name.toLowerCase().includes(newPatientName.toLowerCase())).slice(0, 5).map(p => (
                        <div 
                          key={p.id} 
                          className="px-4 py-3 hover:bg-gray-50 border-b border-gray-100 last:border-0 cursor-pointer flex justify-between items-center"
                          onMouseDown={() => {
                            setNewPatientName(p.name);
                            if (p.age) setNewPatientAge(p.age);
                            setShowAutocomplete(false);
                          }}
                        >
                          <span className="font-medium text-gray-800 text-sm">{p.name}</span>
                          {p.age && <span className="text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded">Age {p.age}</span>}
                        </div>
                      ))}
                    </div>
                  )}
                  
                  {duplicateWarning && (
                    <div className="bg-amber-50 border border-amber-200 text-amber-700 text-xs p-3 rounded flex flex-col gap-2">
                      <p>{duplicateWarning}</p>
                      <input type="number" placeholder="Age (Required to distinguish)" value={newPatientAge} onChange={(e) => setNewPatientAge(e.target.value)} className="w-full px-3 py-2 bg-white border border-amber-300 rounded focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 text-xs" required />
                      <button type="button" onClick={handleForceAdd} disabled={!newPatientAge.trim()} className="bg-amber-600 disabled:bg-amber-400 hover:bg-amber-700 disabled:hover:bg-amber-400 text-white font-medium py-2 rounded cursor-pointer transition-colors w-full">
                        Force Add to Queue
                      </button>
                    </div>
                  )}

                  {!duplicateWarning && (
                    <button type="submit" className="w-full bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 font-medium py-3 rounded text-sm transition-colors flex justify-center items-center gap-2 cursor-pointer">
                      <Plus size={16} /> Add to Queue
                    </button>
                  )}
                </form>
                {lastAddedToken && (
                  <div className="mt-4 pt-4 border-t border-gray-200 flex items-center justify-between">
                    <span className="text-sm text-gray-600 font-medium">Added Token #{lastAddedToken}</span>
                    <button onClick={() => window.open(`/print/${lastAddedToken}`, '_blank')} className="text-brand-600 hover:text-brand-700 font-medium text-sm flex items-center gap-1 cursor-pointer">
                      <Printer size={16} /> Print Token
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col gap-2 shrink-0">
              <button onClick={() => socket.emit('break:toggle')} className={`w-full py-3 rounded font-medium text-sm border cursor-pointer transition-colors ${queueState.isBreak ? 'bg-amber-100 border-amber-200 text-amber-700' : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'}`}>
                {queueState.isBreak ? 'End Break' : 'Break'}
              </button>
              <button onClick={handleCloseClinic} className="w-full py-3 rounded font-medium text-sm bg-white border border-gray-300 text-red-600 hover:bg-red-50 cursor-pointer transition-colors">
                Close Clinic
              </button>
            </div>

            <WalkInWarning queueState={queueState} historyData={historyData} />

          </div>
        </main>
      </div>

      {/* Simulated SMS Toast Notification */}
      {notification && (
        <div className="fixed bottom-6 right-6 z-50 animate-in slide-in-from-bottom-5 fade-in duration-300">
          <div className="bg-white border-l-4 border-l-brand-500 rounded-lg shadow-xl p-4 max-w-sm flex gap-4 items-start">
            <div className="w-10 h-10 bg-brand-50 rounded-full flex items-center justify-center shrink-0">
              <Smartphone size={20} className="text-brand-600" />
            </div>
            <div className="flex-1">
              <h4 className="text-sm font-bold text-gray-900 flex justify-between items-center">
                SMS Sent to {notification.patientName}
                <span className="text-[10px] text-gray-400 font-normal">Just now</span>
              </h4>
              <p className="text-xs text-gray-500 mt-0.5 mb-1 font-mono">{notification.phone}</p>
              <p className="text-sm text-gray-700 bg-gray-50 p-2 rounded border border-gray-100 italic">
                "{notification.message}"
              </p>
            </div>
            <button onClick={() => setNotification(null)} className="text-gray-400 hover:text-gray-600">
              &times;
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
