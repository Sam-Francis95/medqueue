import React, { useState, useEffect } from 'react';
import { Play, Check, X, RotateCcw, MoreHorizontal, Printer, AlertTriangle, Edit2, AlertOctagon, FileText } from 'lucide-react';
import { calculateETA } from '../utils/eta';
import { socket } from '../socket';

export default function QueueTable({ allPatients, rollingAverage, queueState, historyData, onCallNext, onConfirm, onSkip, onReturn, onEndConsultation }) {
  const [now, setNow] = useState(Date.now());
  const [dismissedNudges, setDismissedNudges] = useState({});
  const [openMenuToken, setOpenMenuToken] = useState(null);
  const [activeTab, setActiveTab] = useState('Main');
  
  // Modal states
  const [editingPatient, setEditingPatient] = useState(null);
  const [editForm, setEditForm] = useState({ name: '', age: '' });
  
  const [notingPatient, setNotingPatient] = useState(null);
  const [noteForm, setNoteForm] = useState('');

  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, []);

  const handleFeatureSoon = () => window.alert('Feature coming soon!');

  const formatCountdown = (start, waitSeconds) => {
    if (!start || !waitSeconds) return "00:00";
    const elapsed = Math.floor((now - start) / 1000);
    const remaining = Math.max(0, waitSeconds - elapsed);
    const m = Math.floor(remaining / 60).toString().padStart(2, '0');
    const s = (remaining % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  const formatElapsed = (start, end = now) => {
    const elapsed = Math.floor((end - start) / 1000);
    const m = Math.floor(elapsed / 60).toString().padStart(2, '0');
    const s = (elapsed % 60).toString().padStart(2, '0');
    return { str: `${m}:${s}`, mins: elapsed / 60 };
  };

  const getStatusBadge = (status) => {
    switch(status) {
      case 'With Doctor': return <span className="bg-blue-50 text-blue-700 px-2.5 py-0.5 rounded text-xs font-medium border border-blue-200 inline-block">With Doctor</span>;
      case 'Called': return <span className="bg-amber-50 text-amber-700 px-2.5 py-0.5 rounded text-xs font-medium border border-amber-200 flex items-center gap-1.5 w-fit"><span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse"></span>Called</span>;
      case 'Waiting': return <span className="bg-gray-50 text-gray-600 px-2.5 py-0.5 rounded text-xs font-medium border border-gray-200 inline-block">Waiting</span>;
      case 'Returned': return <span className="bg-purple-50 text-purple-700 px-2.5 py-0.5 rounded text-xs font-medium border border-purple-200 inline-block">Returned</span>;
      case 'Skipped': return <span className="bg-red-50 text-red-700 px-2.5 py-0.5 rounded text-xs font-medium border border-red-200 inline-block">Skipped</span>;
      case 'Completed': return <span className="bg-green-50 text-green-700 px-2.5 py-0.5 rounded text-xs font-medium border border-green-200 inline-block">Completed</span>;
      default: return null;
    }
  };

  const mainPatients = allPatients.filter(p => p.status !== 'Pharmacy' && p.status !== 'X-Ray');
  const pharmacyPatients = allPatients.filter(p => p.status === 'Pharmacy');
  const xrayPatients = allPatients.filter(p => p.status === 'X-Ray');
  
  const displayedPatients = activeTab === 'Main' ? mainPatients : activeTab === 'Pharmacy' ? pharmacyPatients : xrayPatients;

  return (
    <div className="flex flex-col h-full bg-white relative">
      <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center bg-white shrink-0">
        <div className="flex gap-4 border-b border-gray-200 w-full">
          <button onClick={() => setActiveTab('Main')} className={`pb-3 text-sm font-semibold uppercase tracking-widest cursor-pointer ${activeTab === 'Main' ? 'text-brand-600 border-b-2 border-brand-600' : 'text-gray-400 hover:text-gray-600'}`}>
            Live Queue ({mainPatients.length})
          </button>
          <button onClick={() => setActiveTab('Pharmacy')} className={`pb-3 text-sm font-semibold uppercase tracking-widest cursor-pointer ${activeTab === 'Pharmacy' ? 'text-brand-600 border-b-2 border-brand-600' : 'text-gray-400 hover:text-gray-600'}`}>
            Pharmacy ({pharmacyPatients.length})
          </button>
          <button onClick={() => setActiveTab('X-Ray')} className={`pb-3 text-sm font-semibold uppercase tracking-widest cursor-pointer ${activeTab === 'X-Ray' ? 'text-brand-600 border-b-2 border-brand-600' : 'text-gray-400 hover:text-gray-600'}`}>
            X-Ray ({xrayPatients.length})
          </button>
        </div>
      </div>
      
      <div className="flex-1 overflow-auto custom-scrollbar">
        <table className="w-full text-left border-collapse text-sm">
          <thead>
            <tr className="border-b border-gray-200">
              <th className="px-6 py-3 text-xs font-medium text-gray-500 bg-gray-50/50 sticky top-0 z-10 w-24">Token</th>
              <th className="px-6 py-3 text-xs font-medium text-gray-500 bg-gray-50/50 sticky top-0 z-10">Patient Name</th>
              <th className="px-6 py-3 text-xs font-medium text-gray-500 bg-gray-50/50 sticky top-0 z-10">Wait Time</th>
              <th className="px-6 py-3 text-xs font-medium text-gray-500 bg-gray-50/50 sticky top-0 z-10">Est. Wait</th>
              <th className="px-6 py-3 text-xs font-medium text-gray-500 bg-gray-50/50 sticky top-0 z-10">Status</th>
              <th className="px-6 py-3 text-xs font-medium text-gray-500 bg-gray-50/50 sticky top-0 z-10 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {displayedPatients.map(p => {
              const borderClass = (() => {
                switch(p.status) {
                  case 'Completed': return 'border-l-4 border-l-green-500';
                  case 'Called': return 'border-l-4 border-l-amber-500';
                  case 'Waiting': return 'border-l-4 border-l-gray-400';
                  case 'Skipped': return 'border-l-4 border-l-red-500';
                  case 'Returned': return 'border-l-4 border-l-purple-500';
                  case 'With Doctor': return 'border-l-4 border-l-blue-500';
                  default: return 'border-l-4 border-l-transparent';
                }
              })();
              
              let waitEndTime = now;
              if (p.status === 'With Doctor') waitEndTime = p.startTime || p.callStartTime || now;
              else if (p.status === 'Called') waitEndTime = p.callStartTime || now;
              else if (p.status === 'Completed' || p.status === 'Skipped') waitEndTime = p.startTime || p.callStartTime || p.addedAt;

              const elapsed = formatElapsed(p.addedAt, waitEndTime);
              const isWaiting = p.status === 'Waiting' || p.status === 'Returned';
              
              const waitTimeColor = (() => {
                if (!isWaiting) return 'text-gray-500'; // Gray out if no longer waiting
                if (rollingAverage <= 0) return 'text-gray-500';
                if (elapsed.mins > rollingAverage * 2) return 'text-red-600 font-bold';
                if (elapsed.mins > rollingAverage) return 'text-amber-600 font-bold';
                return 'text-green-600 font-bold';
              })();

              return (
              <React.Fragment key={p.token}>
              <tr className="hover:bg-gray-50/50 transition-colors group">
                <td className={`px-6 py-5 ${borderClass}`}>
                  <span className="text-lg font-bold text-gray-900">#{p.token}</span>
                </td>
                <td className="px-6 py-5">
                  <span className={`font-medium block ${p.isEmergency ? 'text-red-600' : 'text-gray-900'}`}>{p.name} {p.age ? <span className="text-gray-500 font-normal">({p.age}y)</span> : ''}</span>
                  <div className="flex items-center gap-2 mt-0.5">
                    {p.isEmergency && <span className="text-[10px] bg-red-100 text-red-700 px-1.5 py-0.5 rounded font-bold uppercase tracking-wider flex items-center gap-1"><AlertOctagon size={10} /> Emergency</span>}
                    <span className="text-gray-400 text-[11px] uppercase tracking-wider">Added {new Date(p.addedAt || Date.now()).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                    {p.skipCount === 1 && <span className="text-[10px] bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded font-medium">⚠️ Skipped once before</span>}
                    {p.skipCount >= 2 && <span className="text-[10px] bg-red-100 text-red-700 px-1.5 py-0.5 rounded font-medium">⚠️ Skipped twice</span>}
                  </div>
                  {p.note && (
                    <div className="mt-2 text-xs text-gray-600 bg-amber-50 border border-amber-100 px-2 py-1.5 rounded flex items-start gap-1.5 w-fit max-w-full">
                      <FileText size={14} className="text-amber-500 shrink-0 mt-0.5" />
                      <span className="truncate">{p.note}</span>
                    </div>
                  )}
                </td>
                <td className="px-6 py-5">
                  <span className={`text-sm font-mono ${waitTimeColor}`}>{elapsed.str}</span>
                </td>
                <td className="px-6 py-5">
                  {isWaiting ? (() => {
                    const etaSecs = calculateETA(p, queueState, historyData, 'seconds');
                    if (isNaN(etaSecs)) return <span className="text-sm font-mono text-gray-400">--:--</span>;
                    const m = Math.floor(etaSecs / 60).toString().padStart(2, '0');
                    const s = (etaSecs % 60).toString().padStart(2, '0');
                    return <span className="text-sm font-mono font-medium text-brand-600">{m}:{s}</span>;
                  })() : <span className="text-sm font-mono text-gray-300">--:--</span>}
                </td>
                <td className="px-6 py-5">
                  <div className="flex flex-col gap-1 items-start">
                    {getStatusBadge(p.status)}
                    {p.status === 'Called' && p.callStartTime && (
                      <span className="text-xs font-mono font-medium text-amber-600 bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200">
                        ⏳ {formatCountdown(p.callStartTime, p.waitSeconds)}
                      </span>
                    )}
                    {p.status === 'With Doctor' && p.startTime && (
                      (() => {
                        const elapsed = formatElapsed(p.startTime);
                        let colorClass = "text-gray-600 bg-gray-50 border-gray-200";
                        if (rollingAverage > 0) {
                          if (elapsed.mins > rollingAverage * 2) colorClass = "text-red-600 bg-red-50 border-red-200 font-bold";
                          else if (elapsed.mins > rollingAverage) colorClass = "text-amber-600 bg-amber-50 border-amber-200 font-bold";
                        }
                        return (
                          <span className={`text-xs font-mono px-1.5 py-0.5 rounded border ${colorClass}`}>
                            ⏱ {elapsed.str} <span className="opacity-70 text-[10px] font-sans">| avg: {rollingAverage}m</span>
                          </span>
                        );
                      })()
                    )}
                  </div>
                </td>
                <td className="px-6 py-5 text-right">
                  <div className="flex justify-end gap-2 items-center">
                    <button onClick={() => window.open(`/print/${p.token}`, '_blank')} className="px-2 py-1.5 text-gray-400 hover:text-brand-600 hover:bg-brand-50 rounded transition-colors cursor-pointer" title="Print Slip">
                      <Printer size={16} />
                    </button>
                    {p.status === 'Called' && (
                      <>
                        <button onClick={onConfirm} className="px-2.5 py-1.5 bg-brand-50 text-brand-700 hover:bg-brand-100 rounded text-xs font-medium border border-brand-200 flex items-center gap-1 transition-colors cursor-pointer">
                          <Check size={14} /> Confirm
                        </button>
                        <button onClick={onSkip} className="px-2.5 py-1.5 bg-red-50 text-red-700 hover:bg-red-100 rounded text-xs font-medium border border-red-200 flex items-center gap-1 transition-colors cursor-pointer">
                          <X size={14} /> Skip
                        </button>
                      </>
                    )}
                    {p.status === 'Skipped' && p.skipCount < 2 && (
                      <button onClick={() => onReturn(p.token)} className="px-2.5 py-1.5 bg-gray-50 text-gray-700 hover:bg-gray-100 rounded text-xs font-medium border border-gray-200 flex items-center gap-1 transition-colors cursor-pointer">
                        <RotateCcw size={14} /> Return
                      </button>
                    )}
                    {(p.status === 'Pharmacy' || p.status === 'X-Ray') && (
                      <button onClick={() => socket.emit('secondary:complete', { token: p.token, department: p.status })} className="px-2.5 py-1.5 bg-green-50 text-green-700 hover:bg-green-100 rounded text-xs font-medium border border-green-200 flex items-center gap-1 transition-colors cursor-pointer">
                        <Check size={14} /> Dispense / Finish
                      </button>
                    )}
                    {(p.status === 'Waiting' || p.status === 'Completed' || p.status === 'With Doctor' || p.status === 'Returned' || p.status === 'Pharmacy' || p.status === 'X-Ray') && (
                      <div className="relative">
                        <button onClick={() => setOpenMenuToken(openMenuToken === p.token ? null : p.token)} className="text-gray-400 hover:text-gray-600 p-1 rounded hover:bg-gray-100 cursor-pointer">
                          <MoreHorizontal size={16} />
                        </button>
                        
                        {openMenuToken === p.token && (
                          <div className="absolute right-0 top-full mt-1 w-48 bg-white border border-gray-200 rounded-lg shadow-xl z-50 overflow-hidden text-left py-1">
                            <button onClick={() => { setEditingPatient(p); setEditForm({ name: p.name, age: p.age || '' }); setOpenMenuToken(null); }} className="w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2 cursor-pointer">
                              <Edit2 size={14} /> Edit Details
                            </button>
                            <button onClick={() => { setNotingPatient(p); setNoteForm(p.note || ''); setOpenMenuToken(null); }} className="w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2 cursor-pointer">
                              <FileText size={14} /> Add Note
                            </button>
                            {p.status !== 'Completed' && p.status !== 'With Doctor' && !p.isEmergency && (
                              <button onClick={() => { socket.emit('patient:emergency', { token: p.token }); setOpenMenuToken(null); }} className="w-full px-4 py-2 text-sm text-red-600 hover:bg-red-50 flex items-center gap-2 cursor-pointer border-t border-gray-100 mt-1 pt-2">
                                <AlertOctagon size={14} /> Mark as Emergency
                              </button>
                            )}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </td>
              </tr>
              {p.status === 'With Doctor' && p.startTime && rollingAverage > 0 && (() => {
                const elapsedMins = (now - p.startTime) / 60000;
                const dismissedAt = dismissedNudges[p.token];
                // Trigger nudge when consultation exceeds the average consultation time
                // Snooze for 10 minutes (600000 ms) if dismissed
                const showNudge = elapsedMins > rollingAverage && (!dismissedAt || (now - dismissedAt > 600000));
                
                if (!showNudge) return null;
                return (
                  <tr key={`${p.token}-nudge`} className="bg-red-50 border-b border-red-100">
                    <td colSpan="6" className="px-6 py-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 text-red-700 text-sm font-medium">
                          <AlertTriangle size={16} />
                          Token {p.token} has been running {Math.floor(elapsedMins)} mins. Still ongoing?
                        </div>
                        <div className="flex gap-2">
                          <button onClick={() => setDismissedNudges(prev => ({ ...prev, [p.token]: Date.now() }))} className="px-3 py-1.5 bg-white text-gray-700 border border-gray-300 rounded text-xs font-medium hover:bg-gray-50 cursor-pointer">
                            Yes still ongoing
                          </button>
                          <button onClick={onEndConsultation} className="px-3 py-1.5 bg-red-600 text-white rounded text-xs font-medium hover:bg-red-700 cursor-pointer">
                            Mark Complete
                          </button>
                        </div>
                      </div>
                    </td>
                  </tr>
                );
              })()}
              </React.Fragment>
            )})}
            {displayedPatients.length === 0 && (
              <tr>
                <td colSpan="6" className="py-12 text-center text-gray-500 bg-gray-50/30">
                  No patients found in {activeTab}.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* CLICK-AWAY OVERLAY FOR DROPDOWN */}
      {openMenuToken && (
        <div className="fixed inset-0 z-40" onClick={() => setOpenMenuToken(null)}></div>
      )}

      {/* EDIT MODAL */}
      {editingPatient && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
              <h3 className="font-bold text-gray-900">Edit Patient Details</h3>
              <button onClick={() => setEditingPatient(null)} className="text-gray-400 hover:text-gray-600 cursor-pointer"><X size={20} /></button>
            </div>
            <div className="p-6">
              <div className="mb-4">
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Patient Name</label>
                <input type="text" value={editForm.name} onChange={e => setEditForm({...editForm, name: e.target.value})} className="w-full px-4 py-2 border border-gray-300 rounded focus:border-brand-500 focus:ring-1 focus:ring-brand-500 outline-none" />
              </div>
              <div className="mb-6">
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Patient Age</label>
                <input type="number" value={editForm.age} onChange={e => setEditForm({...editForm, age: e.target.value})} className="w-full px-4 py-2 border border-gray-300 rounded focus:border-brand-500 focus:ring-1 focus:ring-brand-500 outline-none" />
              </div>
              <div className="flex gap-3 justify-end">
                <button onClick={() => setEditingPatient(null)} className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded cursor-pointer transition-colors">Cancel</button>
                <button onClick={() => { socket.emit('patient:edit', { token: editingPatient.token, name: editForm.name, age: editForm.age }); setEditingPatient(null); }} className="px-4 py-2 text-sm font-medium text-white bg-brand-600 hover:bg-brand-700 rounded cursor-pointer transition-colors">Save Changes</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* NOTE MODAL */}
      {notingPatient && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-amber-50">
              <h3 className="font-bold text-amber-900 flex items-center gap-2"><FileText size={18} /> Add Note for #{notingPatient.token}</h3>
              <button onClick={() => setNotingPatient(null)} className="text-amber-400 hover:text-amber-600 cursor-pointer"><X size={20} /></button>
            </div>
            <div className="p-6">
              <textarea autoFocus value={noteForm} onChange={e => setNoteForm(e.target.value)} placeholder="e.g. Wheelchair needed, high fever..." className="w-full h-32 px-4 py-3 border border-amber-200 rounded focus:border-amber-500 focus:ring-1 focus:ring-amber-500 outline-none resize-none mb-6"></textarea>
              <div className="flex gap-3 justify-end">
                <button onClick={() => { socket.emit('patient:note', { token: notingPatient.token, note: '' }); setNotingPatient(null); }} className="px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-50 rounded cursor-pointer transition-colors mr-auto">Clear Note</button>
                <button onClick={() => setNotingPatient(null)} className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded cursor-pointer transition-colors">Cancel</button>
                <button onClick={() => { socket.emit('patient:note', { token: notingPatient.token, note: noteForm }); setNotingPatient(null); }} className="px-4 py-2 text-sm font-medium text-white bg-amber-600 hover:bg-amber-700 rounded cursor-pointer transition-colors">Save Note</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
