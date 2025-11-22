/**
 * Proposals API Routes
 */
import express from 'express';
import { proposalQueries } from '../database/db.js';
import { proposalToJSONLD } from '../utils/jsonld-generator.js';
import { publishAsset, getDKGExplorerURL } from '../services/dkg-service.js';
import {
  publishAssetViaChatAPI,
  publishAssetDirectMCP,
  checkChatAPIHealth,
  getChatAPIInfo
} from '../services/dkg-chat-service.js';
import {
  publishAssetDirect,
  checkDKGAPIHealth
} from '../services/dkg-direct-service.js';

const router = express.Router();

/**
 * GET /api/proposals
 * Get all proposals
 */
router.get('/', (req, res) => {
  try {
    const proposals = proposalQueries.getAll();

    res.json({
      success: true,
      count: proposals.length,
      data: proposals.map(p => ({
        ...p,
        proposal_data: p.proposal_data ? JSON.parse(p.proposal_data) : null,
        has_ual: !!p.ual
      }))
    });
  } catch (error) {
    console.error('Error fetching proposals:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * GET /api/proposals/:index
 * Get a specific proposal by referendum index
 */
router.get('/:index', (req, res) => {
  try {
    const index = parseInt(req.params.index);
    const proposal = proposalQueries.getByIndex(index);

    if (!proposal) {
      return res.status(404).json({
        success: false,
        error: 'Proposal not found'
      });
    }

    res.json({
      success: true,
      data: {
        ...proposal,
        proposal_data: proposal.proposal_data ? JSON.parse(proposal.proposal_data) : null
      }
    });
  } catch (error) {
    console.error('Error fetching proposal:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * POST /api/proposals/:index/publish
 * Publish a proposal to DKG
 */
router.post('/:index/publish', async (req, res) => {
  try {
    const index = parseInt(req.params.index);
    const proposal = proposalQueries.getByIndex(index);

    if (!proposal) {
      return res.status(404).json({
        success: false,
        error: 'Proposal not found'
      });
    }

    // Check if already published
    if (proposal.ual) {
      return res.status(400).json({
        success: false,
        error: 'Proposal already published to DKG',
        ual: proposal.ual,
        explorer_url: proposal.block_explorer_url
      });
    }

    // Convert to JSON-LD
    const proposalData = JSON.parse(proposal.proposal_data);
    const jsonld = proposalToJSONLD(proposalData);

    console.log(`📤 Publishing Referendum #${index} to DKG...`);

    // Publish to DKG
    const result = await publishAsset(jsonld, {
      sourceId: `referendum-${index}`,
      referendumIndex: index
    });

    if (!result.success) {
      return res.status(500).json({
        success: false,
        error: 'Failed to publish to DKG: ' + result.error
      });
    }

    // Update database with DKG info
    const explorerUrl = result.ual ? getDKGExplorerURL(result.ual) : null;

    proposalQueries.updateDKGStatus(
      index,
      result.ual,
      result.id,
      null,
      result.ual ? 'published' : 'pending',
      explorerUrl
    );

    res.json({
      success: true,
      message: 'Proposal published to DKG',
      dkg: {
        id: result.id,
        status: result.status,
        ual: result.ual,
        explorer_url: explorerUrl
      }
    });

  } catch (error) {
    console.error('Error publishing proposal:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * GET /api/proposals/:index/jsonld
 * Get JSON-LD representation of a proposal
 */
router.get('/:index/jsonld', (req, res) => {
  try {
    const index = parseInt(req.params.index);
    const proposal = proposalQueries.getByIndex(index);

    if (!proposal) {
      return res.status(404).json({
        success: false,
        error: 'Proposal not found'
      });
    }

    const proposalData = JSON.parse(proposal.proposal_data);
    const jsonld = proposalToJSONLD(proposalData);

    res.json(jsonld);
  } catch (error) {
    console.error('Error generating JSON-LD:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * POST /api/proposals/:index/publish-via-chat
 * Publish a proposal to DKG via Chat API with progress tracking
 */
router.post('/:index/publish-via-chat', async (req, res) => {
  try {
    const index = parseInt(req.params.index);
    const proposal = proposalQueries.getByIndex(index);

    if (!proposal) {
      return res.status(404).json({
        success: false,
        error: 'Proposal not found'
      });
    }

    // Check if already published
    if (proposal.ual) {
      return res.status(400).json({
        success: false,
        error: 'Proposal already published to DKG',
        ual: proposal.ual,
        explorer_url: proposal.block_explorer_url
      });
    }

    // Convert to JSON-LD
    const proposalData = JSON.parse(proposal.proposal_data);
    const jsonld = proposalToJSONLD(proposalData);

    console.log(`📤 Publishing Referendum #${index} to DKG via Chat API...`);

    // Track progress
    const progressSteps = [];

    // Publish to DKG via Chat API
    const result = await publishAssetDirectMCP(
      jsonld,
      {
        sourceId: `referendum-${index}`,
        referendumIndex: index,
        source: 'polkadot-governance-dkg'
      },
      (progress) => {
        progressSteps.push(progress);
        console.log(`  [${progress.step}] ${progress.message}`);
      }
    );

    if (!result.success) {
      return res.status(500).json({
        success: false,
        error: 'Failed to publish to DKG: ' + result.error,
        progress: progressSteps
      });
    }

    // Update database with DKG info
    proposalQueries.updateDKGStatus(
      index,
      result.ual,
      result.assetId || 'pending',
      null,
      result.ual ? 'published' : 'pending',
      result.explorerUrl
    );

    res.json({
      success: true,
      message: 'Proposal published to DKG via Chat API',
      dkg: {
        ual: result.ual,
        assetId: result.assetId,
        explorer_url: result.explorerUrl,
        chatResponse: result.chatResponse,
        fullResponse: result.fullResponse
      },
      progress: progressSteps
    });

  } catch (error) {
    console.error('Error publishing proposal via chat:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * POST /api/proposals/:index/publish-direct
 * Publish a proposal to DKG via Direct REST API with progress tracking
 */
router.post('/:index/publish-direct', async (req, res) => {
  try {
    const index = parseInt(req.params.index);
    const proposal = proposalQueries.getByIndex(index);

    if (!proposal) {
      return res.status(404).json({
        success: false,
        error: 'Proposal not found'
      });
    }

    // Check if already published
    if (proposal.ual) {
      return res.status(400).json({
        success: false,
        error: 'Proposal already published to DKG',
        ual: proposal.ual,
        explorer_url: proposal.block_explorer_url
      });
    }

    // Convert to JSON-LD
    const proposalData = JSON.parse(proposal.proposal_data);
    const jsonld = proposalToJSONLD(proposalData);

    console.log(`📤 Publishing Referendum #${index} to DKG via Direct API...`);

    // Track progress
    const progressSteps = [];

    // Publish to DKG via Direct API
    const result = await publishAssetDirect(
      jsonld,
      {
        sourceId: `referendum-${index}`,
        referendumIndex: index
      },
      (progress) => {
        progressSteps.push(progress);
        console.log(`  [${progress.step}] ${progress.message}`);
      }
    );

    if (!result.success) {
      return res.status(500).json({
        success: false,
        error: 'Failed to publish to DKG: ' + result.error,
        progress: progressSteps
      });
    }

    // Update database with DKG info
    proposalQueries.updateDKGStatus(
      index,
      result.ual,
      result.assetId || 'pending',
      null,
      result.ual ? 'published' : 'pending',
      result.explorerUrl
    );

    res.json({
      success: true,
      message: 'Proposal published to DKG via Direct API',
      dkg: {
        ual: result.ual,
        assetId: result.assetId,
        status: result.status,
        explorer_url: result.explorerUrl
      },
      progress: progressSteps
    });

  } catch (error) {
    console.error('Error publishing proposal via direct API:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * GET /api/proposals/dkg-chat/health
 * Check DKG Chat API health status
 */
router.get('/dkg-chat/health', async (req, res) => {
  try {
    const health = await checkChatAPIHealth();
    const info = await getChatAPIInfo();
    const dkgHealth = await checkDKGAPIHealth();

    res.json({
      success: true,
      chatAPI: health,
      llmProvider: info,
      dkgAPI: dkgHealth
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

export default router;
