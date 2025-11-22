/**
 * AI Verification Service - Verify community reports using OpenAI
 */
import OpenAI from 'openai';
import dotenv from 'dotenv';

dotenv.config();

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

/**
 * Verify a community-submitted report using AI
 */
export async function verifyReport(proposalData, submittedJSONLD, referendumIndex) {
  try {
    // Parse the JSON-LD if it's a string
    const reportData = typeof submittedJSONLD === 'string' ? JSON.parse(submittedJSONLD) : submittedJSONLD;

    const prompt = `You are validating a community-submitted report about Polkadot Governance Referendum #${referendumIndex}.

ORIGINAL PROPOSAL DATA:
${JSON.stringify(proposalData, null, 2)}

SUBMITTED REPORT JSON-LD:
${JSON.stringify(reportData, null, 2)}

Please verify the following:
1. Is the JSON-LD properly formatted with @context, @type, and @id?
2. Does it reference or relate to the correct proposal (Referendum #${referendumIndex})?
3. Are the claims reasonable and verifiable based on the proposal context?
4. Does it contain harmful, spam, or clearly malicious content?
5. Does it provide meaningful additional information about the proposal?

Respond ONLY with valid JSON in this exact format:
{
  "valid": true/false,
  "confidence": 0.0-1.0,
  "issues": ["list of specific issues if any"],
  "reasoning": "brief explanation of your decision"
}`;

    console.log('\n' + '='.repeat(80));
    console.log('🤖 AI VERIFICATION PROCESS STARTED');
    console.log('='.repeat(80));
    console.log(`📋 Referendum #${referendumIndex}`);
    console.log(`📄 Report Name: ${reportData['schema:name'] || reportData.name || 'Untitled'}`);
    console.log(`📊 Report Size: ${JSON.stringify(reportData).length} bytes`);
    console.log('\n📤 Sending to OpenAI GPT-4...');
    console.log(`   Model: ${process.env.LLM_MODEL || 'gpt-4o-mini'}`);
    console.log(`   Temperature: 0.3`);
    console.log(`   Max Tokens: 500`);

    const response = await openai.chat.completions.create({
      model: process.env.LLM_MODEL || 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: 'You are a validator for knowledge graph submissions. You verify the quality and validity of JSON-LD reports about governance proposals. Always respond with valid JSON only.'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      temperature: 0.3,
      max_tokens: 500
    });

    const content = response.choices[0].message.content.trim();
    console.log('\n📥 Received AI Response:');
    console.log(content);
    console.log('='.repeat(80));

    // Parse the response
    let result;
    try {
      // Try to extract JSON from markdown code blocks if present
      const jsonMatch = content.match(/```json\n?([\s\S]*?)\n?```/) || content.match(/({[\s\S]*})/);
      const jsonStr = jsonMatch ? jsonMatch[1] : content;
      result = JSON.parse(jsonStr);
    } catch (parseError) {
      console.error('❌ Failed to parse AI response:', parseError);
      // Return a conservative result if parsing fails
      return {
        valid: false,
        confidence: 0.0,
        issues: ['AI response could not be parsed'],
        reasoning: 'Verification system error'
      };
    }

    // Validate the result has required fields
    if (typeof result.valid !== 'boolean' || typeof result.confidence !== 'number') {
      throw new Error('Invalid AI response format');
    }

    console.log('\n✅ VERIFICATION RESULT:');
    console.log(`   Valid: ${result.valid ? '✅ YES' : '❌ NO'}`);
    console.log(`   Confidence: ${(result.confidence * 100).toFixed(1)}%`);
    console.log(`   Reasoning: ${result.reasoning}`);
    if (result.issues && result.issues.length > 0) {
      console.log(`   Issues: ${result.issues.join(', ')}`);
    }
    console.log('='.repeat(80) + '\n');

    return result;

  } catch (error) {
    console.error('❌ AI verification error:', error);

    // Return a conservative result on error
    return {
      valid: false,
      confidence: 0.0,
      issues: [error.message],
      reasoning: 'Verification failed due to system error'
    };
  }
}

/**
 * Calculate payment required for a report
 */
export function calculatePayment(jsonldSizeBytes) {
  const BASE_FEE = parseFloat(process.env.BASE_FEE_TRAC || '0.05');
  const PER_KB_FEE = parseFloat(process.env.PER_KB_FEE_TRAC || '0.01');

  const sizeKB = jsonldSizeBytes / 1024;
  const totalFee = Math.max(BASE_FEE, BASE_FEE + (sizeKB * PER_KB_FEE));

  return parseFloat(totalFee.toFixed(4));
}

export default {
  verifyReport,
  calculatePayment
};
