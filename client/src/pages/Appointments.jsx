import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { socket } from '../socket';
import { Home, Users, Calendar, BarChart2, Settings, Plus, Calendar as CalendarIcon, CheckCircle2, Clock, X, Trash2, Edit2, Play } from 'lucide-react';

export default function Appointments() {
  const navigate = useNavigate();
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [appointments, setAppointments] = useState([]);
  
  // Form State
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [formState, setFormState] = useState({ name: '', age: '', time: '09:00', note: '' });
  
  const handleFeatureSoon = () => window.alert('Feature coming soon!');

  useEffect(() => {
    // Fetch appointments for the selected date
    socket.emit('appointments:get', { date }, (data) => {
      setAppointments(data);
    });

    const handleUpdate = (data) => {
      if (data.date === date) {
        setAppointments(data.appointments);
      }
    };

    socket.on('appointments:updated', handleUpdate);
    return () => socket.off('appointments:updated', handleUpdate);
  }, [date]);

  const handleAddAppointment = (e) => {
    e.preventDefault();
    if (!formState.name.trim() || !formState.time) return;

    socket.emit('appointments:add', { ...formState, date }, (res) => {
      if (res.success) {
        setFormState({ name: '', age: '', time: '09:00', note: '' });
        setIsFormOpen(false);
      }
    });
  };

  const handleCheckIn = (id) => {
    socket.emit('appointments:checkin', { id, date }, (res) => {
      if (!res.success) {
        window.alert(res.message || 'Failed to check in');
      }
    });
  };

  const handleDelete = (id) => {
    if (window.confirm('Are you sure you want to cancel this appointment?')) {
      socket.emit('appointments:delete', { id, date });
    }
  };

  const isToday = date === new Date().toISOString().split('T')[0];

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
          <button className="p-2.5 bg-brand-50 text-brand-600 rounded-lg cursor-pointer"><Calendar size={20} strokeWidth={2} /></button>
          <button onClick={() => navigate('/analytics')} className="p-2.5 text-gray-400 hover:text-gray-600 cursor-pointer" title="Analytics"><BarChart2 size={20} strokeWidth={2} /></button>
        </div>
        <div className="mt-auto mb-4">
          <button onClick={handleFeatureSoon} className="p-2.5 text-gray-400 hover:text-gray-600 cursor-pointer"><Settings size={20} strokeWidth={2} /></button>
        </div>
      </div>

      <div className="flex-1 flex flex-col h-full overflow-hidden">
        {/* TOPBAR */}
        <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-6 z-10 shrink-0">
          <h1 className="font-semibold text-base text-gray-800 tracking-tight">Appointments</h1>
          <div className="flex items-center gap-4">
            <div className="flex items-center bg-gray-50 border border-gray-200 rounded-lg px-3 py-1.5 focus-within:border-brand-500 focus-within:ring-1 focus-within:ring-brand-500 transition-all">
              <CalendarIcon size={16} className="text-gray-400 mr-2" />
              <input 
                type="date" 
                value={date} 
                onChange={(e) => setDate(e.target.value)} 
                className="bg-transparent border-none outline-none text-sm font-medium text-gray-700 w-32 cursor-pointer"
              />
            </div>
            <button onClick={() => setIsFormOpen(true)} className="bg-brand-600 hover:bg-brand-700 text-white px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 transition-colors cursor-pointer">
              <Plus size={16} /> New Appointment
            </button>
          </div>
        </header>

        {/* MAIN CONTENT */}
        <main className="flex-1 overflow-auto p-6 flex justify-center custom-scrollbar">
          <div className="w-full max-w-4xl">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-semibold text-gray-800">
                {isToday ? 'Today\'s Appointments' : `Appointments for ${new Date(date).toLocaleDateString(undefined, { weekday: 'long', month: 'short', day: 'numeric' })}`}
              </h2>
              <span className="bg-gray-100 text-gray-600 px-3 py-1 rounded-full text-xs font-bold">{appointments.length} Total</span>
            </div>

            {appointments.length === 0 ? (
              <div className="bg-white border border-gray-200 rounded-xl p-12 flex flex-col items-center justify-center text-center">
                <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mb-4">
                  <CalendarIcon size={32} className="text-gray-300" />
                </div>
                <h3 className="text-gray-900 font-medium mb-1">No appointments</h3>
                <p className="text-gray-500 text-sm max-w-sm">There are no appointments scheduled for this date. Click "New Appointment" to book one.</p>
              </div>
            ) : (
              <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
                <table className="w-full text-left border-collapse text-sm">
                  <thead>
                    <tr className="border-b border-gray-200 bg-gray-50/50">
                      <th className="px-6 py-4 text-xs font-medium text-gray-500 uppercase tracking-wider w-24">Time</th>
                      <th className="px-6 py-4 text-xs font-medium text-gray-500 uppercase tracking-wider">Patient Details</th>
                      <th className="px-6 py-4 text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                      <th className="px-6 py-4 text-xs font-medium text-gray-500 uppercase tracking-wider text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {appointments.map(appt => (
                      <tr key={appt.id} className="hover:bg-gray-50/50 transition-colors group">
                        <td className="px-6 py-4 font-mono text-gray-600 font-medium">
                          {appt.time}
                        </td>
                        <td className="px-6 py-4">
                          <span className="font-medium text-gray-900 block">{appt.name} {appt.age && <span className="text-gray-500 font-normal">({appt.age}y)</span>}</span>
                          {appt.note && <span className="text-xs text-gray-500 mt-0.5 block">{appt.note}</span>}
                        </td>
                        <td className="px-6 py-4">
                          {appt.status === 'Scheduled' ? (
                            <span className="bg-amber-50 text-amber-700 px-2.5 py-1 rounded text-xs font-medium border border-amber-200 inline-flex items-center gap-1.5">
                              <Clock size={12} /> Scheduled
                            </span>
                          ) : (
                            <span className="bg-green-50 text-green-700 px-2.5 py-1 rounded text-xs font-medium border border-green-200 inline-flex items-center gap-1.5">
                              <CheckCircle2 size={12} /> Checked In
                            </span>
                          )}
                        </td>
                        <td className="px-6 py-4 text-right">
                          <div className="flex justify-end gap-2 items-center">
                            {appt.status === 'Scheduled' && isToday && (
                              <button onClick={() => handleCheckIn(appt.id)} className="px-3 py-1.5 bg-brand-50 text-brand-700 hover:bg-brand-100 rounded text-xs font-semibold border border-brand-200 flex items-center gap-1 transition-colors cursor-pointer">
                                <Play size={14} fill="currentColor" /> Check In
                              </button>
                            )}
                            <button onClick={() => handleDelete(appt.id)} className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors cursor-pointer" title="Cancel Appointment">
                              <Trash2 size={16} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </main>
      </div>

      {/* NEW APPOINTMENT MODAL */}
      {isFormOpen && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
              <h2 className="text-lg font-semibold text-gray-800">Book Appointment</h2>
              <button onClick={() => setIsFormOpen(false)} className="text-gray-400 hover:text-gray-600 p-1 rounded-md hover:bg-gray-200 transition-colors cursor-pointer">
                <X size={20} />
              </button>
            </div>
            
            <form onSubmit={handleAddAppointment} className="p-6 flex flex-col gap-5">
              <div>
                <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wider mb-1.5">Patient Name *</label>
                <input 
                  autoFocus
                  type="text" 
                  value={formState.name}
                  onChange={(e) => setFormState(prev => ({...prev, name: e.target.value}))}
                  className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all"
                  placeholder="e.g. John Doe"
                  required
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wider mb-1.5">Time *</label>
                  <input 
                    type="time" 
                    value={formState.time}
                    onChange={(e) => setFormState(prev => ({...prev, time: e.target.value}))}
                    className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all cursor-pointer"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wider mb-1.5">Age</label>
                  <input 
                    type="number" 
                    value={formState.age}
                    onChange={(e) => setFormState(prev => ({...prev, age: e.target.value}))}
                    className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all"
                    placeholder="Years"
                  />
                </div>
              </div>
              
              <div>
                <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wider mb-1.5">Notes (Optional)</label>
                <input 
                  type="text" 
                  value={formState.note}
                  onChange={(e) => setFormState(prev => ({...prev, note: e.target.value}))}
                  className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all"
                  placeholder="Reason for visit, contact info, etc."
                />
              </div>

              <div className="flex gap-3 pt-4 mt-2 border-t border-gray-100">
                <button type="button" onClick={() => setIsFormOpen(false)} className="flex-1 px-4 py-2.5 bg-white border border-gray-300 text-gray-700 hover:bg-gray-50 rounded-lg text-sm font-semibold transition-colors cursor-pointer">
                  Cancel
                </button>
                <button type="submit" disabled={!formState.name.trim() || !formState.time} className="flex-1 px-4 py-2.5 bg-brand-600 text-white hover:bg-brand-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg text-sm font-semibold transition-colors shadow-sm cursor-pointer">
                  Save Appointment
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
