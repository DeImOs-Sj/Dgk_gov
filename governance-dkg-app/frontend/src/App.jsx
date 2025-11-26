import React from 'react';
import { BrowserRouter as Router, Routes, Route, Link, useLocation } from 'react-router-dom';
import ProposalList from './components/ProposalList';
import ProposalDetail from './components/ProposalDetail';
import LandingPage from './components/LandingPage';



function App() {
  return (
    <Router>

        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/proposals" element={<ProposalList />} />
          <Route path="/proposal/:index" element={<ProposalDetail />} />
        </Routes>
    </Router>
  );
}

export default App;
