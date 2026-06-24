import React from 'react';

export default function AnalyticsStrip({ stats }) {
  if (!stats) return null;
  
  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
      
      <div className="bg-white border border-gray-200 border-l-4 border-l-blue-500 rounded-lg p-5 flex flex-col justify-between">
        <p className="text-xs font-medium text-gray-500 mb-2 uppercase tracking-wide">Patients Seen Today</p>
        <p className="text-3xl font-medium text-gray-900">{stats.patientsSeen}</p>
      </div>

      <div className="bg-white border border-gray-200 border-l-4 border-l-amber-500 rounded-lg p-5 flex flex-col justify-between">
        <p className="text-xs font-medium text-gray-500 mb-2 uppercase tracking-wide">Avg Wait Time</p>
        <p className="text-3xl font-medium text-gray-900">{stats.rollingAverage * 2}<span className="text-xl font-medium text-gray-500 ml-1">m</span></p>
      </div>

      <div className="bg-white border border-gray-200 border-l-4 border-l-green-500 rounded-lg p-5 flex flex-col justify-between">
        <p className="text-xs font-medium text-gray-500 mb-2 uppercase tracking-wide">Avg Consultation</p>
        <p className="text-3xl font-medium text-gray-900">{stats.rollingAverage}<span className="text-xl font-medium text-gray-500 ml-1">m</span></p>
      </div>

      <div className="bg-white border border-gray-200 border-l-4 border-l-red-500 rounded-lg p-5 flex flex-col justify-between">
        <p className="text-xs font-medium text-gray-500 mb-2 uppercase tracking-wide">Skipped Today</p>
        <p className="text-3xl font-medium text-gray-900">{stats.patientsSkipped}</p>
      </div>

    </div>
  );
}
