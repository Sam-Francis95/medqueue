import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { socket } from '../socket';
import { Activity, Clock, CheckCircle2, AlertCircle, ArrowLeft } from 'lucide-react';
import { calculateETA } from '../utils/eta';

export default function PatientTracking() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [statusData, setStatusData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchStatus = () => {
      socket.emit('patient:status:get', id, (res) => {
        if (res.error) {
          setError(res.error);
        } else {
          setStatusData(res);
          setError(null);
        }
        setLoading(false);
      });
    };

    fetchStatus();

    // Re-fetch status whenever the queue updates
    socket.on('queue:updated', fetchStatus);
    return () => socket.off('queue:updated', fetchStatus);
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center font-['Inter']">
        <Activity className="animate-spin text-brand-500" size={40} />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4 font-['Inter']">
        <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-8 text-center">
          <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-4">
            <AlertCircle size={32} className="text-red-500" />
          </div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">Patient Not Found</h2>
          <p className="text-gray-500 mb-6">We couldn't find your session. Your consultation may have ended, or the token is invalid.</p>
          <button onClick={() => navigate('/portal')} className="px-6 py-2 bg-brand-600 text-white font-medium rounded-lg hover:bg-brand-700 transition-colors cursor-pointer">
            Return Home
          </button>
        </div>
      </div>
    );
  }

  const { patient, status, queuePosition, rollingAverage } = statusData;
  const etaMins = status === 'waiting' ? (queuePosition - 1) * rollingAverage : 0;
  const etaDate = new Date(Date.now() + etaMins * 60000);
  const formatTime = (d) => d.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });

  return (
    <div className="min-h-screen bg-gray-50 font-['Inter'] flex flex-col md:items-center md:justify-center p-0 md:p-6">
      
      <div className="w-full max-w-md bg-white md:rounded-2xl md:shadow-xl overflow-hidden min-h-screen md:min-h-0 flex flex-col">
        
        {/* Header */}
        <div className="bg-brand-600 p-6 text-white shrink-0 relative flex flex-col items-center pt-10">
          <button onClick={() => navigate('/portal')} className="absolute top-4 left-4 p-2 text-brand-100 hover:text-white transition-colors cursor-pointer">
            <ArrowLeft size={20} />
          </button>
          
          <h2 className="text-sm font-semibold uppercase tracking-widest text-brand-200 mb-2">Live Tracker</h2>
          <h1 className="text-2xl font-bold text-center">Hi, {patient.name}!</h1>
          
          {/* Status Badge */}
          <div className="mt-6 mb-2">
            {status === 'waiting' && (
              <span className="bg-brand-500/30 border border-brand-400 text-white px-4 py-1.5 rounded-full text-sm font-medium flex items-center gap-2">
                <Clock size={16} /> In Queue
              </span>
            )}
            {status === 'called' && (
              <span className="bg-amber-500 text-white px-4 py-1.5 rounded-full text-sm font-bold flex items-center gap-2 animate-pulse shadow-lg shadow-amber-500/20 border border-amber-400">
                <AlertCircle size={16} /> Please proceed to the clinic!
              </span>
            )}
            {status === 'with_doctor' && (
              <span className="bg-green-500 text-white px-4 py-1.5 rounded-full text-sm font-bold flex items-center gap-2 shadow-lg shadow-green-500/20 border border-green-400">
                <CheckCircle2 size={16} /> With Doctor
              </span>
            )}
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 p-8 flex flex-col items-center bg-white">
          
          {status === 'waiting' && (
            <>
              {/* ETA Circle */}
              <div className="relative flex items-center justify-center w-48 h-48 mb-8">
                <svg className="w-full h-full transform -rotate-90">
                  <circle cx="96" cy="96" r="88" stroke="currentColor" strokeWidth="12" fill="transparent" className="text-gray-100" />
                  <circle cx="96" cy="96" r="88" stroke="currentColor" strokeWidth="12" fill="transparent" strokeDasharray="552" strokeDashoffset={552 - (552 * Math.max(0, (60 - etaMins) / 60))} className="text-brand-500 transition-all duration-1000 ease-in-out" />
                </svg>
                <div className="absolute flex flex-col items-center justify-center text-center">
                  <span className="text-5xl font-black text-gray-900 tracking-tighter">{Math.max(1, Math.round(etaMins))}</span>
                  <span className="text-sm font-bold text-gray-400 uppercase tracking-widest mt-1">Mins Wait</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 w-full mb-8">
                <div className="bg-gray-50 border border-gray-100 rounded-xl p-4 text-center">
                  <span className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Your Token</span>
                  <span className="text-2xl font-bold text-gray-800">#{patient.token}</span>
                </div>
                <div className="bg-gray-50 border border-gray-100 rounded-xl p-4 text-center">
                  <span className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Queue Pos</span>
                  <span className="text-2xl font-bold text-brand-600">{queuePosition}</span>
                </div>
              </div>

              <div className="w-full bg-brand-50 border border-brand-100 rounded-xl p-4 flex items-center justify-between">
                <div>
                  <span className="block text-xs font-bold text-brand-600/70 uppercase tracking-wider mb-1">Estimated Time</span>
                  <span className="text-lg font-bold text-brand-800">{formatTime(etaDate)}</span>
                </div>
                <Clock className="text-brand-300" size={32} />
              </div>
            </>
          )}

          {status === 'called' && (
            <div className="text-center py-12">
              <div className="w-24 h-24 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-6 animate-bounce">
                <AlertCircle size={48} className="text-amber-500" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-3">It's your turn!</h3>
              <p className="text-gray-500 text-base leading-relaxed max-w-[250px] mx-auto">
                The doctor is ready to see you. Please walk into the clinic office now.
              </p>
            </div>
          )}

          {status === 'with_doctor' && (
            <div className="text-center py-12">
              <div className="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <CheckCircle2 size={48} className="text-green-500" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-3">Consultation Started</h3>
              <p className="text-gray-500 text-base leading-relaxed max-w-[250px] mx-auto">
                You are currently with the doctor. Hope you feel better soon!
              </p>
            </div>
          )}

        </div>

        {/* Footer */}
        <div className="p-6 bg-gray-50 border-t border-gray-100 text-center shrink-0">
          <p className="text-[11px] text-gray-400 font-medium">Please refresh this page or keep it open. It will update automatically.</p>
        </div>
      </div>
    </div>
  );
}
