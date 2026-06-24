import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { socket } from '../socket';
import { Activity, ArrowRight } from 'lucide-react';

export default function Setup() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    clinicName: 'MedQueue Clinic',
    walkTime: 'same',
    mode: 'Normal',
    defaultTime: 15
  });

  useEffect(() => {
    const storedConfig = localStorage.getItem('medqueue_config');
    const storedDate = localStorage.getItem('medqueue_date');
    const today = new Date().toDateString();

    if (storedConfig && storedDate === today) {
      const config = JSON.parse(storedConfig);
      socket.emit('setup:init', config);
      navigate('/receptionist');
    }
  }, [navigate]);

  const handleSubmit = (e) => {
    e.preventDefault();
    const config = { ...formData, defaultTime: Number(formData.defaultTime) };
    
    localStorage.setItem('medqueue_config', JSON.stringify(config));
    localStorage.setItem('medqueue_date', new Date().toDateString());
    
    socket.emit('setup:init', config);
    
    navigate('/receptionist');
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-gradient-to-br from-brand-50 to-teal-50 font-['Outfit'] relative overflow-hidden">
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-brand-500/10 blur-[100px] rounded-full pointer-events-none"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-teal-500/10 blur-[100px] rounded-full pointer-events-none"></div>

      <div className="bg-white/80 backdrop-blur-2xl p-10 rounded-[3rem] w-full max-w-xl shadow-[0_20px_60px_-15px_rgba(0,0,0,0.05)] border border-white relative z-10">
        
        <div className="flex flex-col items-center mb-10 text-center">
          <div className="bg-gradient-to-br from-brand-500 to-teal-400 p-5 rounded-[2rem] shadow-[0_0_30px_rgba(45,212,191,0.3)] mb-6 text-white animate-float">
            <Activity size={48} strokeWidth={2.5} />
          </div>
          <h1 className="text-4xl font-bold text-gray-800 tracking-tight mb-2">System Setup</h1>
          <p className="text-gray-500 font-medium">Configure your queue session for today</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-gray-400 uppercase tracking-widest ml-1">Clinic Name</label>
            <input type="text" value={formData.clinicName} onChange={e => setFormData({...formData, clinicName: e.target.value})} className="w-full bg-gray-50/50 border border-gray-200 rounded-2xl p-4 font-bold text-gray-800 text-lg focus:ring-2 focus:ring-brand-500 focus:bg-white outline-none transition-all" required />
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-gray-400 uppercase tracking-widest ml-1">Walk Time</label>
              <select value={formData.walkTime} onChange={e => setFormData({...formData, walkTime: e.target.value})} className="w-full bg-gray-50/50 border border-gray-200 rounded-2xl p-4 font-bold text-gray-800 focus:ring-2 focus:ring-brand-500 outline-none transition-all appearance-none cursor-pointer">
                <option value="same">Same Floor (60s)</option>
                <option value="diff">Different Floor (180s)</option>
              </select>
            </div>
            
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-gray-400 uppercase tracking-widest ml-1">Today's Mode</label>
              <select value={formData.mode} onChange={e => setFormData({...formData, mode: e.target.value})} className="w-full bg-gray-50/50 border border-gray-200 rounded-2xl p-4 font-bold text-gray-800 focus:ring-2 focus:ring-brand-500 outline-none transition-all appearance-none cursor-pointer">
                <option value="Normal">Normal Day</option>
                <option value="Holiday">Holiday Mode</option>
              </select>
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-gray-400 uppercase tracking-widest ml-1">Default Consultation Time (mins)</label>
            <input type="number" min="1" value={formData.defaultTime} onChange={e => setFormData({...formData, defaultTime: e.target.value})} className="w-full bg-gray-50/50 border border-gray-200 rounded-2xl p-4 font-bold text-gray-800 text-lg focus:ring-2 focus:ring-brand-500 focus:bg-white outline-none transition-all" required />
          </div>
          
          <button type="submit" className="w-full bg-gray-900 hover:bg-black text-white font-bold py-5 rounded-2xl transition-all shadow-xl hover:shadow-2xl flex justify-center items-center gap-2 mt-8 cursor-pointer text-lg">
            Open Clinic <ArrowRight size={20} />
          </button>
        </form>
      </div>
    </div>
  );
}
