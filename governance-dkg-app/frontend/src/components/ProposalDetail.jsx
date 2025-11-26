import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import {
  ArrowLeft,
  Database,
  CheckCircle,
  XCircle,
  Clock,
  Copy,
  ExternalLink,
  Shield,
  Sparkles,
  FileText,
  DollarSign,
  User,
  Calendar,
  TrendingUp
} from 'lucide-react';
import WalletConnect from './WalletConnect';
import PremiumReports from './PremiumReports';
import SubmitPremiumReport from './SubmitPremiumReport';

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

          <div className="flex items-center gap-4">
            <Link
              to="/proposals"
              className="px-6 py-2.5 text-sm font-bold text-gray-700 hover:text-purple-600 transition-colors"
            >
              All Proposals
            </Link>
          </div>
        </div>
      </div>
    </nav>
  );
}

function ProposalDetail() {
  const { index } = useParams();
  const navigate = useNavigate();

  const [proposal, setProposal] = useState(null);
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [publishProgress, setPublishProgress] = useState([]);
  const [showProgress, setShowProgress] = useState(false);
  const [chatAPIAvailable, setChatAPIAvailable] = useState(false);

  // Wallet authentication state
  const [userWallet, setUserWallet] = useState(null);
  const [authSignature, setAuthSignature] = useState(null);
  const [authMessage, setAuthMessage] = useState(null);
  const [premiumReportsRefreshKey, setPremiumReportsRefreshKey] = useState(0);

  useEffect(() => {
    fetchProposal();
    fetchReports();
    checkChatAPIHealth();
  }, [index]);

  const fetchProposal = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`/api/proposals/${index}`);

      if (response.data.success) {
        setProposal(response.data.data);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchReports = async () => {
    try {
      const response = await axios.get(`/api/reports/proposal/${index}`);
      if (response.data.success) {
        setReports(response.data.data);
      }
    } catch (err) {
      console.error('Error fetching reports:', err);
    }
  };

  const checkChatAPIHealth = async () => {
    try {
      const response = await axios.get('/api/proposals/dkg-chat/health');
      if (response.data.success && response.data.chatAPI.available) {
        setChatAPIAvailable(true);
      }
    } catch (err) {
      console.error('Chat API not available:', err);
      setChatAPIAvailable(false);
    }
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    setSuccess('Copied to clipboard!');
    setTimeout(() => setSuccess(null), 2000);
  };

  const handleWalletConnected = (wallet, signature, message) => {
    setUserWallet(wallet);
    setAuthSignature(signature);
    setAuthMessage(message);
  };

  const handleWalletDisconnected = () => {
    setUserWallet(null);
    setAuthSignature(null);
    setAuthMessage(null);
  };

  const handlePremiumReportSubmitted = (data) => {
    setPremiumReportsRefreshKey(prev => prev + 1);
  };

  const publishDirectAPI = async () => {
    if (!window.confirm('Publish this proposal to DKG using Direct API?')) return;

    try {
      setSubmitting(true);
      setError(null);
      setSuccess(null);
      setPublishProgress([]);
      setShowProgress(true);

      setPublishProgress([{ step: 0, message: 'Initializing DKG publication...', data: {} }]);

      const response = await axios.post(`/api/proposals/${index}/publish-direct`);

      if (response.data.success) {
        if (response.data.progress && response.data.progress.length > 0) {
          setPublishProgress(response.data.progress);
        }

        if (response.data.dkg.ual) {
          setSuccess(`✅ Proposal published to DKG! UAL: ${response.data.dkg.ual}`);
        } else {
          setSuccess('✅ Proposal queued for DKG publication. UAL will be available shortly.');
        }

        setTimeout(() => {
          fetchProposal();
          setShowProgress(false);
        }, 3000);
      }
    } catch (err) {
      setError(err.response?.data?.error || err.message);
      if (err.response?.data?.progress) {
        setPublishProgress(err.response.data.progress);
      }
    } finally {
      setSubmitting(false);
    }
  };

  const getStatusBadge = (status) => {
    if (status === 'Executed' || status === 'verified') {
      return (
        <span className="inline-flex items-center gap-1.5 px-4 py-2 bg-green-100 text-green-700 rounded-full text-sm font-semibold">
          <CheckCircle className="w-4 h-4" />
          {status === 'verified' ? 'Verified' : 'Executed'}
        </span>
      );
    } else if (status === 'Rejected') {
      return (
        <span className="inline-flex items-center gap-1.5 px-4 py-2 bg-red-100 text-red-700 rounded-full text-sm font-semibold">
          <XCircle className="w-4 h-4" />
          Rejected
        </span>
      );
    } else {
      return (
        <span className="inline-flex items-center gap-1.5 px-4 py-2 bg-yellow-100 text-yellow-700 rounded-full text-sm font-semibold">
          <Clock className="w-4 h-4" />
          {status}
        </span>
      );
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 via-purple-50/30 to-pink-50/30">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-purple-200 border-t-purple-600 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600 font-medium">Loading proposal...</p>
        </div>
      </div>
    );
  }

  if (error && !proposal) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 via-purple-50/30 to-pink-50/30">
        <div className="bg-red-50 border border-red-200 rounded-2xl p-6 max-w-md">
          <p className="text-red-700 font-medium">Error: {error}</p>
        </div>
      </div>
    );
  }

  if (!proposal) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 via-purple-50/30 to-pink-50/30">
        <div className="bg-yellow-50 border border-yellow-200 rounded-2xl p-6 max-w-md">
          <p className="text-yellow-700 font-medium">Proposal not found</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <Navigation />
      <WalletConnect
        onWalletConnected={handleWalletConnected}
        onWalletDisconnected={handleWalletDisconnected}
      />

      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-purple-50/30 to-pink-50/30 pt-24 pb-16">
        {/* Animated Background */}
        <div className="fixed inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-0 -left-40 w-96 h-96 bg-purple-400/10 rounded-full blur-3xl animate-pulse" />
          <div className="absolute bottom-0 -right-40 w-96 h-96 bg-pink-400/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
        </div>

        <div className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Back Button */}
          <button
            onClick={() => navigate('/proposals')}
            className="group flex items-center gap-2 mb-8 px-4 py-2 text-gray-700 hover:text-purple-600 transition-colors"
          >
            <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
            <span className="font-semibold">Back to All Proposals</span>
          </button>

          {/* Alert Messages */}
          {error && (
            <div className="mb-6 bg-red-50 border border-red-200 rounded-2xl p-4 flex items-start gap-3">
              <XCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
              <p className="text-red-700 font-medium">{error}</p>
            </div>
          )}

          {success && (
            <div className="mb-6 bg-green-50 border border-green-200 rounded-2xl p-4 flex items-start gap-3">
              <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
              <p className="text-green-700 font-medium">{success}</p>
            </div>
          )}

          {/* Main Proposal Card */}
          <div className="bg-white/95 backdrop-blur-xl rounded-3xl p-8 lg:p-10 border border-gray-100 shadow-2xl mb-8">
            {/* Header */}
            <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-6 mb-8">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-12 h-12 bg-gradient-to-br from-pink-500 to-purple-600 rounded-xl flex items-center justify-center">
                    <span className="text-lg font-bold text-black">#{proposal.referendum_index}</span>
                  </div>
                  <span className="text-sm font-medium text-gray-500">Referendum Index</span>
                </div>
                <h1 className="text-3xl lg:text-4xl font-black text-gray-900 mb-4 leading-tight">
                  {proposal.title}
                </h1>
              </div>
              <div className="flex flex-wrap gap-3">
                {getStatusBadge(proposal.status)}
                {proposal.origin && (
                  <span className="inline-flex items-center px-4 py-2 bg-purple-100 text-purple-700 rounded-full text-sm font-semibold">
                    {proposal.origin}
                  </span>
                )}
              </div>
            </div>

            {/* Summary */}
            {proposal.summary && (
              <div className="mb-8 p-6 bg-gradient-to-r from-purple-50/50 to-pink-50/50 rounded-2xl border border-purple-100">
                <h3 className="text-lg font-bold text-gray-900 mb-3 flex items-center gap-2">
                  <FileText className="w-5 h-5 text-purple-600" />
                  Summary
                </h3>
                <p className="text-gray-700 leading-relaxed">{proposal.summary}</p>
              </div>
            )}

            {/* Details Grid */}
            <div className="grid md:grid-cols-2 gap-6 mb-8">
              <div className="p-6 bg-gray-50 rounded-2xl">
                <div className="flex items-center gap-2 mb-3">
                  <User className="w-5 h-5 text-gray-600" />
                  <h3 className="font-bold text-gray-900">Proposer</h3>
                </div>
                <p className="text-sm text-gray-600 font-mono break-all">
                  {proposal.proposer_address || 'N/A'}
                </p>
              </div>

              <div className="p-6 bg-gray-50 rounded-2xl">
                <div className="flex items-center gap-2 mb-3">
                  <DollarSign className="w-5 h-5 text-gray-600" />
                  <h3 className="font-bold text-gray-900">Treasury Proposal ID</h3>
                </div>
                <p className="text-sm text-gray-600">
                  {proposal.treasury_proposal_id !== -1 ? proposal.treasury_proposal_id : 'N/A'}
                </p>
              </div>
            </div>

            {/* DKG Status */}
            {proposal.ual ? (
              <div className="p-6 bg-gradient-to-r from-pink-50 to-purple-50 rounded-2xl border-2 border-purple-200">
                <div className="flex items-center gap-2 mb-4">
                  <Database className="w-6 h-6 text-purple-600" />
                  <h3 className="text-lg font-bold text-gray-900">DKG Knowledge Asset</h3>
                </div>
                <div className="bg-white/80 backdrop-blur rounded-xl p-4 mb-4">
                  <div className="flex items-center justify-between gap-4">
                    <code className="text-sm text-gray-700 break-all flex-1">{proposal.ual}</code>
                    <button
                      onClick={() => copyToClipboard(proposal.ual)}
                      className="flex-shrink-0 p-2 hover:bg-gray-100 rounded-lg transition-colors"
                    >
                      <Copy className="w-4 h-4 text-gray-600" />
                    </button>
                  </div>
                </div>
                {proposal.block_explorer_url && (
                  <a
                    href={proposal.block_explorer_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 px-4 py-2 bg-white hover:bg-gray-50 rounded-xl text-purple-600 font-semibold transition-colors"
                  >
                    View on DKG Explorer
                    <ExternalLink className="w-4 h-4" />
                  </a>
                )}
              </div>
            ) : (
              <div className="p-6 bg-yellow-50 rounded-2xl border-2 border-yellow-200">
                <div className="flex items-center gap-2 mb-4">
                  <Sparkles className="w-6 h-6 text-yellow-600" />
                  <h3 className="text-lg font-bold text-gray-900">Not yet published to DKG</h3>
                </div>
                <p className="text-gray-700 mb-6">
                  This proposal hasn't been published as a Knowledge Asset yet. Publish it to make it permanently verifiable on the DKG.
                </p>

                <div className="flex flex-wrap gap-3">
                  <button
                    onClick={publishDirectAPI}
                    disabled={submitting}
                    className="px-6 py-3 text-sm font-bold text-black bg-gradient-to-r from-pink-600 to-purple-600 rounded-full hover:from-pink-700 hover:to-purple-700 transition-all duration-300 shadow-xl hover:shadow-pink-500/40 transform hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                  >
                    {submitting ? 'Publishing...' : 'Publish to DKG (Recommended)'}
                  </button>
                </div>

                <p className="mt-4 text-sm text-gray-600">
                  💡 <strong>Recommended:</strong> Use DKG Node API for direct publishing with real-time progress tracking
                </p>
              </div>
            )}

            {/* Progress Display */}
            {showProgress && publishProgress.length > 0 && (
              <div className="mt-6 p-6 bg-blue-50 rounded-2xl border border-blue-200">
                <h4 className="font-bold text-blue-900 mb-4 flex items-center gap-2">
                  <TrendingUp className="w-5 h-5" />
                  Publication Progress
                </h4>
                <div className="space-y-3">
                  {publishProgress.map((step, idx) => (
                    <div
                      key={idx}
                      className={`p-4 rounded-xl border-l-4 ${step.step === -1
                        ? 'bg-red-50 border-red-500'
                        : 'bg-white border-blue-500'
                        }`}
                    >
                      <div className={`font-semibold ${step.step === -1 ? 'text-red-700' : 'text-blue-700'}`}>
                        {step.step === -1 ? '❌' : `Step ${step.step}`}: {step.message}
                      </div>
                      {step.data && Object.keys(step.data).length > 0 && (
                        <div className="mt-2 text-sm text-gray-600 space-y-1">
                          {Object.entries(step.data).map(([key, value]) => (
                            <div key={key}>
                              <strong>{key}:</strong> {typeof value === 'object' ? JSON.stringify(value) : String(value)}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Submit Premium Report */}
          {proposal.ual && (
            <div className="bg-white/95 backdrop-blur-xl rounded-3xl p-8 lg:p-10 border border-gray-100 shadow-2xl mb-8">
              <SubmitPremiumReport
                proposalIndex={proposal.referendum_index}
                proposalUAL={proposal?.dkg_asset_id}
                userWallet={userWallet}
                authSignature={authSignature}
                authMessage={authMessage}
                onReportSubmitted={handlePremiumReportSubmitted}
              />
            </div>
          )}

          {/* Premium Reports */}
          {proposal.ual && (
            <div className="bg-white/95 backdrop-blur-xl rounded-3xl p-8 lg:p-10 border border-gray-100 shadow-2xl mb-8">
              <PremiumReports
                proposalIndex={proposal.referendum_index}
                userWallet={userWallet}
                authSignature={authSignature}
                authMessage={authMessage}
                refreshKey={premiumReportsRefreshKey}
              />
            </div>
          )}

          {/* Community Reports */}
          {reports.length > 0 && (
            <div className="bg-white/95 backdrop-blur-xl rounded-3xl p-8 lg:p-10 border border-gray-100 shadow-2xl">
              <h2 className="text-2xl font-black text-gray-900 mb-6 flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-br from-pink-500 to-purple-600 rounded-xl flex items-center justify-center">
                  <FileText className="w-5 h-5 text-black" />
                </div>
                Community Reports ({reports.length})
              </h2>

              <div className="space-y-4">
                {reports.map((report) => (
                  <div
                    key={report.report_id}
                    className="p-6 bg-gradient-to-r from-gray-50 to-purple-50/30 rounded-2xl border-l-4 border-purple-500 hover:shadow-lg transition-shadow"
                  >
                    <div className="flex items-start justify-between gap-4 mb-3">
                      <h3 className="text-lg font-bold text-gray-900">{report.report_name}</h3>
                      {getStatusBadge(report.verification_status)}
                    </div>

                    <div className="text-sm text-gray-600 mb-4">
                      <span className="font-medium">Submitted by:</span>{' '}
                      <code className="bg-white px-2 py-1 rounded">
                        {report.submitter_wallet.substring(0, 10)}...
                        {report.submitter_wallet.substring(report.submitter_wallet.length - 8)}
                      </code>
                      {' | '}
                      {new Date(report.submitted_at).toLocaleDateString()}
                    </div>

                    {report.report_ual && (
                      <div className="bg-white/80 backdrop-blur rounded-xl p-4 mb-3">
                        <div className="flex items-center justify-between gap-4">
                          <div className="flex-1">
                            <p className="text-xs font-semibold text-gray-500 mb-1">UAL:</p>
                            <code className="text-sm text-gray-700 break-all">{report.report_ual}</code>
                          </div>
                          <button
                            onClick={() => copyToClipboard(report.report_ual)}
                            className="flex-shrink-0 p-2 hover:bg-gray-100 rounded-lg transition-colors"
                          >
                            <Copy className="w-4 h-4 text-gray-600" />
                          </button>
                        </div>
                      </div>
                    )}

                    {report.dkg_block_explorer_url && (
                      <a
                        href={report.dkg_block_explorer_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 text-purple-600 hover:text-purple-700 font-semibold text-sm transition-colors"
                      >
                        View on DKG Explorer
                        <ExternalLink className="w-4 h-4" />
                      </a>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}

export default ProposalDetail;
