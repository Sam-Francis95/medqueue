import React, { useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

export default function Summary() {
  const location = useLocation();
  const navigate = useNavigate();
  const summary = location.state?.summary;
  
  if (!summary) {
    return (
      <div className="min-h-screen bg-bg-app flex flex-col items-center justify-center p-6 gap-4">
        <p className="text-gray-500">No summary data available.</p>
        <button onClick={() => navigate('/setup')} className="bg-brand text-white px-4 py-2 rounded-lg cursor-pointer">Go to Setup</button>
      </div>
    );
  }

  useEffect(() => {
    if (summary) {
      localStorage.setItem(`medqueue_summary_${new Date().toDateString()}`, JSON.stringify(summary));
    }
  }, [summary]);

  const formatBreakTime = (seconds) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}m ${s}s`;
  };

  const consultationsPerHour = summary.consultationsPerHour || {};
  const maxConsults = Math.max(1, ...Object.values(consultationsPerHour));
  const hours = Object.keys(consultationsPerHour).sort((a,b) => parseInt(a) - parseInt(b));
  
  let peakHour = 'N/A';
  if (hours.length > 0) {
    const peakStr = hours.reduce((a, b) => consultationsPerHour[a] > consultationsPerHour[b] ? a : b);
    peakHour = `${peakStr}:00`;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-brand-light to-blue-100 flex items-center justify-center p-6">
      <div className="bg-white/90 backdrop-blur-xl p-10 rounded-3xl shadow-2xl w-full max-w-2xl border border-white">
        <h1 className="text-4xl font-bold text-center text-gray-800 mb-2">End of Day Summary</h1>
        <p className="text-center text-gray-500 mb-10">{new Date().toDateString()}</p>
        
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-10">
          <div className="bg-blue-50 rounded-2xl p-6 text-center border border-blue-100 shadow-sm">
            <p className="text-sm font-bold text-brand uppercase tracking-widest mb-2">Patients Seen</p>
            <p className="text-5xl font-black text-gray-800">{summary.patientsSeen}</p>
          </div>
          <div className="bg-green-50 rounded-2xl p-6 text-center border border-green-100 shadow-sm">
            <p className="text-sm font-bold text-green-600 uppercase tracking-widest mb-2">Avg Consult</p>
            <p className="text-5xl font-black text-gray-800">{summary.averageConsultation}<span className="text-2xl text-gray-500 font-medium ml-1">m</span></p>
          </div>
          <div className="bg-red-50 rounded-2xl p-6 text-center border border-red-100 shadow-sm">
            <p className="text-sm font-bold text-red-600 uppercase tracking-widest mb-2">Skips</p>
            <p className="text-5xl font-black text-gray-800">{summary.patientsSkipped}</p>
          </div>
          <div className="bg-amber-50 rounded-2xl p-6 text-center border border-amber-100 shadow-sm">
            <p className="text-sm font-bold text-amber-600 uppercase tracking-widest mb-2">Break Time</p>
            <p className="text-3xl font-black text-gray-800 mt-2">{formatBreakTime(summary.totalBreakTime)}</p>
          </div>
          <div className="bg-purple-50 rounded-2xl p-6 text-center border border-purple-100 shadow-sm">
            <p className="text-sm font-bold text-purple-600 uppercase tracking-widest mb-2">Peak Hour</p>
            <p className="text-3xl font-black text-gray-800 mt-2">{peakHour}</p>
          </div>
        </div>
        
        {hours.length > 0 && (
          <div className="mb-10">
            <h2 className="text-sm font-bold text-gray-500 uppercase tracking-widest mb-4">Consultations Per Hour</h2>
            <div className="flex items-end gap-2 h-32 w-full border-b border-gray-200 pb-2">
              {hours.map(h => {
                const count = consultationsPerHour[h];
                const heightPct = (count / maxConsults) * 100;
                const hourNum = parseInt(h);
                let colorClass = "bg-blue-500 group-hover:bg-blue-600";
                if (hourNum === 10 || hourNum === 11) colorClass = "bg-amber-400 group-hover:bg-amber-500";
                else if (hourNum === 13 || hourNum === 14) colorClass = "bg-green-500 group-hover:bg-green-600";

                return (
                  <div key={h} className="flex-1 flex flex-col justify-end items-center group relative h-full">
                    <div 
                      className={`w-full max-w-[40px] rounded-t-md transition-all relative ${colorClass}`} 
                      style={{ height: `${Math.max(10, heightPct)}%` }}
                    >
                      <span className="absolute -top-6 left-1/2 -translate-x-1/2 text-xs font-bold text-gray-700 opacity-0 group-hover:opacity-100 transition-opacity">
                        {count}
                      </span>
                    </div>
                    <span className="text-[10px] text-gray-400 mt-2 absolute -bottom-6">{h}:00</span>
                  </div>
                );
              })}
            </div>
            <div className="h-6"></div>
          </div>
        )}
        
        <button 
          onClick={() => {
            localStorage.removeItem('medqueue_config');
            localStorage.removeItem('medqueue_date');
            navigate('/setup');
          }} 
          className="w-full bg-gray-800 hover:bg-gray-900 text-white font-bold py-4 rounded-xl transition-all shadow-md hover:shadow-lg cursor-pointer"
        >
          Return to Setup
        </button>
      </div>
    </div>
  );
}
