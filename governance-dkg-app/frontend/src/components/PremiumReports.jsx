/**
 * Premium Reports Component with X402 Payment Flow
 * Displays premium reports for a proposal with payment integration
 */

import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { ethers } from 'ethers';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

const PremiumReports = ({ proposalIndex, userWallet, authSignature, authMessage, refreshKey = 0 }) => {
  const [premiumReports, setPremiumReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [payingFor, setPayingFor] = useState(null);
  const [expandedReport, setExpandedReport] = useState(null);

  useEffect(() => {
    fetchPremiumReports();
  }, [proposalIndex, userWallet, refreshKey]);

  // Create axios headers with wallet authentication
  const getAuthHeaders = () => {
    if (!userWallet || !authSignature || !authMessage) {
      return {};
    }
console.log('Auth Message:', authMessage,authSignature);
    // Base64 encode the message to ensure it's valid for HTTP headers
    const encodedMessage = btoa(authMessage);

    return {
      'x-wallet-address': userWallet,
      'x-wallet-signature': authSignature,
      'x-wallet-message': encodedMessage
    };
  };

  // Fetch premium reports for the proposal
  const fetchPremiumReports = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await axios.get(
        `${API_BASE_URL}/api/premium-reports/proposal/${proposalIndex}`,
        { headers: getAuthHeaders() }
      );

      setPremiumReports(response.data.reports || []);
    } catch (error) {
      console.error('Error fetching premium reports:', error);
      setError('Failed to load premium reports');
    } finally {
      setLoading(false);
    }
  };

  // Handle payment for premium report
  const handlePaymentRequest = async (report) => {
    if (!userWallet) {
      alert('Please connect your wallet first');
      return;
    }

    setPayingFor(report.report_id);
    setError(null);

    try {
      // Get payment message from backend
      const messageResponse = await axios.get(
        `${API_BASE_URL}/api/premium-reports/${report.report_id}/payment-message?wallet=${userWallet}`
      );

      const paymentMessage = messageResponse.data.message;

      // Sign the payment message with MetaMask
      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      const paymentSignature = await signer.signMessage(paymentMessage);

      // Submit payment request to backend
      const accessResponse = await axios.post(
        `${API_BASE_URL}/api/premium-reports/${report.report_id}/request-access`,
        {
          wallet: userWallet,
          signature: paymentSignature,
          message: paymentMessage,
          tx_hash: null // Optional: can add actual on-chain tx hash
        }
      );

      if (accessResponse.data.success) {
        alert('Payment verified! You now have access to this premium report.');
        // Refresh reports to show updated access
        fetchPremiumReports();
      } else {
        setError(accessResponse.data.error || 'Payment verification failed');
      }
    } catch (error) {
      console.error('Error processing payment:', error);
      if (error.response?.data?.error) {
        setError(error.response.data.error);
      } else {
        setError('Failed to process payment. Please try again.');
      }
    } finally {
      setPayingFor(null);
    }
  };

  // View full premium report (if user has access)
  const viewFullReport = async (reportId) => {
    try {
      const response = await axios.get(
        `${API_BASE_URL}/api/premium-reports/${reportId}`,
        { headers: getAuthHeaders() }
      );

      if (response.data.success) {
        setExpandedReport(response.data.report);
      } else if (response.status === 402) {
        alert('Payment required to view this report');
      }
    } catch (error) {
      if (error.response?.status === 402) {
        alert('Payment required to view this report. Please complete payment first.');
      } else {
        console.error('Error fetching report:', error);
        setError('Failed to load report content');
      }
    }
  };

  // Close expanded report view
  const closeExpandedView = () => {
    setExpandedReport(null);
  };

  if (loading) {
    return <div style={styles.loading}>Loading premium reports...</div>;
  }

  if (error) {
    return <div style={styles.error}>{error}</div>;
  }

  if (premiumReports.length === 0) {
    return (
      <div style={styles.emptyState}>
        <p>No premium reports available for this proposal yet.</p>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      <h3 style={styles.title}>Premium Reports</h3>

      <div style={styles.reportsList}>
        {premiumReports.map((report) => (
          <div key={report.report_id} style={styles.reportCard}>
            <div style={styles.reportHeader}>
              <div>
                <h4 style={styles.reportName}>
                  {report.report_name || `Report #${report.report_id}`}
                </h4>
                <div style={styles.reportMeta}>
                  <span style={styles.badge}>
                    {report.author_type === 'admin' ? 'Official' : 'Community'}
                  </span>
                  <span style={styles.metaText}>
                    {new Date(report.submitted_at).toLocaleDateString()}
                  </span>
                  {report.report_ual && (
                    <a
                      href={`https://dkg.origintrail.io/explore?ual=${encodeURIComponent(report.report_ual)}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={styles.ualLink}
                    >
                      View on DKG
                    </a>
                  )}
                </div>
              </div>

              <div style={styles.priceContainer}>
                <div style={styles.price}>
                  {report.premium_price_trac} TRAC
                </div>
              </div>
            </div>

            <div style={styles.reportBody}>
              {report.has_access ? (
                <div>
                  <div style={styles.accessGranted}>
                    You have access to this report
                  </div>
                  <button
                    onClick={() => viewFullReport(report.report_id)}
                    style={styles.viewButton}
                  >
                    View Full Report
                  </button>
                </div>
              ) : (
                <div>
                  <div style={styles.paymentRequired}>
                    Payment required to access full content
                  </div>
                  <button
                    onClick={() => handlePaymentRequest(report)}
                    disabled={payingFor === report.report_id || !userWallet}
                    style={{
                      ...styles.payButton,
                      ...((!userWallet || payingFor === report.report_id) && styles.payButtonDisabled)
                    }}
                  >
                    {payingFor === report.report_id
                      ? 'Processing...'
                      : !userWallet
                      ? 'Connect Wallet to Pay'
                      : `Pay ${report.premium_price_trac} TRAC`}
                  </button>
                </div>
              )}

              <div style={styles.reportDetails}>
                <p>
                  <strong>Status:</strong> {report.verification_status}
                </p>
                <p>
                  <strong>Size:</strong> {(report.data_size_bytes / 1024).toFixed(2)} KB
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {expandedReport && (
        <div style={styles.modal} onClick={closeExpandedView}>
          <div style={styles.modalContent} onClick={(e) => e.stopPropagation()}>
            <div style={styles.modalHeader}>
              <h3>{expandedReport.report_name}</h3>
              <button onClick={closeExpandedView} style={styles.closeButton}>
                ×
              </button>
            </div>

            <div style={styles.modalBody}>
              <div style={styles.reportMetadata}>
                <p><strong>Report ID:</strong> {expandedReport.report_id}</p>
                <p><strong>Author:</strong> {expandedReport.author_type}</p>
                <p><strong>Submitted:</strong> {new Date(expandedReport.submitted_at).toLocaleString()}</p>
                {expandedReport.report_ual && (
                  <p>
                    <strong>DKG UAL:</strong>{' '}
                    <a
                      href={`https://dkg.origintrail.io/explore?ual=${encodeURIComponent(expandedReport.report_ual)}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={styles.link}
                    >
                      {expandedReport.report_ual}
                    </a>
                  </p>
                )}
              </div>

              <div style={styles.jsonldContainer}>
                <h4>Report Content (JSON-LD)</h4>
                <pre style={styles.jsonld}>
                  {JSON.stringify(JSON.parse(expandedReport.jsonld_data), null, 2)}
                </pre>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const styles = {
  container: {
    margin: '2rem 0'
  },
  title: {
    fontSize: '1.5rem',
    fontWeight: '700',
    marginBottom: '1rem',
    color: '#212529'
  },
  loading: {
    textAlign: 'center',
    padding: '2rem',
    color: '#6c757d'
  },
  error: {
    backgroundColor: '#f8d7da',
    color: '#721c24',
    padding: '1rem',
    borderRadius: '6px',
    marginBottom: '1rem'
  },
  emptyState: {
    textAlign: 'center',
    padding: '3rem',
    backgroundColor: '#f8f9fa',
    borderRadius: '8px',
    color: '#6c757d'
  },
  reportsList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '1rem'
  },
  reportCard: {
    backgroundColor: 'white',
    border: '2px solid #e9ecef',
    borderRadius: '8px',
    padding: '1.5rem',
    transition: 'border-color 0.2s'
  },
  reportHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'start',
    marginBottom: '1rem',
    gap: '1rem',
    flexWrap: 'wrap'
  },
  reportName: {
    fontSize: '1.25rem',
    fontWeight: '600',
    margin: '0 0 0.5rem 0',
    color: '#212529'
  },
  reportMeta: {
    display: 'flex',
    gap: '0.75rem',
    alignItems: 'center',
    flexWrap: 'wrap'
  },
  badge: {
    backgroundColor: '#007bff',
    color: 'white',
    padding: '0.25rem 0.75rem',
    borderRadius: '12px',
    fontSize: '0.75rem',
    fontWeight: '600',
    textTransform: 'uppercase'
  },
  metaText: {
    color: '#6c757d',
    fontSize: '0.875rem'
  },
  ualLink: {
    color: '#007bff',
    fontSize: '0.875rem',
    textDecoration: 'none'
  },
  priceContainer: {
    textAlign: 'right'
  },
  price: {
    fontSize: '1.5rem',
    fontWeight: '700',
    color: '#28a745',
    fontFamily: 'monospace'
  },
  reportBody: {
    paddingTop: '1rem',
    borderTop: '1px solid #e9ecef'
  },
  accessGranted: {
    backgroundColor: '#d4edda',
    color: '#155724',
    padding: '0.75rem',
    borderRadius: '6px',
    marginBottom: '1rem',
    fontWeight: '500'
  },
  paymentRequired: {
    backgroundColor: '#fff3cd',
    color: '#856404',
    padding: '0.75rem',
    borderRadius: '6px',
    marginBottom: '1rem',
    fontWeight: '500'
  },
  viewButton: {
    backgroundColor: '#28a745',
    color: 'white',
    padding: '0.75rem 1.5rem',
    border: 'none',
    borderRadius: '6px',
    fontSize: '1rem',
    fontWeight: '600',
    cursor: 'pointer',
    marginBottom: '1rem'
  },
  payButton: {
    backgroundColor: '#007bff',
    color: 'white',
    padding: '0.75rem 1.5rem',
    border: 'none',
    borderRadius: '6px',
    fontSize: '1rem',
    fontWeight: '600',
    cursor: 'pointer',
    marginBottom: '1rem',
    transition: 'background-color 0.2s'
  },
  payButtonDisabled: {
    backgroundColor: '#6c757d',
    cursor: 'not-allowed'
  },
  reportDetails: {
    fontSize: '0.875rem',
    color: '#6c757d'
  },
  modal: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000,
    padding: '1rem'
  },
  modalContent: {
    backgroundColor: 'white',
    borderRadius: '8px',
    maxWidth: '800px',
    width: '100%',
    maxHeight: '90vh',
    overflow: 'auto'
  },
  modalHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '1.5rem',
    borderBottom: '1px solid #e9ecef'
  },
  closeButton: {
    background: 'none',
    border: 'none',
    fontSize: '2rem',
    cursor: 'pointer',
    color: '#6c757d',
    lineHeight: 1
  },
  modalBody: {
    padding: '1.5rem'
  },
  reportMetadata: {
    marginBottom: '1.5rem',
    fontSize: '0.875rem'
  },
  jsonldContainer: {
    marginTop: '1rem'
  },
  jsonld: {
    backgroundColor: '#f8f9fa',
    padding: '1rem',
    borderRadius: '6px',
    overflow: 'auto',
    fontSize: '0.875rem',
    maxHeight: '400px'
  },
  link: {
    color: '#007bff',
    textDecoration: 'none',
    wordBreak: 'break-all'
  }
};

export default PremiumReports;
