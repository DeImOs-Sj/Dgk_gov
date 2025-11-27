/**
 * Submit Premium Report Component
 * Allows authenticated users to submit premium reports to DKG
 */

import React, { useState } from 'react';
import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

const SubmitPremiumReport = ({ proposalIndex,proposalUal, userWallet, authSignature, authMessage, onReportSubmitted }) => {
  const [reportName, setReportName] = useState('');
  const [publicJsonldData, setPublicJsonldData] = useState('');
  const [privateJsonldData, setPrivateJsonldData] = useState('');
  const [isPremium, setIsPremium] = useState(false);
  const [premiumPrice, setPremiumPrice] = useState('10');
  const [payeeWallet, setPayeeWallet] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [showForm, setShowForm] = useState(false);



  // Auto-fill payee wallet with connected wallet
  React.useEffect(() => {
    if (userWallet && !payeeWallet) {
      setPayeeWallet(userWallet);
    }
  }, [userWallet]);

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
    const examplePublicReport = {
      "@context": {
        "schema": "https://schema.org/",
        "polkadot": "https://polkadot.network/governance/",
        "dkg": "https://dkg.origintrail.io/"
      },
      "@type": "schema:Report",
      "@id": `polkadot:referendum:${proposalIndex}:premium-report:${Date.now()}`,
      "schema:name": reportName || "Expert Analysis: Proposal Impact & Feasibility Assessment",
      "schema:description": "Comprehensive premium analysis providing expert insights on technical feasibility, financial implications, and strategic recommendations for the governance proposal.",
      "schema:about": `did:dkg:otp:20430/0xcdb28e93ed340ec10a71bba00a31dbfcf1bd5d37/399691`,
      "schema:dateCreated": new Date().toISOString(),
      "schema:author": {
        "@type": "schema:Person",
        "schema:identifier": userWallet,
        "schema:name": "Expert Analyst"
      },
      "schema:version": "1.0",
      "schema:keywords": ["governance", "analysis", "premium", "expert-review"],
      "analysis": {
        "executiveSummary": "This premium report provides in-depth analysis of the proposal's technical feasibility, budget efficiency, timeline viability, and potential impact on the Polkadot ecosystem. Our assessment indicates strong alignment with community goals.",
        "technicalAssessment": {
          "feasibilityRating": "High (8/10)",
          "complexityLevel": "Medium",
          "technicalRisks": [
            "Integration complexity with existing parachain infrastructure",
            "Potential scalability concerns with proposed transaction volume"
          ],
          "technicalOpportunities": [
            "Significant improvement in cross-chain communication efficiency",
            "Novel approach to consensus mechanism optimization"
          ],
          "recommendedMitigations": [
            "Implement comprehensive stress testing before mainnet deployment",
            "Establish monitoring infrastructure for early issue detection"
          ]
        },
        "financialAnalysis": {
          "budgetAssessment": "The proposed budget of X DOT is reasonable and well-structured for the project scope, with appropriate allocation across development phases.",
          "costBreakdown": {
            "development": "60% - Core development and testing",
            "security": "15% - Audits and security review",
            "testing": "15% - QA and community testing",
            "deployment": "10% - Mainnet deployment and monitoring"
          },
          "valueProposition": "Expected ROI of 3-5x within 12 months through increased network efficiency and reduced operational costs",
          "budgetRisks": ["Potential overrun in security audit phase", "Extended testing period if issues discovered"],
          "financialRecommendations": [
            "Establish 15% contingency reserve for unforeseen challenges",
            "Implement milestone-based funding release mechanism"
          ]
        },
        "timelineAnalysis": {
          "proposedDuration": "6 months",
          "feasibilityAssessment": "Realistic with appropriate resource allocation",
          "criticalPath": ["Smart contract development", "Security audits", "Integration testing"],
          "risks": ["Dependency on third-party audit availability", "Potential delays in community feedback cycles"]
        },
        "impactAssessment": {
          "ecosystemBenefits": [
            "Enhanced developer experience and tooling",
            "Improved network efficiency and lower transaction costs",
            "Stronger competitive position in multi-chain landscape"
          ],
          "stakeholderImpact": {
            "validators": "Reduced operational complexity, improved rewards distribution",
            "developers": "Better tooling and documentation, faster development cycles",
            "tokenHolders": "Increased network value, improved governance participation"
          },
          "longTermValue": "Establishes foundation for future protocol enhancements and maintains technological competitiveness"
        },
        "riskAnalysis": {
          "technical": "Medium - Manageable with proper testing and staged rollout",
          "financial": "Low - Budget is conservative and well-justified",
          "governance": "Low - Strong community support and clear value proposition",
          "operational": "Medium - Requires ongoing maintenance and monitoring post-deployment"
        },
        "recommendations": [
          "APPROVE with conditions: Implement recommended security measures and establish milestone-based funding",
          "Require monthly progress reports to governance committee",
          "Mandate comprehensive audit before mainnet deployment",
          "Establish community testing phase before full rollout",
          "Create contingency plan for identified technical risks"
        ]
      },
      "methodology": {
        "researchApproach": "Mixed methods combining quantitative analysis, expert interviews, and comparative ecosystem research",
        "dataSources": [
          "Proposal documentation and technical specifications",
          "Team background and prior project analysis",
          "Comparable projects in Polkadot and other ecosystems",
          "Community feedback and governance discussions",
          "Independent security assessment"
        ],
        "expertiseApplied": [
          "Blockchain architecture and protocol design",
          "Financial modeling and budget analysis",
          "Project management and timeline estimation",
          "Ecosystem strategy and competitive analysis"
        ],
        "confidenceLevel": "High (85%) - Based on comprehensive analysis and strong supporting evidence"
      },
      "metadata": {
        "reportType": "premium",
        "category": "governance-analysis",
        "confidentiality": "public",
        "language": "en",
        "jurisdiction": "Global - Polkadot Ecosystem"
      }
    };

    const examplePrivateReport = {
      "@context": {
        "schema": "https://schema.org/",
        "polkadot": "https://polkadot.network/governance/"
      },
      "@type": "schema:PrivateData",
      "sensitiveInformation": {
        "internalNotes": "Confidential analysis shared only with authorized parties",
        "detailedFinancials": {
          "actualCosts": "More granular cost breakdown available here",
          "vendorContracts": "Details about specific vendors and contracts"
        },
        "riskMitigationStrategies": [
          "Proprietary risk assessment methodologies",
          "Internal stakeholder concerns and mitigation plans"
        ],
        "competitiveIntelligence": {
          "marketAnalysis": "Detailed competitive landscape analysis",
          "strategicRecommendations": "Internal strategic recommendations"
        }
      },
      "metadata": {
        "classification": "confidential",
        "accessLevel": "premium-only"
      }
    };

    setPublicJsonldData(JSON.stringify(examplePublicReport, null, 2));
    setPrivateJsonldData(JSON.stringify(examplePrivateReport, null, 2));
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

    if (!publicJsonldData.trim()) {
      setError('Please provide public JSON-LD data for your report');
      return;
    }

    if (isPremium && (!premiumPrice || parseFloat(premiumPrice) <= 0)) {
      setError('Please set a valid premium price in USDC tokens');
      return;
    }

    if (isPremium && !payeeWallet) {
      setError('Please provide a payee wallet address (who will receive payments)');
      return;
    }

    // Validate public JSON
    let parsedPublicData;
    try {
      parsedPublicData = JSON.parse(publicJsonldData);
      if (!parsedPublicData['@context'] || !parsedPublicData['@type']) {
        setError('Invalid public JSON-LD: must include @context and @type fields');
        return;
      }
    } catch (parseErr) {
      setError('Invalid public JSON: ' + parseErr.message);
      return;
    }

    // Validate private JSON if provided
    let parsedPrivateData = null;
    if (privateJsonldData.trim()) {
      try {
        parsedPrivateData = JSON.parse(privateJsonldData);
      } catch (parseErr) {
        setError('Invalid private JSON: ' + parseErr.message);
        return;
      }
    }

    try {
      setSubmitting(true);

      const response = await axios.post(
        `${API_BASE_URL}/api/premium-reports/submit`,
        {
          referendum_index: proposalIndex,
          report_name: reportName || `Premium Report ${Date.now()}`,
          public_jsonld_data: publicJsonldData,
          private_jsonld_data: privateJsonldData || null,
          is_premium: isPremium,
          premium_price_trac: isPremium ? parseFloat(premiumPrice) : null,
          payee_wallet: isPremium ? payeeWallet : null
        },
        { headers: getAuthHeaders() }
      );

      if (response.data.success) {
        const reportId = response.data.report.report_id;
        setSuccess(`✅ Premium report submitted! Starting verification...`);

        // Auto-trigger verification and publish flow
        setTimeout(async () => {
          try {
            // Step 1: Verify the report
            setSuccess(`🔍 Verifying report with AI...`);
            const verifyResponse = await axios.post(
              `${API_BASE_URL}/api/premium-reports/${reportId}/verify`
            );

            if (verifyResponse.data.success) {
              const verification = verifyResponse.data.verification;

              if (verification.status === 'verified') {
                setSuccess(`✅ Report verified! Publishing to DKG...`);

                // Step 2: Publish to DKG
                const publishResponse = await axios.post(
                  `${API_BASE_URL}/api/premium-reports/${reportId}/verify-and-publish`,
                  {},
                  { headers: getAuthHeaders() }
                );

                if (publishResponse.data.success) {
                  setSuccess(
                    `🎉 Premium report published to DKG successfully!\n` +
                    `UAL: ${publishResponse.data.dkg.ual}\n` +
                    `Report ID: ${reportId}`
                  );

                  // Reset form
                  setReportName('');
                  setPublicJsonldData('');
                  setPrivateJsonldData('');
                  setPremiumPrice('10');
                  setPayeeWallet(userWallet || '');
                  setShowForm(false);

                  // Notify parent component
                  if (onReportSubmitted) {
                    onReportSubmitted({
                      ...response.data,
                      dkg: publishResponse.data.dkg
                    });
                  }

                  // Auto-hide success message after 10 seconds
                  setTimeout(() => setSuccess(null), 10000);
                } else {
                  setError(`Failed to publish to DKG: ${publishResponse.data.error || 'Unknown error'}`);
                }
              } else {
                setError(
                  `❌ Report verification failed: ${verification.reasoning}\n` +
                  `Issues: ${verification.issues?.join(', ') || 'None specified'}`
                );
              }
            }
          } catch (verifyErr) {
            console.error('Verification/publish error:', verifyErr);
            setError(`Verification failed: ${verifyErr.response?.data?.error || verifyErr.message}`);
          }
        }, 1000);
      }
    } catch (err) {
      console.error('Error submitting premium report:', err);
      setError(err.response?.data?.error || 'Failed to submit premium report');
    } finally {
      setSubmitting(false);
    }
  };

  // Calculate estimated data size
  const getPublicDataSize = () => {
    if (!publicJsonldData) return 0;
    return (new Blob([publicJsonldData]).size / 1024).toFixed(2);
  };

  const getPrivateDataSize = () => {
    if (!privateJsonldData) return 0;
    return (new Blob([privateJsonldData]).size / 1024).toFixed(2);
  };

  // Calculate total data size (public + private)
  const getTotalDataSize = () => {
    const publicSize = parseFloat(getPublicDataSize()) || 0;
    const privateSize = parseFloat(getPrivateDataSize()) || 0;
    return (publicSize + privateSize).toFixed(2);
  };

  // Calculate submission fee based on total data size
  const calculateFee = () => {
    const BASE_FEE = 0.05; // Base fee in TRAC
    const PER_KB_FEE = 0.01; // Fee per KB in TRAC
    const totalSizeKB = parseFloat(getTotalDataSize()) || 0;
    const fee = BASE_FEE + (totalSizeKB * PER_KB_FEE);
    return fee.toFixed(4);
  };

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h3 style={styles.title}>Submit Report</h3>
        <button
          onClick={() => setShowForm(!showForm)}
          style={{...styles.toggleButton, ...(showForm ? styles.toggleButtonActive : {})}}
        >
          {showForm ? 'Hide Form' : 'Create Report'}
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

      {showForm && (
        <form onSubmit={handleSubmit} style={styles.form}>
          {!userWallet && (
            <div style={styles.warningBox}>
              <strong>⚠️ Wallet Not Connected</strong>
              <p style={{ margin: '5px 0 10px 0', fontSize: '0.9rem' }}>
                You need to connect your wallet to submit reports. Please connect your wallet above.
              </p>
            </div>
          )}
          <div style={styles.infoBox}>
            <h4 style={styles.infoTitle}>Report Submission</h4>
            <p style={styles.infoText}>
              Submit reports with public data (always visible) and optional private data (stored locally).
              You can make reports premium to require payment for access, or keep them free for everyone.
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
              Public Report Data (JSON-LD) *
              <button
                type="button"
                onClick={loadExampleReport}
                style={styles.exampleButton}
                disabled={submitting}
              >
                Load Example
              </button>
            </label>
            <div style={styles.infoText}>
              This data will be sent to the AI agent for verification and published to the DKG network.
            </div>
            <textarea
              style={styles.textarea}
              placeholder='{"@context": {...}, "@type": "Report", ...}'
              value={publicJsonldData}
              onChange={(e) => setPublicJsonldData(e.target.value)}
              disabled={submitting}
              rows={12}
            />
            <div style={styles.metaInfo}>
              Public data size: {getPublicDataSize()} KB
            </div>
          </div>

          <div style={styles.formGroup}>
            <label style={styles.label}>
              Private Report Data (JSON-LD)
              <span style={styles.optional}> (optional)</span>
            </label>
            <div style={styles.infoText}>
              This data will be stored locally in the database and NOT sent to the AI agent or published to DKG.
              A hash reference will be added to the public data.
            </div>
            <textarea
              style={styles.textarea}
              placeholder='{"@context": {...}, "@type": "PrivateData", ...}'
              value={privateJsonldData}
              onChange={(e) => setPrivateJsonldData(e.target.value)}
              disabled={submitting}
              rows={12}
            />
            <div style={styles.metaInfo}>
              Private data size: {getPrivateDataSize()} KB
            </div>
          </div>

          {(publicJsonldData || privateJsonldData) && (
            <div style={styles.feeBox}>
              <div style={styles.feeRow}>
                <span>Total data size:</span>
                <strong>{getTotalDataSize()} KB</strong>
              </div>
              <div style={styles.feeRow}>
                <span>Submission fee (stake):</span>
                <strong>{calculateFee()} USDC</strong>
              </div>
              <div style={styles.feeNote}>
                💰 In production, you would stake the required TRAC tokens to confirm your submission.
                For this demo, payment verification is automatic.
              </div>
            </div>
          )}

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
            <>
              <div style={styles.formGroup}>
                <label style={styles.label}>
                  Payee Wallet Address *
                  <span style={styles.helpText}> (who receives payments)</span>
                </label>
                <input
                  type="text"
                  style={styles.input}
                  placeholder="0x..."
                  value={payeeWallet}
                  onChange={(e) => setPayeeWallet(e.target.value)}
                  disabled={submitting}
                />
                <div style={styles.metaInfo}>
                  This wallet will receive USDC payments when users purchase access to this report
                </div>
              </div>

              <div style={styles.formGroup}>
                <label style={styles.label}>
                  Premium Price (USDC) *
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0.01"
                  style={styles.input}
                  placeholder="1.00"
                  value={premiumPrice}
                  onChange={(e) => setPremiumPrice(e.target.value)}
                  disabled={submitting}
                />
                <div style={styles.metaInfo}>
                  Users will pay {premiumPrice || '0'} USDC to access this report
                </div>
              </div>
            </>
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
              {submitting ? 'Submitting...' : `Submit ${isPremium ? 'Premium' : 'Public'} Report`}
            </button>
          </div>

          <div style={styles.note}>
            <strong>Note:</strong> Only the public data will be sent to the AI agent for verification.
            {privateJsonldData && (
              <span> The private data will be stored locally with a unique hash, and the hash reference
              will be added to the public data before publishing to the DKG.</span>
            )}
            {isPremium && (
              <span> This is a premium report - users must pay {premiumPrice} USDC to access it.</span>
            )}
            {!isPremium && (
              <span> This is a free public report - anyone can view it.</span>
            )}
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
  helpText: {
    fontWeight: '400',
    color: '#6c757d',
    fontSize: '0.85rem',
    fontStyle: 'italic'
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
  },
  warningBox: {
    backgroundColor: '#fff3cd',
    color: '#856404',
    padding: '1rem',
    borderRadius: '6px',
    marginBottom: '1.5rem',
    border: '1px solid #ffeeba'
  },
  feeBox: {
    backgroundColor: '#f8f9fa',
    padding: '1rem',
    borderRadius: '6px',
    marginBottom: '1.5rem',
    border: '1px solid #dee2e6'
  },
  feeRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '0.5rem',
    fontSize: '0.95rem'
  },
  feeNote: {
    marginTop: '0.75rem',
    paddingTop: '0.75rem',
    borderTop: '1px solid #dee2e6',
    fontSize: '0.85rem',
    color: '#6c757d',
    lineHeight: '1.4'
  }
};

export default SubmitPremiumReport;
