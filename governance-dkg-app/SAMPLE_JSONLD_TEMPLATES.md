# Sample JSON-LD Templates for Premium Reports

## Overview

These templates provide examples of properly formatted JSON-LD data for premium reports that will pass DKG safe mode validation.

## Key Requirements

All premium reports must include:
- ✅ `@context` - Vocabulary definitions
- ✅ `@type: "schema:Report"` - Use schema.org Report type
- ✅ `@id` - Unique identifier
- ✅ `schema:name` - Report title
- ✅ `schema:about` - Reference to the proposal
- ✅ `schema:dateCreated` - ISO 8601 timestamp

## Template 1: Comprehensive Expert Analysis

```json
{
  "@context": {
    "schema": "https://schema.org/",
    "polkadot": "https://polkadot.network/governance/",
    "dkg": "https://dkg.origintrail.io/"
  },
  "@type": "schema:Report",
  "@id": "polkadot:referendum:1766:premium-report:20251122001",
  "schema:name": "Expert Analysis: Proposal Impact & Feasibility Assessment",
  "schema:description": "Comprehensive premium analysis providing expert insights on technical feasibility, financial implications, and strategic recommendations.",
  "schema:about": "polkadot:referendum:1766",
  "schema:dateCreated": "2025-11-22T16:00:00.000Z",
  "schema:author": {
    "@type": "schema:Person",
    "schema:identifier": "0xYourWalletAddress",
    "schema:name": "Expert Analyst"
  },
  "schema:version": "1.0",
  "schema:keywords": ["governance", "analysis", "premium", "expert-review"],
  "analysis": {
    "executiveSummary": "This premium report provides in-depth analysis of the proposal's technical feasibility, budget efficiency, and potential impact on the Polkadot ecosystem.",
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
      ]
    },
    "financialAnalysis": {
      "budgetAssessment": "The proposed budget is reasonable and well-structured",
      "costBreakdown": {
        "development": "60%",
        "security": "15%",
        "testing": "15%",
        "deployment": "10%"
      },
      "valueProposition": "Expected ROI of 3-5x within 12 months"
    },
    "recommendations": [
      "APPROVE with conditions: Implement recommended security measures",
      "Require monthly progress reports",
      "Mandate comprehensive audit before deployment"
    ]
  },
  "methodology": {
    "researchApproach": "Mixed methods combining quantitative analysis and expert interviews",
    "dataSources": [
      "Proposal documentation",
      "Team background research",
      "Community feedback analysis"
    ],
    "confidenceLevel": "High (85%)"
  }
}
```

## Template 2: Technical Deep Dive

```json
{
  "@context": {
    "schema": "https://schema.org/",
    "polkadot": "https://polkadot.network/governance/"
  },
  "@type": "schema:Report",
  "@id": "polkadot:referendum:1766:technical-analysis:20251122002",
  "schema:name": "Technical Architecture Analysis: Smart Contract Security Review",
  "schema:description": "In-depth technical review of proposed smart contract architecture, security considerations, and implementation recommendations.",
  "schema:about": "polkadot:referendum:1766",
  "schema:dateCreated": "2025-11-22T16:00:00.000Z",
  "schema:author": {
    "@type": "schema:Person",
    "schema:identifier": "0xYourWalletAddress",
    "schema:name": "Senior Blockchain Architect"
  },
  "technicalReview": {
    "architectureAnalysis": {
      "overall": "The proposed architecture follows best practices with modular design and clear separation of concerns.",
      "strengths": [
        "Well-defined smart contract interfaces",
        "Comprehensive error handling",
        "Gas-optimized implementations"
      ],
      "concerns": [
        "Potential reentrancy vulnerabilities in payment modules",
        "Lack of circuit breaker pattern for emergency scenarios"
      ]
    },
    "securityAssessment": {
      "criticalIssues": [],
      "highRiskIssues": [
        "Unchecked external calls in Module X"
      ],
      "mediumRiskIssues": [
        "Missing input validation in function Y",
        "Centralization risk in admin functions"
      ],
      "recommendations": [
        "Implement reentrancy guards on all state-changing functions",
        "Add multi-sig requirement for admin operations",
        "Conduct formal verification of core modules"
      ]
    },
    "codeQualityMetrics": {
      "testCoverage": "78%",
      "cyclomaticComplexity": "Medium",
      "documentation": "Good",
      "maintainability": "High"
    }
  },
  "expertOpinion": {
    "verdict": "APPROVE WITH MODIFICATIONS",
    "confidence": "90%",
    "reasoning": "Solid architecture with minor security improvements needed before deployment."
  }
}
```

## Template 3: Financial Analysis

```json
{
  "@context": {
    "schema": "https://schema.org/",
    "polkadot": "https://polkadot.network/governance/"
  },
  "@type": "schema:Report",
  "@id": "polkadot:referendum:1766:financial-analysis:20251122003",
  "schema:name": "Financial Impact Assessment: Budget & ROI Analysis",
  "schema:description": "Comprehensive financial analysis of proposed budget, cost-benefit analysis, and long-term financial sustainability.",
  "schema:about": "polkadot:referendum:1766",
  "schema:dateCreated": "2025-11-22T16:00:00.000Z",
  "schema:author": {
    "@type": "schema:Organization",
    "schema:name": "DeFi Economics Research Group",
    "schema:identifier": "0xYourWalletAddress"
  },
  "financialAnalysis": {
    "budgetBreakdown": {
      "totalRequested": "150,000 DOT",
      "allocation": {
        "development": {
          "amount": "90,000 DOT",
          "percentage": "60%",
          "justification": "6 month development cycle with 5 full-time developers"
        },
        "security": {
          "amount": "22,500 DOT",
          "percentage": "15%",
          "justification": "Multiple security audits from reputable firms"
        },
        "operations": {
          "amount": "37,500 DOT",
          "percentage": "25%",
          "justification": "Infrastructure, testing, and contingency"
        }
      }
    },
    "costBenefitAnalysis": {
      "estimatedCosts": "150,000 DOT",
      "estimatedBenefits": {
        "year1": "200,000 DOT equivalent in network value",
        "year2": "500,000 DOT equivalent",
        "year3": "1,000,000 DOT equivalent"
      },
      "breakEvenPeriod": "8 months",
      "netPresentValue": "650,000 DOT (3-year horizon, 10% discount rate)"
    },
    "riskAssessment": {
      "budgetOverrunProbability": "20%",
      "estimatedOverrunAmount": "15,000 DOT",
      "mitigationStrategies": [
        "Milestone-based payment releases",
        "15% contingency reserve",
        "Monthly budget reviews"
      ]
    },
    "recommendation": {
      "verdict": "APPROVE",
      "reasoning": "Strong ROI potential with reasonable budget structure",
      "conditions": [
        "Implement milestone-based funding",
        "Quarterly financial reports required",
        "External audit of budget utilization"
      ]
    }
  }
}
```

## Template 4: Community Impact Analysis

```json
{
  "@context": {
    "schema": "https://schema.org/",
    "polkadot": "https://polkadot.network/governance/"
  },
  "@type": "schema:Report",
  "@id": "polkadot:referendum:1766:community-impact:20251122004",
  "schema:name": "Community Impact Assessment: Stakeholder Analysis",
  "schema:description": "Analysis of proposal impact on various stakeholder groups within the Polkadot ecosystem.",
  "schema:about": "polkadot:referendum:1766",
  "schema:dateCreated": "2025-11-22T16:00:00.000Z",
  "schema:author": {
    "@type": "schema:Person",
    "schema:identifier": "0xYourWalletAddress",
    "schema:name": "Community Governance Analyst"
  },
  "communityAnalysis": {
    "stakeholderImpact": {
      "validators": {
        "impact": "Positive",
        "details": "Reduced operational complexity, improved rewards distribution",
        "sentiment": "Supportive (85% approval in informal polling)"
      },
      "developers": {
        "impact": "Highly Positive",
        "details": "Better tooling and documentation, faster development cycles",
        "sentiment": "Strongly supportive (92% approval)"
      },
      "tokenHolders": {
        "impact": "Positive",
        "details": "Increased network value, improved governance participation",
        "sentiment": "Supportive (78% approval)",
        "concerns": ["Short-term treasury spend", "Implementation timeline"]
      },
      "endUsers": {
        "impact": "Positive",
        "details": "Lower transaction fees, better user experience",
        "sentiment": "Supportive (80% approval)"
      }
    },
    "communityFeedbackSummary": {
      "totalResponses": 247,
      "support": "83%",
      "oppose": "12%",
      "neutral": "5%",
      "keyThemes": [
        "Strong support for improved developer tools",
        "Concerns about budget size",
        "Questions about long-term maintenance",
        "Excitement about innovation potential"
      ]
    },
    "governanceConsiderations": {
      "proposalQuality": "High - Clear objectives and deliverables",
      "communityEngagement": "Excellent - Active participation in discussions",
      "precedentImplications": "Sets positive precedent for infrastructure investment",
      "alignmentWithStrategy": "Strong alignment with ecosystem growth goals"
    }
  },
  "recommendation": {
    "verdict": "STRONG APPROVE",
    "confidence": "High",
    "reasoning": "Broad community support across all stakeholder groups with clear value proposition"
  }
}
```

## Template 5: Minimal Report (Will be normalized by backend)

```json
{
  "name": "Quick Analysis: Proposal Review",
  "description": "A concise review of the key aspects of this proposal",
  "summary": "After reviewing the proposal, I recommend approval based on the following factors: strong team background, reasonable budget, clear deliverables, and community support.",
  "keyPoints": [
    "Experienced team with proven track record",
    "Budget is competitive compared to similar projects",
    "Clear milestones and timeline",
    "Strong community engagement"
  ],
  "rating": "8/10",
  "recommendation": "APPROVE"
}
```

**Note:** The minimal format will be automatically wrapped by the backend with required fields:
- `@context`, `@type`, `@id` will be added
- `schema:name`, `schema:about`, `schema:dateCreated` will be ensured
- All your custom fields will be preserved

## Best Practices

1. **Use Standard Types**
   - Always use `"@type": "schema:Report"` (not custom types like `dkg:PremiumReport`)
   - This ensures DKG safe mode compatibility

2. **Include Required Fields**
   - `schema:name` - Clear, descriptive title
   - `schema:about` - Reference to the proposal
   - `schema:dateCreated` - When the report was created
   - `schema:author` - Who created the report

3. **Structure Your Analysis**
   - Use clear sections (executiveSummary, technicalAssessment, etc.)
   - Include your methodology and data sources
   - Provide clear recommendations

4. **Be Comprehensive**
   - Premium reports should provide real value
   - Include data, analysis, and actionable insights
   - Justify your conclusions with evidence

5. **Keep Valid JSON**
   - No trailing commas
   - Properly quoted strings
   - Valid date formats (ISO 8601)

## Testing Your JSON-LD

Before submitting, validate your JSON-LD:

1. **JSON Validator**: https://jsonlint.com/
2. **JSON-LD Playground**: https://json-ld.org/playground/
3. **Schema.org Validator**: https://validator.schema.org/

## Questions?

- Check the "Load Example" button in the UI for a pre-filled template
- Minimal JSON will be automatically enhanced by the backend
- Focus on providing valuable content - formatting is handled automatically
