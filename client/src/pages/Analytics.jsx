import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { socket } from '../socket';
import { Home, Users, Calendar, BarChart2, Settings, TrendingUp, Clock, Activity, AlertTriangle } from 'lucide-react';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';

export default function Analytics() {
  const navigate = useNavigate();
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);

  const handleFeatureSoon = () => window.alert('Feature coming soon!');

  useEffect(() => {
    socket.emit('analytics:get', (res) => {
      setData(res || []);
      setLoading(false);
    });
  }, []);

  // Format data for charts
  const trendData = data.map(d => ({
    date: new Date(d.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }),
    Patients: d.patientsSeen,
    AvgConsultation: d.averageConsultation,
    Skipped: d.patientsSkipped
  }));

  // Aggregate hourly data across all days
  const hourlyData = {};
  data.forEach(d => {
    Object.keys(d.consultationsPerHour || {}).forEach(hour => {
      hourlyData[hour] = (hourlyData[hour] || 0) + d.consultationsPerHour[hour];
    });
  });

  const peakHoursData = Object.keys(hourlyData).map(hour => ({
    hour: `${hour}:00`,
    Consultations: hourlyData[hour]
  })).sort((a, b) => parseInt(a.hour) - parseInt(b.hour));

  // KPIs
  const totalPatientsAllTime = data.reduce((sum, d) => sum + d.patientsSeen, 0);
  const avgGlobalConsultation = data.length > 0 ? (data.reduce((sum, d) => sum + d.averageConsultation, 0) / data.length).toFixed(1) : 0;
  const avgPatientsPerDay = data.length > 0 ? Math.round(totalPatientsAllTime / data.length) : 0;

  return (
    <div className="flex h-screen bg-gray-50 font-['Inter'] text-sm text-gray-800 overflow-hidden">
      
      {/* NARROW SIDEBAR */}
      <div className="w-16 bg-white border-r border-gray-200 flex flex-col items-center py-6 shrink-0 z-20">
        <div className="w-8 h-8 bg-brand-600 rounded flex items-center justify-center text-white font-bold text-lg mb-8">
          M
        </div>
        <div className="flex flex-col gap-6 w-full items-center">
          <button onClick={() => navigate('/receptionist')} className="p-2.5 text-gray-400 hover:text-gray-600 cursor-pointer"><Home size={20} strokeWidth={2} /></button>
          <button onClick={() => navigate('/database')} className="p-2.5 text-gray-400 hover:text-gray-600 cursor-pointer" title="Patient Database"><Users size={20} strokeWidth={2} /></button>
          <button onClick={() => navigate('/appointments')} className="p-2.5 text-gray-400 hover:text-gray-600 cursor-pointer" title="Appointments"><Calendar size={20} strokeWidth={2} /></button>
          <button className="p-2.5 bg-brand-50 text-brand-600 rounded-lg cursor-pointer"><BarChart2 size={20} strokeWidth={2} /></button>
        </div>
        <div className="mt-auto mb-4">
          <button onClick={handleFeatureSoon} className="p-2.5 text-gray-400 hover:text-gray-600 cursor-pointer"><Settings size={20} strokeWidth={2} /></button>
        </div>
      </div>

      <div className="flex-1 flex flex-col h-full overflow-hidden">
        {/* TOPBAR */}
        <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-6 z-10 shrink-0">
          <h1 className="font-semibold text-base text-gray-800 tracking-tight">Advanced Analytics</h1>
          <div className="text-sm font-medium text-gray-500 bg-gray-100 px-3 py-1 rounded-full">
            {data.length} Days of Data
          </div>
        </header>

        {/* MAIN CONTENT */}
        <main className="flex-1 overflow-auto p-6 flex flex-col gap-6 custom-scrollbar">
          
          {loading ? (
            <div className="flex items-center justify-center h-full">
              <Activity className="animate-spin text-brand-500" size={32} />
            </div>
          ) : data.length === 0 ? (
            <div className="bg-white border border-gray-200 rounded-xl p-12 flex flex-col items-center justify-center text-center">
              <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mb-4">
                <BarChart2 size={32} className="text-gray-300" />
              </div>
              <h3 className="text-gray-900 font-medium mb-1">No data available yet</h3>
              <p className="text-gray-500 text-sm max-w-sm">Analytics will appear here after you close the clinic for the first time.</p>
            </div>
          ) : (
            <>
              {/* KPI CARDS */}
              <div className="grid grid-cols-3 gap-6 shrink-0">
                <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
                  <div className="flex items-center gap-3 mb-2 text-gray-500">
                    <Users size={18} />
                    <h3 className="font-semibold uppercase tracking-wider text-xs">Total Patients Seen</h3>
                  </div>
                  <p className="text-3xl font-bold text-gray-900">{totalPatientsAllTime}</p>
                </div>
                
                <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
                  <div className="flex items-center gap-3 mb-2 text-gray-500">
                    <TrendingUp size={18} />
                    <h3 className="font-semibold uppercase tracking-wider text-xs">Avg Patients / Day</h3>
                  </div>
                  <p className="text-3xl font-bold text-gray-900">{avgPatientsPerDay}</p>
                </div>
                
                <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
                  <div className="flex items-center gap-3 mb-2 text-gray-500">
                    <Clock size={18} />
                    <h3 className="font-semibold uppercase tracking-wider text-xs">Global Avg Consultation</h3>
                  </div>
                  <p className="text-3xl font-bold text-gray-900">{avgGlobalConsultation} <span className="text-base font-medium text-gray-500">min</span></p>
                </div>
              </div>

              {/* CHARTS */}
              <div className="grid grid-cols-2 gap-6 min-h-[400px]">
                {/* Patient Volume Line Chart */}
                <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm flex flex-col">
                  <h3 className="font-semibold text-gray-800 mb-6 flex items-center gap-2">
                    <Activity size={18} className="text-brand-500" />
                    Patient Volume Trend
                  </h3>
                  <div className="flex-1 min-h-[300px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={trendData} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                        <XAxis dataKey="date" tick={{fontSize: 12}} tickMargin={10} stroke="#9ca3af" />
                        <YAxis tick={{fontSize: 12}} stroke="#9ca3af" />
                        <Tooltip 
                          contentStyle={{borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'}}
                          cursor={{fill: '#f3f4f6'}}
                        />
                        <Legend />
                        <Line type="monotone" dataKey="Patients" stroke="#3b82f6" strokeWidth={3} dot={{r: 4, strokeWidth: 2}} activeDot={{r: 6}} />
                        <Line type="monotone" dataKey="Skipped" stroke="#ef4444" strokeWidth={2} dot={{r: 3}} />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* Consultation Time Bar Chart */}
                <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm flex flex-col">
                  <h3 className="font-semibold text-gray-800 mb-6 flex items-center gap-2">
                    <Clock size={18} className="text-amber-500" />
                    Avg Consultation Time (mins)
                  </h3>
                  <div className="flex-1 min-h-[300px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={trendData} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                        <XAxis dataKey="date" tick={{fontSize: 12}} tickMargin={10} stroke="#9ca3af" />
                        <YAxis tick={{fontSize: 12}} stroke="#9ca3af" />
                        <Tooltip 
                          contentStyle={{borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'}}
                          cursor={{fill: '#f3f4f6'}}
                        />
                        <Bar dataKey="AvgConsultation" name="Avg Time (m)" fill="#f59e0b" radius={[4, 4, 0, 0]} barSize={20} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* Peak Hours Area Chart */}
                <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm flex flex-col col-span-2">
                  <h3 className="font-semibold text-gray-800 mb-6 flex items-center gap-2">
                    <TrendingUp size={18} className="text-purple-500" />
                    Peak Clinic Hours (Aggregate)
                  </h3>
                  <div className="flex-1 min-h-[300px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={peakHoursData} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                        <XAxis dataKey="hour" tick={{fontSize: 12}} tickMargin={10} stroke="#9ca3af" />
                        <YAxis tick={{fontSize: 12}} stroke="#9ca3af" />
                        <Tooltip 
                          contentStyle={{borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'}}
                          cursor={{fill: '#f3f4f6'}}
                        />
                        <Bar dataKey="Consultations" fill="#8b5cf6" radius={[4, 4, 0, 0]} barSize={40} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>
            </>
          )}
        </main>
      </div>
    </div>
  );
}
