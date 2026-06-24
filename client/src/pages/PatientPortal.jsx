import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { socket } from '../socket';
import { User, Phone, Calendar, Clock, ArrowRight, Activity, CheckCircle2 } from 'lucide-react';

export default function PatientPortal() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('walkin'); // 'walkin' or 'book'
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    date: new Date(Date.now() + 86400000).toISOString().split('T')[0], // Tomorrow
    time: '09:00',
    age: '',
    note: ''
  });

  const handleWalkin = (e) => {
    e.preventDefault();
    if (!formData.name || !formData.phone) return;
    setLoading(true);

    socket.emit('patient:add', formData, (res) => {
      setLoading(false);
      if (res.warning) {
        if (window.confirm(`${res.message} Register anyway?`)) {
          socket.emit('patient:add_force', formData, (forceRes) => {
            if (forceRes.success) {
              navigate(`/status/${forceRes.patient.token}`);
            }
          });
        }
      } else if (res.success) {
        navigate(`/status/${res.patient.token}`);
      }
    });
  };

  const handleBooking = (e) => {
    e.preventDefault();
    if (!formData.name || !formData.phone || !formData.date || !formData.time) return;
    setLoading(true);

    socket.emit('appointments:add', formData, (res) => {
      setLoading(false);
      if (res.success) {
        setSuccess(true);
      }
    });
  };

  const handleInputChange = (e) => {
    setFormData(prev => ({...prev, [e.target.name]: e.target.value}));
  };

  if (success) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4 font-['Inter']">
        <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-8 text-center animate-in fade-in zoom-in-95">
          <div className="w-20 h-20 bg-green-50 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle2 size={40} className="text-green-500" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Booking Confirmed!</h2>
          <p className="text-gray-500 mb-8">We've sent a confirmation text to {formData.phone}. See you on {formData.date} at {formData.time}.</p>
          <button 
            onClick={() => { setSuccess(false); setFormData({...formData, name: '', phone: ''}); }}
            className="w-full bg-brand-600 text-white font-semibold py-3 rounded-xl hover:bg-brand-700 transition-colors"
          >
            Book Another Appointment
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 font-['Inter'] flex flex-col md:items-center md:justify-center p-0 md:p-6">
      
      <div className="w-full max-w-md bg-white md:rounded-2xl md:shadow-xl overflow-hidden min-h-screen md:min-h-0 flex flex-col">
        {/* Header */}
        <div className="bg-brand-600 p-8 text-center text-white shrink-0 relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-full opacity-10 pointer-events-none" style={{ backgroundImage: 'radial-gradient(circle at 20% 150%, #ffffff 0%, transparent 50%)'}}></div>
          <div className="w-16 h-16 bg-white/20 backdrop-blur-sm rounded-2xl mx-auto flex items-center justify-center mb-4 shadow-inner">
            <Activity size={32} className="text-white" />
          </div>
          <h1 className="text-2xl font-bold mb-1 tracking-tight">MedQueue</h1>
          <p className="text-brand-100 text-sm">Patient Portal</p>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-gray-100 shrink-0">
          <button 
            onClick={() => setActiveTab('walkin')}
            className={`flex-1 py-4 text-sm font-semibold transition-colors ${activeTab === 'walkin' ? 'text-brand-600 border-b-2 border-brand-600' : 'text-gray-500 hover:text-gray-800 hover:bg-gray-50'}`}
          >
            Walk-in Today
          </button>
          <button 
            onClick={() => setActiveTab('book')}
            className={`flex-1 py-4 text-sm font-semibold transition-colors ${activeTab === 'book' ? 'text-brand-600 border-b-2 border-brand-600' : 'text-gray-500 hover:text-gray-800 hover:bg-gray-50'}`}
          >
            Book Future
          </button>
        </div>

        {/* Form Container */}
        <div className="flex-1 p-6 overflow-auto custom-scrollbar bg-gray-50/30">
          <form onSubmit={activeTab === 'walkin' ? handleWalkin : handleBooking} className="flex flex-col gap-5">
            
            <div className="space-y-4">
              <h3 className="text-sm font-bold text-gray-800 flex items-center gap-2">
                <User size={16} className="text-gray-400" /> Patient Details
              </h3>
              
              <div>
                <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wider mb-1.5 ml-1">Full Name *</label>
                <input 
                  type="text" 
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all shadow-sm"
                  placeholder="e.g. John Doe"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wider mb-1.5 ml-1">Mobile Number *</label>
                <div className="relative">
                  <Phone size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input 
                    type="tel" 
                    name="phone"
                    value={formData.phone}
                    onChange={handleInputChange}
                    className="w-full pl-11 pr-4 py-3 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all shadow-sm"
                    placeholder="(555) 000-0000"
                    required
                  />
                </div>
                <p className="text-[11px] text-gray-500 mt-1.5 ml-1 flex items-center gap-1">
                  We'll send you SMS updates about your wait time.
                </p>
              </div>
            </div>

            {activeTab === 'book' && (
              <div className="space-y-4 mt-2 pt-6 border-t border-gray-100">
                <h3 className="text-sm font-bold text-gray-800 flex items-center gap-2">
                  <Calendar size={16} className="text-gray-400" /> Appointment Details
                </h3>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wider mb-1.5 ml-1">Date *</label>
                    <input 
                      type="date" 
                      name="date"
                      value={formData.date}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all shadow-sm"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wider mb-1.5 ml-1">Time *</label>
                    <div className="relative">
                      <Clock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                      <input 
                        type="time" 
                        name="time"
                        value={formData.time}
                        onChange={handleInputChange}
                        className="w-full pl-9 pr-3 py-3 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all shadow-sm"
                        required
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}

            <button 
              type="submit" 
              disabled={loading || !formData.name || !formData.phone}
              className="mt-6 w-full flex items-center justify-center gap-2 bg-brand-600 hover:bg-brand-700 disabled:opacity-50 disabled:bg-gray-400 text-white font-semibold py-3.5 rounded-xl transition-colors shadow-md shadow-brand-500/20 cursor-pointer"
            >
              {loading ? (
                <Activity size={20} className="animate-spin" />
              ) : activeTab === 'walkin' ? (
                <>Join Live Queue <ArrowRight size={18} /></>
              ) : (
                <>Confirm Booking <ArrowRight size={18} /></>
              )}
            </button>
            
          </form>
        </div>

      </div>
    </div>
  );
}
