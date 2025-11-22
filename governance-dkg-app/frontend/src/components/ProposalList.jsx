import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

function ProposalList() {
  const [proposals, setProposals] = useState([]);
  const [filteredProposals, setFilteredProposals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Filter states
  const [searchIndex, setSearchIndex] = useState('');
  const [searchTitle, setSearchTitle] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [filterUAL, setFilterUAL] = useState('');

  const [stats, setStats] = useState({
    total: 0,
    withUAL: 0,
    executed: 0,
    rejected: 0
  });

  const navigate = useNavigate();

  useEffect(() => {
    fetchProposals();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [proposals, searchIndex, searchTitle, filterStatus, filterUAL]);

  const fetchProposals = async () => {
    try {
      setLoading(true);
      const response = await axios.get('/api/proposals');

      if (response.data.success) {
        const proposalsData = response.data.data;
        setProposals(proposalsData);
        setFilteredProposals(proposalsData);

        // Calculate stats
        setStats({
          total: proposalsData.length,
          withUAL: proposalsData.filter(p => p.has_ual).length,
          executed: proposalsData.filter(p => p.status === 'Executed').length,
          rejected: proposalsData.filter(p => p.status === 'Rejected').length
        });
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = [...proposals];

    // Filter by referendum index
    if (searchIndex) {
      filtered = filtered.filter(p =>
        p.referendum_index.toString().includes(searchIndex)
      );
    }

    // Filter by title
    if (searchTitle) {
      filtered = filtered.filter(p =>
        p.title.toLowerCase().includes(searchTitle.toLowerCase())
      );
    }

    // Filter by status
    if (filterStatus) {
      filtered = filtered.filter(p => p.status === filterStatus);
    }

    // Filter by UAL presence
    if (filterUAL === 'with') {
      filtered = filtered.filter(p => p.has_ual);
    } else if (filterUAL === 'without') {
      filtered = filtered.filter(p => !p.has_ual);
    }

    setFilteredProposals(filtered);
  };

  const clearFilters = () => {
    setSearchIndex('');
    setSearchTitle('');
    setFilterStatus('');
    setFilterUAL('');
  };

  const getStatusBadge = (status) => {
    const className = status === 'Executed' ? 'badge-executed' :
                     status === 'Rejected' ? 'badge-rejected' :
                     'badge-pending';
    return <span className={`badge ${className}`}>{status}</span>;
  };

  const truncateText = (text, maxLength) => {
    if (!text) return 'N/A';
    return text.length > maxLength ? text.substring(0, maxLength) + '...' : text;
  };

  if (loading) {
    return <div className="loading">Loading proposals...</div>;
  }

  if (error) {
    return <div className="error">Error loading proposals: {error}</div>;
  }

  // Get unique statuses for filter dropdown
  const uniqueStatuses = [...new Set(proposals.map(p => p.status))].sort();

  return (
    <div>
      <div className="stats">
        <div className="stat-card">
          <div className="stat-label">Total Proposals</div>
          <div className="stat-value">{stats.total}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Published to DKG</div>
          <div className="stat-value">{stats.withUAL}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Executed</div>
          <div className="stat-value">{stats.executed}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Rejected</div>
          <div className="stat-value">{stats.rejected}</div>
        </div>
      </div>

      <div className="card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <h2>All Proposals ({filteredProposals.length} of {proposals.length})</h2>
          {(searchIndex || searchTitle || filterStatus || filterUAL) && (
            <button className="btn btn-secondary" onClick={clearFilters}>
              Clear Filters
            </button>
          )}
        </div>

        {/* Filters */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '15px', marginBottom: '20px' }}>
          <div>
            <label style={{ display: 'block', marginBottom: '5px', fontSize: '0.9em', fontWeight: '500' }}>
              Referendum Index
            </label>
            <input
              type="text"
              className="input"
              placeholder="Search by index..."
              value={searchIndex}
              onChange={(e) => setSearchIndex(e.target.value)}
              style={{ marginBottom: 0 }}
            />
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: '5px', fontSize: '0.9em', fontWeight: '500' }}>
              Title
            </label>
            <input
              type="text"
              className="input"
              placeholder="Search by title..."
              value={searchTitle}
              onChange={(e) => setSearchTitle(e.target.value)}
              style={{ marginBottom: 0 }}
            />
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: '5px', fontSize: '0.9em', fontWeight: '500' }}>
              Status
            </label>
            <select
              className="input"
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              style={{ marginBottom: 0 }}
            >
              <option value="">All Statuses</option>
              {uniqueStatuses.map(status => (
                <option key={status} value={status}>{status}</option>
              ))}
            </select>
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: '5px', fontSize: '0.9em', fontWeight: '500' }}>
              DKG Status
            </label>
            <select
              className="input"
              value={filterUAL}
              onChange={(e) => setFilterUAL(e.target.value)}
              style={{ marginBottom: 0 }}
            >
              <option value="">All</option>
              <option value="with">With UAL</option>
              <option value="without">Without UAL</option>
            </select>
          </div>
        </div>

        {/* Table View */}
        <div style={{ overflowX: 'auto' }}>
          <table className="proposal-table">
            <thead>
              <tr>
                <th style={{ width: '100px' }}>Ref #</th>
                <th style={{ minWidth: '300px' }}>Title</th>
                <th style={{ width: '120px' }}>Status</th>
                <th style={{ minWidth: '250px' }}>UAL</th>
                <th style={{ width: '100px' }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {filteredProposals.length === 0 ? (
                <tr>
                  <td colSpan="5" style={{ textAlign: 'center', padding: '40px', color: '#666' }}>
                    No proposals found matching your filters
                  </td>
                </tr>
              ) : (
                filteredProposals.map((proposal) => (
                  <tr key={proposal.referendum_index} onClick={() => navigate(`/proposal/${proposal.referendum_index}`)}>
                    <td>
                      <strong>#{proposal.referendum_index}</strong>
                    </td>
                    <td>
                      <div className="proposal-title-cell">
                        {proposal.title}
                      </div>
                    </td>
                    <td>
                      {getStatusBadge(proposal.status)}
                    </td>
                    <td>
                      {proposal.has_ual ? (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                          <span className="badge badge-with-ual" style={{ fontSize: '0.75em' }}>
                            Published
                          </span>
                          <code style={{ fontSize: '0.75em', color: '#666' }}>
                            {truncateText(proposal.ual, 30)}
                          </code>
                        </div>
                      ) : (
                        <span style={{ color: '#999', fontSize: '0.85em' }}>Not published</span>
                      )}
                    </td>
                    <td>
                      <button
                        className="btn-link"
                        onClick={(e) => {
                          e.stopPropagation();
                          navigate(`/proposal/${proposal.referendum_index}`);
                        }}
                      >
                        View →
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {filteredProposals.length > 0 && (
          <div style={{ marginTop: '20px', textAlign: 'center', color: '#666', fontSize: '0.9em' }}>
            Showing {filteredProposals.length} of {proposals.length} proposals
          </div>
        )}
      </div>
    </div>
  );
}

export default ProposalList;
