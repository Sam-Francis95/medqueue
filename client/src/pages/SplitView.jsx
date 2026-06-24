import React from 'react';

export default function SplitView() {
  return (
    <div className="h-screen w-full flex flex-col md:flex-row overflow-hidden bg-slate-900">
      {/* Receptionist View (Left side) */}
      <div className="w-full md:w-1/2 h-1/2 md:h-full border-b md:border-b-0 md:border-r border-slate-700 relative">
        <div className="absolute top-0 left-0 bg-indigo-600 text-white text-xs font-bold px-3 py-1 rounded-br-lg z-10 shadow-md">
          Receptionist View
        </div>
        <iframe 
          src="/receptionist" 
          className="w-full h-full border-none"
          title="Receptionist Dashboard"
        />
      </div>

      {/* Display View (Right side) */}
      <div className="w-full md:w-1/2 h-1/2 md:h-full relative">
        <div className="absolute top-0 left-0 bg-emerald-600 text-white text-xs font-bold px-3 py-1 rounded-br-lg z-10 shadow-md">
          TV Display View
        </div>
        <iframe 
          src="/display" 
          className="w-full h-full border-none"
          title="TV Display"
        />
      </div>
    </div>
  );
}
