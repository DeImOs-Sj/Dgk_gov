/**
 * JSON-LD Generator for Polkadot Governance Proposals
 */

export function proposalToJSONLD(proposal) {
  // Parse monetary amounts
  const parseAmount = (amountStr) => {
    if (!amountStr || amountStr === '0' || amountStr === '-1') return null;
    // Polkadot uses 10 decimals
    const amount = parseFloat(amountStr) / 1e10;
    return amount.toFixed(4);
  };

  const requestedAmount = parseAmount(proposal.requested_amount);

  const jsonld = {
    "@context": {
      "schema": "https://schema.org/",
      "polkadot": "https://polkadot.network/governance/",
      "xsd": "http://www.w3.org/2001/XMLSchema#"
    },
    "@type": ["polkadot:GovernanceProposal", "schema:Proposal"],
    "@id": `polkadot:referendum:${proposal.referendum_index}`,

    "polkadot:referendumIndex": proposal.referendum_index,
    "schema:name": proposal.title,
    "schema:description": proposal.summary,

    "polkadot:status": proposal.status,
    "polkadot:origin": proposal.origin,

    "polkadot:proposer": {
      "@type": "schema:Person",
      "@id": `polkadot:account:${proposal.proposer_address}`,
      "schema:identifier": proposal.proposer_address
    },

    "polkadot:votingResults": {
      "@type": "schema:VoteAction",
      "polkadot:ayesAmount": proposal.ayes_amount,
      "polkadot:naysAmount": proposal.nays_amount
    },

    "polkadot:blockchain": {
      "polkadot:createdBlock": proposal.created_block,
      "polkadot:latestBlock": proposal.latest_block
    },

    "schema:dateCreated": proposal.created_at,
    "schema:dateModified": proposal.updated_at
  };

  // Add beneficiary if exists
  if (proposal.beneficiary_address) {
    jsonld["polkadot:beneficiary"] = {
      "@type": "schema:Person",
      "@id": `polkadot:account:${proposal.beneficiary_address}`,
      "schema:identifier": proposal.beneficiary_address
    };
  }

  // Add requested amount if exists
  if (requestedAmount) {
    jsonld["polkadot:requestedAmount"] = {
      "@type": "schema:MonetaryAmount",
      "schema:value": requestedAmount,
      "schema:currency": "DOT"
    };
  }

  // Add treasury proposal ID if exists
  if (proposal.treasury_proposal_id && proposal.treasury_proposal_id !== -1) {
    jsonld["polkadot:treasuryProposalId"] = proposal.treasury_proposal_id;
  }

  return jsonld;
}

export function reportToJSONLD(report, parentProposalUAL) {
  const reportData = JSON.parse(report.jsonld_data);

  // Ensure the report links to the parent proposal
  const jsonld = {
    ...reportData,
    "schema:isPartOf": parentProposalUAL || `polkadot:referendum:${report.referendum_index}`,
    "schema:author": {
      "@type": "schema:Person",
      "schema:identifier": report.submitter_wallet
    },
    "schema:dateCreated": report.submitted_at,
    "polkadot:verificationStatus": report.verification_status,
    "polkadot:aiConfidence": report.ai_confidence
  };

  return jsonld;
}

export default {
  proposalToJSONLD,
  reportToJSONLD
};
