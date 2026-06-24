import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Setup from './pages/Setup';
import Receptionist from './pages/Receptionist';
import Display from './pages/Display';
import Summary from './pages/Summary';
import Database from './pages/Database';
import PrintSlip from './pages/PrintSlip';
import Appointments from './pages/Appointments';
import Analytics from './pages/Analytics';
import PatientPortal from './pages/PatientPortal';
import PatientTracking from './pages/PatientTracking';
import SplitView from './pages/SplitView';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Navigate to="/setup" replace />} />
        <Route path="/setup" element={<Setup />} />
        <Route path="/receptionist" element={<Receptionist />} />
        <Route path="/display" element={<Display />} />
        <Route path="/summary" element={<Summary />} />
        <Route path="/database" element={<Database />} />
        <Route path="/appointments" element={<Appointments />} />
        <Route path="/analytics" element={<Analytics />} />
        <Route path="/print/:token" element={<PrintSlip />} />
        <Route path="/portal" element={<PatientPortal />} />
        <Route path="/status/:id" element={<PatientTracking />} />
        <Route path="/split" element={<SplitView />} />
      </Routes>
    </Router>
  );
}

export default App;
