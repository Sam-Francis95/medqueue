import React, { useState, useEffect } from 'react';
import { socket } from '../socket';
import { calculateETA } from '../utils/eta';
import { 
  Clock, 
  User, 
  Hourglass, 
  Building2, 
  Users, 
  Info, 
  ShieldCheck,
  PlusSquare
} from 'lucide-react';

export default function Display() {
  const [queueState, setQueueState] = useState(null);
  const [historyData, setHistoryData] = useState(null);
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const handleUpdate = (state) => setQueueState(state);
    socket.on('queue:updated', handleUpdate);
    socket.emit('state:get');
    socket.emit('history:get', (data) => setHistoryData(data));
    return () => socket.off('queue:updated', handleUpdate);
  }, []);

  if (!queueState) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center text-gray-500 font-medium tracking-widest animate-pulse">
        Initializing System...
      </div>
    );
  }

  const current = queueState.lists.called || queueState.lists.withDoctor;
  const waitingDisplay = [...queueState.lists.returned, ...queueState.lists.waiting];
  const nextPatient = waitingDisplay.length > 0 ? waitingDisplay[0] : null;

  const formatSeconds = (totalSeconds) => {
    if (typeof totalSeconds !== 'number' || isNaN(totalSeconds)) return '--:--';
    const m = Math.floor(totalSeconds / 60).toString().padStart(2, '0');
    const s = (totalSeconds % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  // Calculate live countdown for Now Serving (time remaining in consultation)
  let currentRemainingSecs = null;
  if (current) {
    if (current.status === 'With Doctor' && current.startTime) {
       const elapsedSecs = Math.floor((Date.now() - current.startTime) / 1000);
       const avgSecs = queueState.stats.rollingAverage * 60;
       currentRemainingSecs = Math.max(0, avgSecs - elapsedSecs);
    } else {
       currentRemainingSecs = queueState.stats.rollingAverage * 60;
    }
  }

  const nextEtaSecs = nextPatient ? calculateETA(nextPatient, queueState, historyData, 'seconds') : null;

  return (
    <div className="min-h-screen bg-[#fafafa] text-gray-800 font-['Inter'] flex justify-center p-8">
      <div className="w-full max-w-[1400px] flex flex-col gap-6">
        
        {/* HEADER */}
        <div className="bg-white border border-gray-200 rounded-2xl shadow-[0_2px_10px_rgba(0,0,0,0.02)] px-8 py-6 flex justify-between items-center shrink-0">
          <div className="flex items-center gap-4">
            <div className="text-gray-800">
              <PlusSquare size={40} strokeWidth={2} />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900 tracking-tight leading-none">
                {queueState.setupConfig?.clinicName || 'MedQueue Clinic'}
              </h1>
              <p className="text-gray-500 text-xs font-bold uppercase tracking-widest mt-1.5">
                Queue Management System
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-4 text-gray-700">
            <Clock size={28} strokeWidth={1.5} className="text-gray-500" />
            <div>
              <div className="text-xl font-bold tracking-tight leading-none">
                {currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
              </div>
              <div className="text-gray-500 text-xs font-medium mt-1">
                {currentTime.toLocaleDateString([], { weekday: 'long', day: 'numeric', month: 'short', year: 'numeric' })}
              </div>
            </div>
          </div>
        </div>

        {/* MAIN CONTENT AREA */}
        <div className="flex gap-6 items-start">
          
          {/* LEFT CARD: NOW SERVING */}
          <div className="w-[35%] bg-white border border-gray-200 rounded-2xl shadow-[0_2px_10px_rgba(0,0,0,0.02)] flex flex-col relative overflow-hidden shrink-0 h-fit">
            <div className="absolute right-8 top-1/2 -translate-y-1/2 text-gray-50/80 pointer-events-none">
              <PlusSquare size={180} strokeWidth={1} />
            </div>

            <div className="p-8 relative z-10">
              <div className="flex items-center gap-4 mb-6">
                <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center">
                  <User size={24} className="text-gray-700" strokeWidth={1.5} />
                </div>
                <h2 className="text-sm font-bold text-gray-800 uppercase tracking-widest">Now Serving</h2>
                <div className="flex-1 h-px bg-gray-200 ml-2"></div>
              </div>

              <div className="py-2">
                {current ? (
                  <div className="text-[7rem] leading-none font-black text-[#1a1a1a] tracking-tight">
                    {current.token}
                  </div>
                ) : (
                  <div className="text-5xl text-gray-300 font-light py-8">
                    Waiting
                  </div>
                )}
              </div>

              <div className="mt-8 space-y-4">
                <div className="flex items-center gap-4 text-gray-700">
                  <Building2 size={22} strokeWidth={1.5} />
                  <span className="text-lg font-semibold">Consultation Room 1</span>
                </div>
                <div className="flex items-center gap-4 text-gray-500">
                  <User size={22} strokeWidth={1.5} />
                  <span className="text-lg font-medium">Dr. {queueState.setupConfig?.clinicName ? 'Available' : 'Assigned'}</span>
                </div>
              </div>
            </div>

            <div className="border-t border-gray-100 bg-gray-50/30 grid grid-cols-2 p-6 shrink-0 z-10">
              <div className="flex items-center gap-3 px-2">
                <Clock size={24} className="text-gray-500" strokeWidth={1.5} />
                <div>
                  <div className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1">Time Remaining</div>
                  <div className="text-xl font-mono font-bold text-gray-900">{formatSeconds(currentRemainingSecs)}</div>
                </div>
              </div>
              <div className="flex items-center gap-3 border-l border-gray-100 pl-6">
                <Users size={24} className="text-gray-500" strokeWidth={1.5} />
                <div>
                  <div className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1">People in Queue</div>
                  <div className="text-xl font-bold text-gray-900">{waitingDisplay.length}</div>
                </div>
              </div>
            </div>
          </div>

          {/* MIDDLE CARD: UP NEXT */}
          <div className="w-[35%] bg-white border border-gray-200 rounded-2xl shadow-[0_2px_10px_rgba(0,0,0,0.02)] flex flex-col relative overflow-hidden shrink-0 h-fit">
            <div className="absolute right-8 top-1/2 -translate-y-1/2 text-gray-50/80 pointer-events-none">
              <Users size={180} strokeWidth={1} />
            </div>

            <div className="p-8 relative z-10">
              <div className="flex items-center gap-4 mb-6">
                <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center">
                  <Hourglass size={24} className="text-gray-700" strokeWidth={1.5} />
                </div>
                <h2 className="text-sm font-bold text-gray-800 uppercase tracking-widest">Up Next</h2>
                <div className="flex-1 h-px bg-gray-200 mx-2"></div>
                <div className="bg-gray-100 text-gray-600 text-xs font-bold uppercase tracking-widest px-3 py-1.5 rounded-md">
                  {waitingDisplay.length} Waiting
                </div>
              </div>

              <div className="py-2">
                {nextPatient ? (
                  <div className="text-[7rem] leading-none font-black text-[#1a1a1a] tracking-tight">
                    {nextPatient.token}
                  </div>
                ) : (
                  <div className="text-5xl text-gray-300 font-light py-8">
                    --
                  </div>
                )}
              </div>

              <div className="mt-8 space-y-4">
                <div className="flex items-center gap-4 text-gray-700">
                  <Building2 size={22} strokeWidth={1.5} />
                  <span className="text-lg font-semibold">Consultation Room 1</span>
                </div>
                <div className="flex items-center gap-4 text-gray-500">
                  <User size={22} strokeWidth={1.5} />
                  <span className="text-lg font-medium">Dr. {queueState.setupConfig?.clinicName ? 'Available' : 'Assigned'}</span>
                </div>
              </div>
            </div>

            <div className="border-t border-gray-100 bg-gray-50/30 grid grid-cols-2 p-6 shrink-0 z-10">
              <div className="flex items-center gap-3 px-2">
                <Clock size={24} className="text-gray-500" strokeWidth={1.5} />
                <div>
                  <div className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1">Est. Wait</div>
                  <div className="text-xl font-mono font-bold text-brand-600">{formatSeconds(nextEtaSecs)}</div>
                </div>
              </div>
              <div className="flex items-center gap-3 border-l border-gray-100 pl-6">
                <Users size={24} className="text-gray-500" strokeWidth={1.5} />
                <div>
                  <div className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1">People in Queue</div>
                  <div className="text-xl font-bold text-gray-900">{waitingDisplay.length}</div>
                </div>
              </div>
            </div>
          </div>

          {/* RIGHT CARD: WAITING LIST & BANNER */}
          <div className="flex-1 flex flex-col gap-6 h-[calc(100vh-180px)]">
            
            {/* Waiting List */}
            <div className="flex-1 bg-white border border-gray-200 rounded-2xl shadow-[0_2px_10px_rgba(0,0,0,0.02)] flex flex-col relative overflow-hidden min-h-0">
              <div className="p-6 border-b border-gray-100 flex items-center justify-between shrink-0 bg-gray-50/50">
                <h2 className="text-sm font-bold text-gray-800 uppercase tracking-widest">Later in Queue</h2>
                <span className="bg-gray-200 text-gray-700 text-xs font-bold px-2.5 py-1 rounded-md">
                  {Math.max(0, waitingDisplay.length - 1)}
                </span>
              </div>
              
              <div className="flex-1 overflow-y-auto custom-scrollbar">
                {waitingDisplay.slice(1).map((p) => {
                  const etaSecs = calculateETA(p, queueState, historyData, 'seconds');
                  return (
                    <div key={p.token} className="flex justify-between items-center p-5 border-b border-gray-100 last:border-0 hover:bg-gray-50 transition-colors">
                      <div className="font-bold text-gray-900 text-2xl">{p.token}</div>
                      <div className="text-right">
                        <div className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-0.5">Est. Wait</div>
                        <div className="text-lg font-mono font-bold text-brand-600">{formatSeconds(etaSecs)}</div>
                      </div>
                    </div>
                  );
                })}
                
                {waitingDisplay.length <= 1 && (
                  <div className="h-full flex flex-col items-center justify-center text-gray-400 p-6 text-center">
                    <Users size={32} strokeWidth={1.5} className="mb-4 text-gray-300" />
                    <p className="text-sm font-medium">No other patients waiting</p>
                  </div>
                )}
              </div>
            </div>

            {/* BOTTOM BANNER */}
            <div className="bg-white border border-gray-200 rounded-2xl shadow-[0_2px_10px_rgba(0,0,0,0.02)] flex flex-col justify-center gap-4 p-6 shrink-0">
              <div className="flex items-center gap-3 text-gray-600">
                <Info size={20} strokeWidth={1.5} />
                <span className="text-sm font-medium">Please have your ID ready and remain seated.</span>
              </div>
              <div className="flex items-center gap-3 text-gray-600">
                <ShieldCheck size={20} strokeWidth={1.5} />
                <span className="text-sm font-medium">Thank you for your patience.</span>
              </div>
            </div>

          </div>
        </div>

      </div>
    </div>
  );
}
