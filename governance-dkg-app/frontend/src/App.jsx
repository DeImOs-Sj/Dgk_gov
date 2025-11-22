import React from 'react';
import { BrowserRouter as Router, Routes, Route, Link, useLocation } from 'react-router-dom';
import ProposalList from './components/ProposalList';
import ProposalDetail from './components/ProposalDetail';

function Navigation() {
  const location = useLocation();

  return (
    <div className="header">
      <div className="container">
        <h1>Polkadot Governance DKG</h1>
        <p>Decentralized Knowledge Graph for Polkadot OpenGov Proposals</p>
        <nav className="nav">
          <Link
            to="/"
            className={`nav-link ${location.pathname === '/' ? 'active' : ''}`}
          >
            All Proposals
          </Link>
        </nav>
      </div>
    </div>
  );
}

function App() {
  return (
    <Router>
      <Navigation />
      <div className="container">
        <Routes>
          <Route path="/" element={<ProposalList />} />
          <Route path="/proposal/:index" element={<ProposalDetail />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
