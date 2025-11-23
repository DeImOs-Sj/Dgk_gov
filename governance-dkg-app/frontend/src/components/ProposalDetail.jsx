import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import WalletConnect from './WalletConnect';
import PremiumReports from './PremiumReports';
import SubmitPremiumReport from './SubmitPremiumReport';

function ProposalDetail() {
  const { index } = useParams();
  const navigate = useNavigate();

  const [proposal, setProposal] = useState(null);
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  // Report submission state
  const [submitterWallet, setSubmitterWallet] = useState('');
  const [reportJSONLD, setReportJSONLD] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Publishing progress state
  const [publishProgress, setPublishProgress] = useState([]);
  const [showProgress, setShowProgress] = useState(false);
  const [chatAPIAvailable, setChatAPIAvailable] = useState(false);

  // Wallet authentication state
  const [userWallet, setUserWallet] = useState(null);
  const [authSignature, setAuthSignature] = useState(null);
  const [authMessage, setAuthMessage] = useState(null);

  // Premium reports refresh trigger
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

  console.log("User Wallet in Proposal Detail:",proposal?.dkg_asset_id);


  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    setSuccess('Copied to clipboard!');
    setTimeout(() => setSuccess(null), 2000);
  };

  // Handle wallet connection
  const handleWalletConnected = (wallet, signature, message) => {
    setUserWallet(wallet);
    setAuthSignature(signature);
    setAuthMessage(message);
    console.log('Wallet connected:', wallet);
  };

  // Handle wallet disconnection
  const handleWalletDisconnected = () => {
    setUserWallet(null);
    setAuthSignature(null);
    setAuthMessage(null);
    console.log('Wallet disconnected');
  };

  // Handle premium report submission
  const handlePremiumReportSubmitted = (data) => {
    console.log('Premium report submitted:', data);
    // Trigger refresh of premium reports list
    setPremiumReportsRefreshKey(prev => prev + 1);
  };

  const publishToDKG = async () => {
    if (!window.confirm('Publish this proposal to DKG?')) return;

    try {
      setSubmitting(true);
      setError(null);

      const response = await axios.post(`/api/proposals/${index}/publish`);

      if (response.data.success) {
        setSuccess('Proposal published to DKG successfully!');
        fetchProposal(); // Refresh
      }
    } catch (err) {
      setError(err.response?.data?.error || err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const publishViaChatAPI = async () => {
    if (!window.confirm('Publish this proposal to DKG via Chat API?')) return;

    try {
      setSubmitting(true);
      setError(null);
      setSuccess(null);
      setPublishProgress([]);
      setShowProgress(true);

      // Add initial progress
      setPublishProgress([{ step: 0, message: 'Starting publication process...', data: {} }]);

      const response = await axios.post(`/api/proposals/${index}/publish-via-chat`);

      if (response.data.success) {
        // Display all progress steps
        if (response.data.progress && response.data.progress.length > 0) {
          setPublishProgress(response.data.progress);
        }

        setSuccess('✅ Proposal published to DKG via Chat API successfully!');

        // Show response details
        if (response.data.dkg.fullResponse) {
          console.log('DKG Agent Response:', response.data.dkg.fullResponse);
        }

        setTimeout(() => {
          fetchProposal(); // Refresh
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

  const publishDirectAPI = async () => {
    if (!window.confirm('Publish this proposal to DKG using Direct API?')) return;

    try {
      setSubmitting(true);
      setError(null);
      setSuccess(null);
      setPublishProgress([]);
      setShowProgress(true);

      // Add initial progress
      setPublishProgress([{ step: 0, message: 'Initializing DKG publication...', data: {} }]);

      const response = await axios.post(`/api/proposals/${index}/publish-direct`);

      if (response.data.success) {
        // Display all progress steps
        if (response.data.progress && response.data.progress.length > 0) {
          setPublishProgress(response.data.progress);
        }

        if (response.data.dkg.ual) {
          setSuccess(`✅ Proposal published to DKG! UAL: ${response.data.dkg.ual}`);
        } else {
          setSuccess('✅ Proposal queued for DKG publication. UAL will be available shortly.');
        }

        setTimeout(() => {
          fetchProposal(); // Refresh
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

  const handleSubmitReport = async (e) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    // Validation
    if (!submitterWallet) {
      setError('Please enter your wallet address');
      return;
    }

    if (!reportJSONLD) {
      setError('Please enter JSON-LD report data');
      return;
    }

    // Validate JSON
    let parsed;
    try {
      parsed = JSON.parse(reportJSONLD);
      if (!parsed['@context'] || !parsed['@type']) {
        setError('Invalid JSON-LD: must include @context and @type');
        return;
      }
    } catch (parseErr) {
      setError('Invalid JSON: ' + parseErr.message);
      return;
    }

    // Check if parent proposal UAL is referenced in the report
    if (proposal && proposal.ual) {
      const jsonString = JSON.stringify(parsed).toLowerCase();
      const ualLower = proposal.ual.toLowerCase();

      if (!jsonString.includes(ualLower) && !jsonString.includes(`polkadot:referendum:${index}`)) {
        setError(`⚠️ Warning: Your report does not reference the parent proposal UAL or ID. Please include either "${proposal.ual}" or "polkadot:referendum:${index}" in your JSON-LD data to properly link it to this proposal.`);
        return;
      }
    }

    try {
      setSubmitting(true);

      const response = await axios.post('/api/reports/submit', {
        referendum_index: parseInt(index),
        submitter_wallet: submitterWallet,
        report_jsonld: reportJSONLD
      });

      if (response.data.success) {
        setSuccess('Report submitted successfully! Processing...');

        // Auto-trigger verification
        const reportId = response.data.report.report_id;
        setTimeout(async () => {
          try {
            const verifyResponse = await axios.post(`/api/reports/${reportId}/verify`);

            if (verifyResponse.data.success) {
              const verification = verifyResponse.data.verification;

              if (verification.status === 'verified') {
                setSuccess('✅ Report verified! Publishing to DKG...');

                // Auto-publish if verified
                const publishResponse = await axios.post(`/api/reports/${reportId}/publish`);

                if (publishResponse.data.success) {
                  setSuccess(`✅ Report published to DKG! UAL: ${publishResponse.data.dkg.ual}`);
                  setReportJSONLD('');
                  setSubmitterWallet('');
                  fetchReports(); // Refresh reports list
                }
              } else {
                setError(`❌ Report rejected: ${verification.reasoning}`);
              }
            }
          } catch (verifyErr) {
            setError('Verification failed: ' + verifyErr.message);
          }
        }, 1000);
      }
    } catch (err) {
      setError(err.response?.data?.error || err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const loadExampleReport = () => {
    const exampleReport = {
      "@context": {
        "schema": "https://schema.org/",
        "polkadot": "https://polkadot.network/governance/"
      },
      "@type": "schema:Report",
      "@id": `polkadot:referendum:${index}:report:${Date.now()}`,
      "schema:name": "Community Progress Report",
      "schema:description": "This report provides an update on the implementation progress of the proposal.",
      "schema:about": `polkadot:referendum:${index}`,
      "polkadot:milestones": [
        {
          "@type": "schema:Action",
          "schema:name": "Initial Development",
          "schema:status": "Completed"
        }
      ],
      "schema:dateCreated": new Date().toISOString()
    };

    setReportJSONLD(JSON.stringify(exampleReport, null, 2));
  };

  if (loading) {
    return <div className="loading">Loading proposal...</div>;
  }

  if (error && !proposal) {
    return <div className="error">Error: {error}</div>;
  }

  if (!proposal) {
    return <div className="error">Proposal not found</div>;
  }

  const getStatusBadge = (status) => {
    const className = status === 'Executed' ? 'badge-executed' :
                     status === 'Rejected' ? 'badge-rejected' :
                     status === 'verified' ? 'badge-verified' :
                     'badge-pending';
    return <span className={`badge ${className}`}>{status}</span>;
  };

  return (
    <div>
      <button className="btn btn-secondary" onClick={() => navigate('/')} style={{ marginBottom: '20px' }}>
        ← Back to All Proposals
      </button>

      {error && <div className="error">{error}</div>}
      {success && <div className="success">{success}</div>}

      {/* Wallet Connection */}
      <WalletConnect
        onWalletConnected={handleWalletConnected}
        onWalletDisconnected={handleWalletDisconnected}
      />

      <div className="card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
          <div>
            <div style={{ marginBottom: '10px' }}>
              <span style={{ fontSize: '0.9em', color: '#666' }}>Referendum #{proposal.referendum_index}</span>
            </div>
            <h2 style={{ marginTop: 0 }}>{proposal.title}</h2>
          </div>
          <div>
            {getStatusBadge(proposal.status)}
            {proposal.origin && <span className="badge">{proposal.origin}</span>}
          </div>
        </div>

        {proposal.summary && (
          <div style={{ marginTop: '20px', padding: '15px', background: '#f8f9fa', borderRadius: '5px' }}>
            <strong>Summary:</strong>
            <p style={{ marginTop: '10px', lineHeight: '1.6' }}>{proposal.summary}</p>
          </div>
        )}

        <div style={{ marginTop: '20px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
          <div>
            <strong>Proposer:</strong>
            <div style={{ fontSize: '0.85em', wordBreak: 'break-all', marginTop: '5px' }}>
              {proposal.proposer_address || 'N/A'}
            </div>
          </div>
          <div>
            <strong>Treasury Proposal ID:</strong>
            <div style={{ marginTop: '5px' }}>
              {proposal.treasury_proposal_id !== -1 ? proposal.treasury_proposal_id : 'N/A'}
            </div>
          </div>
        </div>

        {proposal.ual ? (
          <div style={{ marginTop: '20px' }}>
            <strong>DKG Knowledge Asset:</strong>
            <div className="ual-display">
              {proposal.ual}
              <button className="copy-btn" onClick={() => copyToClipboard(proposal.ual)}>
                Copy
              </button>
            </div>
            {proposal.block_explorer_url && (
              <a href={proposal.block_explorer_url} target="_blank" rel="noopener noreferrer" className="link">
                View on DKG Explorer →
              </a>
            )}
          </div>
        ) : (
          <div style={{ marginTop: '20px', padding: '15px', background: '#fff3cd', borderRadius: '5px' }}>
            <strong>Not yet published to DKG</strong>
            <p style={{ margin: '10px 0 0 0' }}>This proposal hasn't been published as a Knowledge Asset yet.</p>

            <div style={{ marginTop: '15px', display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
              <button
                className="btn btn-primary"
                onClick={publishDirectAPI}
                disabled={submitting}
                style={{ background: '#007bff' }}
              >
                {submitting ? 'Publishing...' : 'Publish via DKG Node API (Recommended)'}
              </button>

              <button
                className="btn btn-primary"
                onClick={publishToDKG}
                disabled={submitting}
                style={{ background: '#6c757d' }}
              >
                {submitting ? 'Publishing...' : 'Publish (Legacy)'}
              </button>

              {chatAPIAvailable && (
                <button
                  className="btn btn-primary"
                  onClick={publishViaChatAPI}
                  disabled={submitting}
                  style={{ background: '#28a745' }}
                >
                  {submitting ? 'Publishing...' : 'Publish via AI Agent'}
                </button>
              )}
            </div>

            <div style={{ marginTop: '10px', fontSize: '0.85em', color: '#666' }}>
              💡 <strong>Recommended:</strong> Use "DKG Node API" for direct publishing with real-time progress tracking
              {chatAPIAvailable && ' | AI Agent available for conversational publishing'}
            </div>
          </div>
        )}

        {/* Progress Display */}
        {showProgress && publishProgress.length > 0 && (
          <div style={{ marginTop: '20px', padding: '15px', background: '#e7f3ff', borderRadius: '5px' }}>
            <strong>📊 Publication Progress</strong>
            <div style={{ marginTop: '10px' }}>
              {publishProgress.map((step, idx) => (
                <div
                  key={idx}
                  style={{
                    padding: '8px 12px',
                    margin: '5px 0',
                    background: step.step === -1 ? '#ffebee' : '#fff',
                    borderLeft: `3px solid ${step.step === -1 ? '#f44336' : '#2196f3'}`,
                    borderRadius: '3px',
                    fontSize: '0.9em'
                  }}
                >
                  <div style={{ fontWeight: 'bold', color: step.step === -1 ? '#d32f2f' : '#1976d2' }}>
                    {step.step === -1 ? '❌' : `Step ${step.step}`}: {step.message}
                  </div>
                  {step.data && Object.keys(step.data).length > 0 && (
                    <div style={{ marginTop: '5px', fontSize: '0.85em', color: '#666' }}>
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

      {/* Report Submission Section */}
      {proposal.ual && (
        <div className="card">
          <h2>Submit Additional Report</h2>
          <p style={{ color: '#666', marginBottom: '20px' }}>
            Share progress updates, analysis, or additional context about this proposal.
          </p>

          <form onSubmit={handleSubmitReport}>
            <div className="form-group">
              <label>Your Wallet Address *</label>
              <input
                type="text"
                className="input"
                placeholder="0x..."
                value={submitterWallet}
                onChange={(e) => setSubmitterWallet(e.target.value)}
                disabled={submitting}
              />
            </div>

            <div className="form-group">
              <label>Report JSON-LD * <button type="button" className="copy-btn" onClick={loadExampleReport}>Load Example</button></label>
              <textarea
                className="textarea"
                placeholder='{"@context": {...}, "@type": "Report", ...}'
                value={reportJSONLD}
                onChange={(e) => setReportJSONLD(e.target.value)}
                disabled={submitting}
              />
              <div style={{ fontSize: '0.85em', color: '#666' }}>
                Size: {(new Blob([reportJSONLD]).size / 1024).toFixed(2)} KB
                {reportJSONLD && ` | Payment: ${(0.05 + (new Blob([reportJSONLD]).size / 1024) * 0.01).toFixed(4)} TRAC`}
              </div>
            </div>

            <div className="payment-info">
              <strong>💰 Payment Information (Simulated)</strong>
              <p style={{ margin: '5px 0 0 0', fontSize: '0.9em' }}>
                In production, you would send the required TRAC tokens to confirm your submission.
                For this demo, payment verification is automatic.
              </p>
            </div>

            <button type="submit" className="btn btn-primary" disabled={submitting}>
              {submitting ? 'Processing...' : 'Submit for Verification'}
            </button>
          </form>
        </div>
      )}

      {!proposal.ual && (
        <div className="card">
          <h2>Submit Additional Report</h2>
          <div style={{ padding: '20px', background: '#f8d7da', borderRadius: '5px', color: '#721c24' }}>
            <strong>⚠️ Reports Disabled</strong>
            <p style={{ margin: '10px 0 0 0' }}>
              This proposal must be published to DKG before reports can be submitted.
            </p>
          </div>
        </div>
      )}

      {/* Submit Premium Report Section */}
      {proposal.ual && (
        <div className="card">
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

      {/* Premium Reports Section */}
      {proposal.ual && (
        <div className="card">
          <PremiumReports
            proposalIndex={proposal.referendum_index}
            userWallet={userWallet}
            authSignature={authSignature}
            authMessage={authMessage}
            refreshKey={premiumReportsRefreshKey}
          />
        </div>
      )}

      {/* Existing Reports */}
      {reports.length > 0 && (
        <div className="card">
          <h2>Community Reports ({reports.length})</h2>
          <div className="reports-section">
            {reports.map((report) => (
              <div key={report.report_id} className="report-item">
                <div className="report-header">
                  <div className="report-title">{report.report_name}</div>
                  {getStatusBadge(report.verification_status)}
                </div>
                <div className="report-meta">
                  Submitted by: {report.submitter_wallet.substring(0, 10)}...
                  {report.submitter_wallet.substring(report.submitter_wallet.length - 8)}
                  {' | '}
                  {new Date(report.submitted_at).toLocaleDateString()}
                </div>
                {report.report_ual && (
                  <div className="ual-display" style={{ marginTop: '10px' }}>
                    <strong>UAL:</strong> {report.report_ual}
                    <button className="copy-btn" onClick={() => copyToClipboard(report.report_ual)}>
                      Copy
                    </button>
                  </div>
                )}
                {report.dkg_block_explorer_url && (
                  <a href={report.dkg_block_explorer_url} target="_blank" rel="noopener noreferrer" className="link" style={{ marginTop: '10px', display: 'inline-block' }}>
                    View on DKG Explorer →
                  </a>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default ProposalDetail;
