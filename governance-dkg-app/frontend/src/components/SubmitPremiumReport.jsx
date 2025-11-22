/**
 * Submit Premium Report Component
 * Allows authenticated users to submit premium reports to DKG
 */

import React, { useState } from 'react';
import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

const SubmitPremiumReport = ({ proposalIndex, userWallet, authSignature, authMessage, onReportSubmitted }) => {
  const [reportName, setReportName] = useState('');
  const [jsonldData, setJsonldData] = useState('');
  const [isPremium, setIsPremium] = useState(true);
  const [premiumPrice, setPremiumPrice] = useState('10');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [showForm, setShowForm] = useState(false);

  // Create authentication headers
  const getAuthHeaders = () => {
    if (!userWallet || !authSignature || !authMessage) {
      return {};
    }

    // Base64 encode the message to ensure it's valid for HTTP headers
    const encodedMessage = btoa(authMessage);

    return {
      'x-wallet-address': userWallet,
      'x-wallet-signature': authSignature,
      'x-wallet-message': encodedMessage
    };
  };

  // Load example premium report
  const loadExampleReport = () => {
    const exampleReport = {
      "@context": {
        "schema": "https://schema.org/",
        "polkadot": "https://polkadot.network/governance/",
        "dkg": "https://dkg.origintrail.io/"
      },
      "@type": "dkg:PremiumReport",
      "@id": `polkadot:referendum:${proposalIndex}:premium-report:${Date.now()}`,
      "schema:name": reportName || "Premium Analysis Report",
      "schema:description": "Comprehensive analysis of the proposal with expert insights and recommendations.",
      "schema:about": `polkadot:referendum:${proposalIndex}`,
      "dkg:reportType": "premium",
      "dkg:analysis": {
        "executiveSummary": "This premium report provides in-depth analysis of the proposal's impact, feasibility, and alignment with community goals.",
        "technicalAssessment": {
          "feasibility": "High",
          "complexity": "Medium",
          "risks": ["Risk 1", "Risk 2"],
          "opportunities": ["Opportunity 1", "Opportunity 2"]
        },
        "financialAnalysis": {
          "budgetAssessment": "The proposed budget is reasonable for the scope of work",
          "costBreakdown": {
            "development": "60%",
            "testing": "20%",
            "deployment": "20%"
          },
          "roi": "Expected high return on investment"
        },
        "recommendations": [
          "Recommendation 1: Detailed suggestion for improvement",
          "Recommendation 2: Additional consideration for implementation"
        ]
      },
      "dkg:dataQuality": {
        "sources": ["Source 1", "Source 2", "Source 3"],
        "methodology": "Expert analysis combined with quantitative data",
        "confidence": "High"
      },
      "schema:author": {
        "@type": "schema:Person",
        "schema:identifier": userWallet,
        "schema:name": "Expert Analyst"
      },
      "schema:dateCreated": new Date().toISOString(),
      "schema:version": "1.0"
    };

    setJsonldData(JSON.stringify(exampleReport, null, 2));
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    // Validation
    if (!userWallet || !authSignature || !authMessage) {
      setError('Please connect your wallet first');
      return;
    }

    if (!jsonldData.trim()) {
      setError('Please provide JSON-LD data for your report');
      return;
    }

    if (isPremium && (!premiumPrice || parseFloat(premiumPrice) <= 0)) {
      setError('Please set a valid premium price in TRAC tokens');
      return;
    }

    // Validate JSON
    let parsedData;
    try {
      parsedData = JSON.parse(jsonldData);
      if (!parsedData['@context'] || !parsedData['@type']) {
        setError('Invalid JSON-LD: must include @context and @type fields');
        return;
      }
    } catch (parseErr) {
      setError('Invalid JSON: ' + parseErr.message);
      return;
    }

    try {
      setSubmitting(true);

      const response = await axios.post(
        `${API_BASE_URL}/api/premium-reports/submit`,
        {
          referendum_index: proposalIndex,
          report_name: reportName || `Premium Report ${Date.now()}`,
          jsonld_data: jsonldData,
          is_premium: isPremium,
          premium_price_trac: isPremium ? parseFloat(premiumPrice) : null
        },
        { headers: getAuthHeaders() }
      );

      if (response.data.success) {
        setSuccess(`✅ Premium report submitted successfully! Report ID: ${response.data.reportId}`);

        // Reset form
        setReportName('');
        setJsonldData('');
        setPremiumPrice('10');
        setShowForm(false);

        // Notify parent component
        if (onReportSubmitted) {
          onReportSubmitted(response.data);
        }

        // Auto-hide success message after 5 seconds
        setTimeout(() => setSuccess(null), 5000);
      }
    } catch (err) {
      console.error('Error submitting premium report:', err);
      setError(err.response?.data?.error || 'Failed to submit premium report');
    } finally {
      setSubmitting(false);
    }
  };

  // Calculate estimated data size
  const getDataSize = () => {
    if (!jsonldData) return 0;
    return (new Blob([jsonldData]).size / 1024).toFixed(2);
  };

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h3 style={styles.title}>Submit Premium Report</h3>
        <button
          onClick={() => setShowForm(!showForm)}
          style={{...styles.toggleButton, ...(showForm ? styles.toggleButtonActive : {})}}
        >
          {showForm ? 'Hide Form' : 'Create Premium Report'}
        </button>
      </div>

      {error && (
        <div style={styles.error}>
          <strong>Error:</strong> {error}
        </div>
      )}

      {success && (
        <div style={styles.success}>
          {success}
        </div>
      )}

      {!userWallet && (
        <div style={styles.warning}>
          <strong>⚠️ Wallet Not Connected</strong>
          <p style={{ margin: '5px 0 0 0' }}>
            Please connect your wallet above to submit premium reports.
          </p>
        </div>
      )}

      {showForm && userWallet && (
        <form onSubmit={handleSubmit} style={styles.form}>
          <div style={styles.infoBox}>
            <h4 style={styles.infoTitle}>What are Premium Reports?</h4>
            <p style={styles.infoText}>
              Premium reports are in-depth analyses that other users can purchase with TRAC tokens.
              You set the price, and users pay to access your expert insights.
            </p>
          </div>

          <div style={styles.formGroup}>
            <label style={styles.label}>
              Report Name
              <span style={styles.optional}> (optional)</span>
            </label>
            <input
              type="text"
              style={styles.input}
              placeholder="e.g., Expert Analysis of Proposal Economics"
              value={reportName}
              onChange={(e) => setReportName(e.target.value)}
              disabled={submitting}
            />
          </div>

          <div style={styles.formGroup}>
            <label style={styles.label}>
              Report Data (JSON-LD) *
              <button
                type="button"
                onClick={loadExampleReport}
                style={styles.exampleButton}
                disabled={submitting}
              >
                Load Example
              </button>
            </label>
            <textarea
              style={styles.textarea}
              placeholder='{"@context": {...}, "@type": "PremiumReport", ...}'
              value={jsonldData}
              onChange={(e) => setJsonldData(e.target.value)}
              disabled={submitting}
              rows={12}
            />
            <div style={styles.metaInfo}>
              Data size: {getDataSize()} KB
            </div>
          </div>

          <div style={styles.formGroup}>
            <label style={styles.checkboxLabel}>
              <input
                type="checkbox"
                checked={isPremium}
                onChange={(e) => setIsPremium(e.target.checked)}
                disabled={submitting}
                style={styles.checkbox}
              />
              <span>Make this a premium report (requires payment to view)</span>
            </label>
          </div>

          {isPremium && (
            <div style={styles.formGroup}>
              <label style={styles.label}>
                Premium Price (TRAC) *
              </label>
              <input
                type="number"
                step="0.01"
                min="0.01"
                style={styles.input}
                placeholder="10.00"
                value={premiumPrice}
                onChange={(e) => setPremiumPrice(e.target.value)}
                disabled={submitting}
              />
              <div style={styles.metaInfo}>
                Users will pay {premiumPrice || '0'} TRAC to access this report
              </div>
            </div>
          )}

          <div style={styles.submitSection}>
            <button
              type="submit"
              disabled={submitting || !userWallet}
              style={{
                ...styles.submitButton,
                ...(submitting || !userWallet ? styles.submitButtonDisabled : {})
              }}
            >
              {submitting ? 'Submitting...' : 'Submit Premium Report'}
            </button>
          </div>

          <div style={styles.note}>
            <strong>Note:</strong> Your report will undergo AI verification before being published to the DKG.
            Once verified, other users can discover and purchase access to it.
          </div>
        </form>
      )}
    </div>
  );
};

const styles = {
  container: {
    marginTop: '2rem'
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '1rem',
    flexWrap: 'wrap',
    gap: '1rem'
  },
  title: {
    fontSize: '1.5rem',
    fontWeight: '700',
    margin: 0,
    color: '#212529'
  },
  toggleButton: {
    backgroundColor: '#007bff',
    color: 'white',
    padding: '0.5rem 1rem',
    border: 'none',
    borderRadius: '6px',
    fontSize: '0.9rem',
    fontWeight: '600',
    cursor: 'pointer',
    transition: 'background-color 0.2s'
  },
  toggleButtonActive: {
    backgroundColor: '#6c757d'
  },
  error: {
    backgroundColor: '#f8d7da',
    color: '#721c24',
    padding: '1rem',
    borderRadius: '6px',
    marginBottom: '1rem',
    border: '1px solid #f5c6cb'
  },
  success: {
    backgroundColor: '#d4edda',
    color: '#155724',
    padding: '1rem',
    borderRadius: '6px',
    marginBottom: '1rem',
    border: '1px solid #c3e6cb'
  },
  warning: {
    backgroundColor: '#fff3cd',
    color: '#856404',
    padding: '1rem',
    borderRadius: '6px',
    marginBottom: '1rem',
    border: '1px solid #ffeeba'
  },
  form: {
    marginTop: '1rem'
  },
  infoBox: {
    backgroundColor: '#e7f3ff',
    padding: '1rem',
    borderRadius: '6px',
    marginBottom: '1.5rem',
    border: '1px solid #b3d9ff'
  },
  infoTitle: {
    margin: '0 0 0.5rem 0',
    color: '#004085',
    fontSize: '1rem'
  },
  infoText: {
    margin: 0,
    color: '#004085',
    fontSize: '0.9rem',
    lineHeight: '1.5'
  },
  formGroup: {
    marginBottom: '1.5rem'
  },
  label: {
    display: 'block',
    fontWeight: '600',
    marginBottom: '0.5rem',
    color: '#212529',
    fontSize: '0.95rem'
  },
  optional: {
    fontWeight: '400',
    color: '#6c757d',
    fontSize: '0.85rem'
  },
  input: {
    width: '100%',
    padding: '0.75rem',
    border: '1px solid #ced4da',
    borderRadius: '6px',
    fontSize: '1rem',
    fontFamily: 'inherit',
    boxSizing: 'border-box'
  },
  textarea: {
    width: '100%',
    padding: '0.75rem',
    border: '1px solid #ced4da',
    borderRadius: '6px',
    fontSize: '0.9rem',
    fontFamily: 'monospace',
    boxSizing: 'border-box',
    resize: 'vertical'
  },
  exampleButton: {
    marginLeft: '1rem',
    backgroundColor: '#28a745',
    color: 'white',
    padding: '0.25rem 0.75rem',
    border: 'none',
    borderRadius: '4px',
    fontSize: '0.85rem',
    cursor: 'pointer',
    fontWeight: '500'
  },
  metaInfo: {
    marginTop: '0.5rem',
    fontSize: '0.85rem',
    color: '#6c757d'
  },
  checkboxLabel: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
    cursor: 'pointer',
    fontSize: '0.95rem'
  },
  checkbox: {
    width: '18px',
    height: '18px',
    cursor: 'pointer'
  },
  submitSection: {
    marginTop: '2rem',
    paddingTop: '1rem',
    borderTop: '1px solid #e9ecef'
  },
  submitButton: {
    backgroundColor: '#007bff',
    color: 'white',
    padding: '0.75rem 2rem',
    border: 'none',
    borderRadius: '6px',
    fontSize: '1rem',
    fontWeight: '600',
    cursor: 'pointer',
    transition: 'background-color 0.2s',
    width: '100%'
  },
  submitButtonDisabled: {
    backgroundColor: '#6c757d',
    cursor: 'not-allowed'
  },
  note: {
    marginTop: '1rem',
    padding: '0.75rem',
    backgroundColor: '#f8f9fa',
    borderRadius: '6px',
    fontSize: '0.85rem',
    color: '#495057',
    lineHeight: '1.5'
  }
};

export default SubmitPremiumReport;
