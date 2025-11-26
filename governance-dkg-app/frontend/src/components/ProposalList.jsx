import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import {
  Search,
  Filter,
  Database,
  CheckCircle,
  XCircle,
  Clock,
  FileText,
  Globe,
  Sparkles,
  ChevronRight,
  ChevronLeft,
  ChevronsLeft,
  ChevronsRight,
  ArrowRight,
  TrendingUp,
  Shield
} from 'lucide-react';

// Navigation Component
function Navigation() {
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <nav
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${isScrolled
        ? 'bg-white/90 backdrop-blur-md shadow-xl border-b border-purple-100'
        : 'bg-transparent pt-2'
        }`}
    >
      <div className="max-w-8xl mx-auto px-6 lg:px-12">
        <div className="flex items-center justify-between h-20">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-3 group">
            <div className="w-10 h-10 bg-gradient-to-br from-pink-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg group-hover:scale-105 transition-transform">
              <span className="text-xl font-black text-black">D</span>
            </div>
            <div className="hidden sm:block">
              <span className="text-xl font-extrabold text-gray-900">
                DKG Governance
              </span>
              <p className="text-xs text-gray-500 -mt-0.5">Polkadot OpenGov</p>
            </div>
          </Link>

          {/* CTA Button */}
          <div className="flex items-center gap-4">
            <Link
              to="/"
              className="px-6 py-2.5 text-sm font-bold text-gray-700 hover:text-purple-600 transition-colors"
            >
              Home
            </Link>
          </div>
        </div>
      </div>
    </nav>
  );
}

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
  const itemsPerPage = 12;

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
    setCurrentPage(1);
  }, [proposals, searchIndex, searchTitle, filterStatus, filterUAL]);

  const fetchProposals = async () => {
    try {
      setLoading(true);
      const response = await axios.get('/api/proposals');

      if (response.data.success) {
        const proposalsData = response.data.data;
        setProposals(proposalsData);
        setFilteredProposals(proposalsData);

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

    if (searchIndex) {
      filtered = filtered.filter(p =>
        p.referendum_index.toString().includes(searchIndex)
      );
    }

    if (searchTitle) {
      filtered = filtered.filter(p =>
        p.title.toLowerCase().includes(searchTitle.toLowerCase())
      );
    }

    if (filterStatus) {
      filtered = filtered.filter(p => p.status === filterStatus);
    }

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
    if (status === 'Executed') {
      return (
        <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-green-100 text-green-700 rounded-full text-xs font-semibold">
          <CheckCircle className="w-3 h-3" />
          Executed
        </span>
      );
    } else if (status === 'Rejected') {
      return (
        <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-red-100 text-red-700 rounded-full text-xs font-semibold">
          <XCircle className="w-3 h-3" />
          Rejected
        </span>
      );
    } else {
      return (
        <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-yellow-100 text-yellow-700 rounded-full text-xs font-semibold">
          <Clock className="w-3 h-3" />
          {status}
        </span>
      );
    }
  };

  const truncateText = (text, maxLength) => {
    if (!text) return 'N/A';
    return text.length > maxLength ? text.substring(0, maxLength) + '...' : text;
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 via-purple-50/30 to-pink-50/30">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-purple-200 border-t-purple-600 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600 font-medium">Loading proposals...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 via-purple-50/30 to-pink-50/30">
        <div className="bg-red-50 border border-red-200 rounded-2xl p-6 max-w-md">
          <p className="text-red-700 font-medium">Error loading proposals: {error}</p>
        </div>
      </div>
    );
  }

  const uniqueStatuses = [...new Set(proposals.map(p => p.status))].sort();

  // Pagination calculations
  const totalPages = Math.ceil(filteredProposals.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentProposals = filteredProposals.slice(startIndex, endIndex);

  const goToPage = (page) => {
    setCurrentPage(Math.max(1, Math.min(page, totalPages)));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <>
      <Navigation />

      {/* Hero Section with Stats */}
      <section className="relative min-h-[60vh] flex items-center justify-center overflow-hidden bg-gradient-to-br from-gray-50 via-purple-50/30 to-pink-50/30 pt-20">
        {/* Animated Background */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-0 -left-40 w-96 h-96 bg-purple-400/20 rounded-full blur-3xl animate-pulse" />
          <div className="absolute bottom-0 -right-40 w-96 h-96 bg-pink-400/20 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-gradient-to-r from-purple-300/10 to-pink-300/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '2s' }} />
        </div>

        <div className="relative z-10 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
          <div className="text-center mb-16">
            {/* Badge */}
            <div className="inline-flex items-center gap-2 bg-white/90 backdrop-blur-md rounded-full px-5 py-2.5 text-sm font-medium text-purple-700 mb-8 shadow-lg border border-purple-200/50">
              <Database className="w-4 h-4" />
              <span>Polkadot OpenGov Proposals</span>
              <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
            </div>

            {/* Main Heading */}
            <h1 className="text-5xl sm:text-6xl lg:text-7xl font-black tracking-tight text-gray-900 mb-6 leading-[1.1]">
              Explore{' '}
              <span className="bg-gradient-to-r from-pink-600 via-purple-600 to-pink-600 bg-clip-text text-black">
                Governance
              </span>
            </h1>

            <p className="max-w-2xl mx-auto text-xl text-gray-600 mb-8 leading-relaxed font-light">
              Browse all Polkadot OpenGov proposals published as verifiable knowledge assets
            </p>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 max-w-5xl mx-auto">
            {[
              { number: stats.total, label: "Total Proposals", icon: FileText, gradient: "from-pink-500 to-purple-600" },
              { number: stats.withUAL, label: "Published to DKG", icon: Database, gradient: "from-purple-500 to-pink-600" },
              { number: stats.executed, label: "Executed", icon: CheckCircle, gradient: "from-green-500 to-emerald-600" },
              { number: stats.rejected, label: "Rejected", icon: XCircle, gradient: "from-red-500 to-rose-600" },
            ].map((stat, idx) => (
              <div
                key={stat.label}
                className="group bg-white/95 backdrop-blur-xl rounded-2xl p-6 text-center border border-gray-100 shadow-lg hover:shadow-2xl transition-all duration-500 hover:-translate-y-2"
              >
                <div className="flex justify-center mb-3">
                  <div className={`w-12 h-12 bg-gradient-to-br ${stat.gradient} rounded-xl flex items-center justify-center`}>
                    <stat.icon className="w-6 h-6 text-black" />
                  </div>
                </div>
                <div className={`text-3xl sm:text-4xl font-black bg-gradient-to-r ${stat.gradient} bg-clip-text text-black`}>
                  {stat.number}
                </div>
                <p className="mt-2 text-sm font-medium text-gray-600 uppercase tracking-wide">
                  {stat.label}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Filters Section */}
      <section className="py-12 bg-white border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-pink-500 to-purple-600 rounded-xl flex items-center justify-center">
                <Filter className="w-5 h-5 text-black" />
              </div>
              <div>
                <h2 className="text-2xl font-black text-gray-900">Filter Proposals</h2>
                <p className="text-sm text-gray-500">
                  Showing {filteredProposals.length} of {proposals.length} proposals
                </p>
              </div>
            </div>
            {(searchIndex || searchTitle || filterStatus || filterUAL) && (
              <button
                onClick={clearFilters}
                className="px-4 py-2 text-sm font-semibold text-gray-700 bg-gray-100 rounded-full hover:bg-gray-200 transition-colors"
              >
                Clear Filters
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Referendum Index
              </label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                  placeholder="Search by index..."
                  value={searchIndex}
                  onChange={(e) => setSearchIndex(e.target.value)}
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Title
              </label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                  placeholder="Search by title..."
                  value={searchTitle}
                  onChange={(e) => setSearchTitle(e.target.value)}
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Status
              </label>
              <select
                className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all appearance-none bg-white"
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
              >
                <option value="">All Statuses</option>
                {uniqueStatuses.map(status => (
                  <option key={status} value={status}>{status}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                DKG Status
              </label>
              <select
                className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all appearance-none bg-white"
                value={filterUAL}
                onChange={(e) => setFilterUAL(e.target.value)}
              >
                <option value="">All</option>
                <option value="with">With UAL</option>
                <option value="without">Without UAL</option>
              </select>
            </div>
          </div>
        </div>
      </section>

      {/* Proposals Grid */}
      <section className="py-16 bg-gradient-to-b from-white to-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {filteredProposals.length === 0 ? (
            <div className="text-center py-20">
              <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Search className="w-10 h-10 text-gray-400" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">No proposals found</h3>
              <p className="text-gray-600">Try adjusting your filters</p>
            </div>
          ) : (
            <>
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
                {currentProposals.map((proposal) => (
                  <div
                    key={proposal.referendum_index}
                    onClick={() => navigate(`/proposal/${proposal.referendum_index}`)}
                    className="group bg-white/95 backdrop-blur-xl rounded-2xl p-6 border border-gray-100 shadow-lg hover:shadow-2xl transition-all duration-500 hover:-translate-y-2 cursor-pointer"
                  >
                    {/* Header */}
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center gap-2">
                        <div className="w-10 h-10 bg-gradient-to-br from-pink-500 to-purple-600 rounded-xl flex items-center justify-center">
                          <span className="text-sm font-bold text-black">#{proposal.referendum_index}</span>
                        </div>
                      </div>
                      {getStatusBadge(proposal.status)}
                    </div>

                    {/* Title */}
                    <h3 className="text-lg font-bold text-gray-900 mb-3 line-clamp-2 group-hover:text-purple-600 transition-colors">
                      {proposal.title}
                    </h3>

                    {/* DKG Status */}
                    <div className="mb-4">
                      {proposal.has_ual ? (
                        <div className="flex items-center gap-2">
                          <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-gradient-to-r from-pink-500 to-purple-600 text-black rounded-full text-xs font-semibold">
                            <Database className="w-3 h-3" />
                            Published to DKG
                          </span>
                        </div>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-gray-100 text-gray-600 rounded-full text-xs font-semibold">
                          <Clock className="w-3 h-3" />
                          Not Published
                        </span>
                      )}
                    </div>

                    {/* Footer */}
                    <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                      <span className="text-sm text-gray-500">
                        {proposal.origin || 'N/A'}
                      </span>
                      <div className="flex items-center gap-1 text-purple-600 font-semibold text-sm group-hover:gap-2 transition-all">
                        View Details
                        <ArrowRight className="w-4 h-4" />
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-between">
                  <p className="text-sm text-gray-600">
                    Showing {startIndex + 1}-{Math.min(endIndex, filteredProposals.length)} of {filteredProposals.length}
                  </p>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => goToPage(1)}
                      disabled={currentPage === 1}
                      className="p-2 rounded-lg border border-gray-200 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      <ChevronsLeft className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => goToPage(currentPage - 1)}
                      disabled={currentPage === 1}
                      className="p-2 rounded-lg border border-gray-200 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </button>

                    <div className="flex items-center gap-1">
                      {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                        let pageNum;
                        if (totalPages <= 5) {
                          pageNum = i + 1;
                        } else if (currentPage <= 3) {
                          pageNum = i + 1;
                        } else if (currentPage >= totalPages - 2) {
                          pageNum = totalPages - 4 + i;
                        } else {
                          pageNum = currentPage - 2 + i;
                        }

                        return (
                          <button
                            key={pageNum}
                            onClick={() => goToPage(pageNum)}
                            className={`w-10 h-10 rounded-lg font-semibold transition-all ${currentPage === pageNum
                              ? 'bg-gradient-to-r from-pink-600 to-purple-600 text-black shadow-lg'
                              : 'border border-gray-200 hover:bg-gray-50 text-gray-700'
                              }`}
                          >
                            {pageNum}
                          </button>
                        );
                      })}
                    </div>

                    <button
                      onClick={() => goToPage(currentPage + 1)}
                      disabled={currentPage === totalPages}
                      className="p-2 rounded-lg border border-gray-200 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      <ChevronRight className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => goToPage(totalPages)}
                      disabled={currentPage === totalPages}
                      className="p-2 rounded-lg border border-gray-200 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      <ChevronsRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-950 text-gray-400 py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-12 mb-12">
            {/* Brand Column */}
            <div className="lg:col-span-2">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 bg-gradient-to-br from-pink-500 to-purple-600 rounded-xl flex items-center justify-center shadow-xl">
                  <span className="text-2xl font-black text-black">D</span>
                </div>
                <div>
                  <span className="text-xl font-bold text-black">DKG Governance</span>
                  <p className="text-xs text-gray-500">Powered by OriginTrail</p>
                </div>
              </div>
              <p className="text-gray-400 leading-relaxed max-w-md mb-6">
                Transforming Polkadot governance through decentralized, verifiable knowledge. Built for the community, powered by cutting-edge technology.
              </p>
            </div>

            {/* Navigation Column */}
            <div>
              <h3 className="text-black font-bold text-base mb-4 uppercase tracking-wider">Platform</h3>
              <ul className="space-y-3">
                <li><Link to="/" className="hover:text-pink-400 transition text-sm">Home</Link></li>
                <li><Link to="/proposals" className="hover:text-pink-400 transition text-sm">Proposals</Link></li>
              </ul>
            </div>

            {/* Resources Column */}
            <div>
              <h3 className="text-black font-bold text-base mb-4 uppercase tracking-wider">Resources</h3>
              <ul className="space-y-3">
                <li><a href="https://polkadot.network" target="_blank" rel="noopener noreferrer" className="hover:text-pink-400 transition text-sm">Polkadot Network</a></li>
                <li><a href="https://origintrail.io" target="_blank" rel="noopener noreferrer" className="hover:text-pink-400 transition text-sm">OriginTrail</a></li>
              </ul>
            </div>
          </div>

          {/* Bottom Bar */}
          <div className="pt-8 border-t border-gray-800">
            <div className="flex flex-col md:flex-row justify-between items-center gap-4">
              <p className="text-sm text-gray-500">
                © {new Date().getFullYear()} DKG Governance. Built with decentralization in mind.
              </p>
            </div>
          </div>
        </div>
      </footer>
    </>
  );
}

export default ProposalList;
