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

  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 50;

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
    setCurrentPage(1); // Reset to first page when filters change
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

  // Pagination calculations
  const totalPages = Math.ceil(filteredProposals.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentProposals = filteredProposals.slice(startIndex, endIndex);

  // Pagination navigation functions
  const goToPage = (page) => {
    setCurrentPage(Math.max(1, Math.min(page, totalPages)));
  };

  const goToFirstPage = () => setCurrentPage(1);
  const goToLastPage = () => setCurrentPage(totalPages);
  const goToPreviousPage = () => setCurrentPage(prev => Math.max(1, prev - 1));
  const goToNextPage = () => setCurrentPage(prev => Math.min(totalPages, prev + 1));

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
                currentProposals.map((proposal) => (
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

        {/* Pagination Controls */}
        {filteredProposals.length > 0 && (
          <div style={{ marginTop: '20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '15px' }}>
              {/* Pagination Info */}
              <div style={{ color: '#666', fontSize: '0.9em' }}>
                Showing {startIndex + 1}-{Math.min(endIndex, filteredProposals.length)} of {filteredProposals.length} proposals
                {filteredProposals.length !== proposals.length && ` (filtered from ${proposals.length} total)`}
              </div>

              {/* Pagination Buttons */}
              {totalPages > 1 && (
                <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                  <button
                    className="btn btn-secondary"
                    onClick={goToFirstPage}
                    disabled={currentPage === 1}
                    style={{ padding: '6px 12px', fontSize: '0.9em' }}
                  >
                    ««
                  </button>
                  <button
                    className="btn btn-secondary"
                    onClick={goToPreviousPage}
                    disabled={currentPage === 1}
                    style={{ padding: '6px 12px', fontSize: '0.9em' }}
                  >
                    ‹
                  </button>

                  {/* Page Numbers */}
                  <div style={{ display: 'flex', gap: '5px', alignItems: 'center' }}>
                    {(() => {
                      const pageNumbers = [];
                      const maxVisiblePages = 5;
                      let startPage = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2));
                      let endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);

                      if (endPage - startPage < maxVisiblePages - 1) {
                        startPage = Math.max(1, endPage - maxVisiblePages + 1);
                      }

                      if (startPage > 1) {
                        pageNumbers.push(
                          <button
                            key={1}
                            className="btn btn-secondary"
                            onClick={() => goToPage(1)}
                            style={{ padding: '6px 12px', fontSize: '0.9em' }}
                          >
                            1
                          </button>
                        );
                        if (startPage > 2) {
                          pageNumbers.push(<span key="ellipsis-start" style={{ padding: '0 5px' }}>...</span>);
                        }
                      }

                      for (let i = startPage; i <= endPage; i++) {
                        pageNumbers.push(
                          <button
                            key={i}
                            className={`btn ${i === currentPage ? 'btn-primary' : 'btn-secondary'}`}
                            onClick={() => goToPage(i)}
                            style={{ padding: '6px 12px', fontSize: '0.9em', fontWeight: i === currentPage ? 'bold' : 'normal' }}
                          >
                            {i}
                          </button>
                        );
                      }

                      if (endPage < totalPages) {
                        if (endPage < totalPages - 1) {
                          pageNumbers.push(<span key="ellipsis-end" style={{ padding: '0 5px' }}>...</span>);
                        }
                        pageNumbers.push(
                          <button
                            key={totalPages}
                            className="btn btn-secondary"
                            onClick={() => goToPage(totalPages)}
                            style={{ padding: '6px 12px', fontSize: '0.9em' }}
                          >
                            {totalPages}
                          </button>
                        );
                      }

                      return pageNumbers;
                    })()}
                  </div>

                  <button
                    className="btn btn-secondary"
                    onClick={goToNextPage}
                    disabled={currentPage === totalPages}
                    style={{ padding: '6px 12px', fontSize: '0.9em' }}
                  >
                    ›
                  </button>
                  <button
                    className="btn btn-secondary"
                    onClick={goToLastPage}
                    disabled={currentPage === totalPages}
                    style={{ padding: '6px 12px', fontSize: '0.9em' }}
                  >
                    »»
                  </button>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default ProposalList;
