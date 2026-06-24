import React from 'react';
import { Info, Clock } from 'lucide-react';
import { calculateETA } from '../utils/eta';

export default function WalkInWarning({ queueState, historyData }) {
  if (!queueState || !queueState.setupConfig) return null;
  
  const mockPatient = { token: 'NEW', status: 'Waiting' };
  const mockState = {
    ...queueState,
    lists: {
      ...queueState.lists,
      waiting: [...queueState.lists.waiting, mockPatient]
    }
  };

  const etaMins = calculateETA(mockPatient, mockState, historyData);

  return (
    <div className="bg-white border border-gray-200 rounded-lg shadow-sm mt-6 shrink-0">
       <div className="px-5 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50/30">
         <h2 className="font-semibold text-sm text-gray-800">Walk-in Estimate</h2>
         <Info size={14} className="text-gray-400" />
       </div>
       <div className="p-5 flex items-start gap-4">
         <div className="p-2 bg-brand-50 text-brand-600 rounded-lg shrink-0 mt-0.5">
           <Clock size={18} />
         </div>
         <div>
           <p className="text-sm font-medium text-gray-900 mb-1">Current Wait Time</p>
           <p className="text-xs text-gray-500 leading-relaxed">
             {queueState.isBreak ? (
               <span className="font-semibold text-amber-600">ETA calculation paused (Doctor on break)</span>
             ) : (
               <>A new patient joining the queue right now would wait approximately <span className="font-semibold text-gray-900">{etaMins} mins</span>.</>
             )}
           </p>
         </div>
       </div>
    </div>
  );
}
