import React, { useState, useEffect } from 'react';
import { socket } from '../socket';
import { Search, User, ArrowLeft, Calendar, FileText } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function Database() {
  const [patients, setPatients] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    socket.emit('db:patients:get', (data) => {
      setPatients(data.sort((a, b) => b.lastVisit - a.lastVisit));
      setLoading(false);
    });
  }, []);

  const filtered = patients.filter(p => p.name.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col font-['Inter']">
      <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-6 shrink-0">
        <div className="flex items-center gap-4">
          <button onClick={() => navigate('/receptionist')} className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-full transition-colors">
            <ArrowLeft size={20} />
          </button>
          <h1 className="font-semibold text-lg text-gray-900 tracking-tight">Patient Database</h1>
        </div>
      </header>

      <main className="flex-1 p-8 max-w-7xl w-full mx-auto">
        <div className="bg-white border border-gray-200 rounded-xl shadow-sm flex flex-col overflow-hidden h-[80vh]">
          
          <div className="p-6 border-b border-gray-100 flex items-center justify-between bg-white">
            <div className="relative w-96">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
              <input 
                type="text" 
                placeholder="Search patient name..." 
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:bg-white focus:border-brand-500 focus:ring-1 focus:ring-brand-500 transition-colors text-sm"
              />
            </div>
            <div className="text-sm font-medium text-gray-500">
              {filtered.length} Patients found
            </div>
          </div>

          <div className="flex-1 overflow-auto custom-scrollbar">
            {loading ? (
              <div className="p-12 text-center text-gray-500">Loading database...</div>
            ) : (
              <table className="w-full text-left border-collapse text-sm">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider bg-gray-50/50 sticky top-0 z-10">Patient Name</th>
                    <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider bg-gray-50/50 sticky top-0 z-10">Age</th>
                    <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider bg-gray-50/50 sticky top-0 z-10">Total Visits</th>
                    <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider bg-gray-50/50 sticky top-0 z-10">Last Visit</th>
                    <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider bg-gray-50/50 sticky top-0 z-10">Last Note</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {filtered.map(p => (
                    <tr key={p.id} className="hover:bg-gray-50/50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-brand-50 flex items-center justify-center text-brand-600">
                            <User size={16} />
                          </div>
                          <span className="font-semibold text-gray-900">{p.name}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-gray-600 font-medium">
                        {p.age || '--'}
                      </td>
                      <td className="px-6 py-4">
                        <span className="bg-blue-50 text-blue-700 px-2.5 py-1 rounded-md text-xs font-bold border border-blue-200">
                          {p.visits} Visits
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2 text-gray-600">
                          <Calendar size={14} className="text-gray-400" />
                          <span>{new Date(p.lastVisit).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        {p.lastNote ? (
                          <div className="flex items-start gap-1.5 max-w-[200px] text-gray-600 text-xs">
                            <FileText size={14} className="text-amber-500 shrink-0 mt-0.5" />
                            <span className="truncate" title={p.lastNote}>{p.lastNote}</span>
                          </div>
                        ) : (
                          <span className="text-gray-400 italic text-xs">No notes</span>
                        )}
                      </td>
                    </tr>
                  ))}
                  {filtered.length === 0 && (
                    <tr>
                      <td colSpan="5" className="py-12 text-center text-gray-500 bg-gray-50/30">
                        No patients match your search.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
