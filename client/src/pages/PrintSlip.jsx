import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { socket } from '../socket';
import { calculateETA } from '../utils/eta';

export default function PrintSlip() {
  const { token } = useParams();
  const [queueState, setQueueState] = useState(null);
  const [historyData, setHistoryData] = useState(null);

  useEffect(() => {
    const handleUpdate = (state) => setQueueState(state);
    socket.on('queue:updated', handleUpdate);
    socket.emit('state:get');
    socket.emit('history:get', (data) => setHistoryData(data));
    return () => socket.off('queue:updated', handleUpdate);
  }, []);

  if (!queueState) return <div className="p-10 text-center font-mono">Loading ticket data...</div>;

  const patient = queueState.allPatients.find(p => p.token.toString() === token);
  
  if (!patient) return <div className="p-10 text-center font-mono text-red-600">Ticket not found or invalid.</div>;

  const clinicName = queueState.setupConfig?.clinicName || 'Clinic';
  const etaMins = calculateETA(patient, queueState, historyData);
  const dateStr = new Date().toLocaleDateString('en-GB');

  return (
    <>
      <style>
        {`
          @media print {
            body * {
              visibility: hidden;
            }
            #print-section, #print-section * {
              visibility: visible;
            }
            #print-section {
              position: absolute;
              left: 0;
              top: 0;
              width: 100%;
            }
            .no-print {
              display: none !important;
            }
          }
        `}
      </style>
      <div className="min-h-screen bg-gray-100 flex items-center justify-center p-6">
        <div className="bg-white p-10 rounded shadow-md max-w-sm w-full flex flex-col items-center">
          
          <div id="print-section" className="w-full text-center text-black font-sans bg-white">
            <h1 className="text-2xl font-bold uppercase tracking-wider border-b-2 border-black pb-4 mb-6">{clinicName}</h1>
            <p className="text-sm font-semibold uppercase tracking-widest text-gray-500 mb-2">Token Number</p>
            <div className="text-7xl font-black tabular-nums my-4">
              {token}
            </div>
            <p className="text-xl font-bold mt-4 mb-2">{patient.name}</p>
            <div className="border-t border-dashed border-gray-400 pt-4 mt-6">
              <p className="text-lg font-medium">Estimated wait: ~{etaMins} mins</p>
              <p className="text-sm text-gray-600 mt-2">Date: {dateStr}</p>
            </div>
          </div>

          <button 
            onClick={() => window.print()} 
            className="no-print mt-10 w-full bg-black text-white font-bold py-3 rounded hover:bg-gray-800 transition-colors cursor-pointer"
          >
            Print Now
          </button>
        </div>
      </div>
    </>
  );
}
