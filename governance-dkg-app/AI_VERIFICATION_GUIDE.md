# 🤖 AI Verification Process Guide

## Where to See the Verification Process

The AI verification process happens **in the backend terminal** where you started the server. You can see the full ChatGPT interaction in real-time!

---

## 📺 How to Watch the Process

### Step 1: Open Your Backend Terminal

Look for the terminal window where you ran:
```bash
cd /home/ssd/ot_hack/governance-dkg-app
./start.sh
```

You'll see output that looks like:
```
[0] 🚀 Polkadot Governance DKG Integration - Backend Server
[0] 📡 Server running on: http://localhost:3001
```

**This is where you'll see the AI verification!**

---

## 🎬 What You'll See During Verification

When you submit a report, the terminal will display:

### Example Output:

```
================================================================================
🤖 AI VERIFICATION PROCESS STARTED
================================================================================
📋 Referendum #5
📄 Report Name: Q1 Progress Report
📊 Report Size: 847 bytes

📤 Sending to OpenAI GPT-4...
   Model: gpt-4o-mini
   Temperature: 0.3
   Max Tokens: 500

📥 Received AI Response:
{
  "valid": true,
  "confidence": 0.92,
  "issues": [],
  "reasoning": "The report is well-structured, properly references Referendum #5,
                provides meaningful milestone updates, and contains no spam or
                malicious content. The JSON-LD format is correct with all
                required fields."
}
================================================================================

✅ VERIFICATION RESULT:
   Valid: ✅ YES
   Confidence: 92.0%
   Reasoning: The report is well-structured, properly references Referendum #5...
================================================================================
```

---

## 🔍 What the AI Evaluates

The prompt sent to ChatGPT checks:

### 1. **Format Validation**
```
✅ Has @context
✅ Has @type
✅ Has @id
✅ Valid JSON-LD structure
```

### 2. **Reference Check**
```
✅ References correct Referendum #
✅ Links to parent proposal
✅ Includes proposal UAL or ID
```

### 3. **Content Quality**
```
✅ Claims are reasonable
✅ Verifiable based on proposal context
✅ Provides meaningful information
✅ No spam or malicious content
```

### 4. **Confidence Score**
```
0.0 - 0.4: Low confidence (❌ Rejected)
0.5 - 0.6: Medium confidence (⚠️ Review)
0.7 - 1.0: High confidence (✅ Approved)
```

---

## 📝 Example Prompts Sent to ChatGPT

### What Gets Sent:

```
You are validating a community-submitted report about Polkadot
Governance Referendum #5.

ORIGINAL PROPOSAL DATA:
{
  "referendum_index": 5,
  "title": "KILT Decentralized Identity Provider (DIP)",
  "summary": "Develop and implement the KILT DIP...",
  "status": "Executed",
  ...
}

SUBMITTED REPORT JSON-LD:
{
  "@context": "https://schema.org/",
  "@type": "Report",
  "schema:name": "Q1 Progress Report",
  "schema:about": "polkadot:referendum:5",
  "polkadot:milestones": [...]
}

Please verify:
1. Is the JSON-LD properly formatted?
2. Does it reference the correct proposal?
3. Are claims reasonable?
4. Contains spam/malicious content?
5. Provides meaningful information?

Respond with JSON only:
{
  "valid": true/false,
  "confidence": 0.0-1.0,
  "issues": [...],
  "reasoning": "..."
}
```

---

## 🧪 Test It Yourself

### Test 1: Submit a Valid Report

1. **Navigate to Referendum #5**
   - http://localhost:3000/proposal/5

2. **Click "Load Example"**
   - Pre-fills valid JSON-LD

3. **Enter Wallet Address**
   - `0x1234567890abcdef1234567890abcdef12345678`

4. **Click "Submit for Verification"**

5. **Watch Your Backend Terminal!**
   ```
   You'll see:
   🤖 AI VERIFICATION PROCESS STARTED
   📤 Sending to OpenAI GPT-4...
   📥 Received AI Response: {...}
   ✅ VERIFICATION RESULT: ✅ YES
   ```

---

### Test 2: Submit an Invalid Report

1. **Navigate to Referendum #5**

2. **Enter This JSON** (deliberately invalid):
   ```json
   {
     "@context": "https://schema.org/",
     "@type": "Report",
     "schema:name": "Spam Report",
     "schema:description": "Buy crypto now! Click here!"
   }
   ```

3. **Submit**

4. **Watch Terminal**:
   ```
   📥 Received AI Response:
   {
     "valid": false,
     "confidence": 0.1,
     "issues": ["Contains spam content", "No proposal reference"],
     "reasoning": "Report appears to be spam and doesn't reference
                   the proposal"
   }

   ✅ VERIFICATION RESULT:
      Valid: ❌ NO
      Confidence: 10.0%
      Issues: Contains spam content, No proposal reference
   ```

---

## 📊 Viewing the Full Conversation

### Backend Terminal Shows:

1. **Request Details**
   - Referendum number
   - Report name
   - Data size
   - Model used (gpt-4o-mini)

2. **ChatGPT's Full Response**
   - Complete JSON response
   - Reasoning
   - Confidence score
   - Any issues found

3. **Verification Result**
   - ✅ or ❌ decision
   - Confidence percentage
   - Summary reasoning

---

## 🔧 Configuration

### Model Settings (in `backend/.env`):

```env
LLM_MODEL=gpt-4o-mini          # Model to use
LLM_TEMPERATURE=1              # Creativity (0.3 recommended)
AI_VERIFICATION_THRESHOLD=0.7  # Minimum confidence to pass
```

### Change the Model:

```env
LLM_MODEL=gpt-4o              # More accurate, slower, expensive
LLM_MODEL=gpt-4o-mini         # Faster, cheaper (default)
LLM_MODEL=gpt-3.5-turbo       # Fastest, cheapest
```

---

## 💰 API Usage

Each verification costs approximately:
- **gpt-4o-mini**: ~$0.001 per verification
- **gpt-4o**: ~$0.02 per verification

The prompt size is typically:
- Input: ~1000 tokens (proposal + report)
- Output: ~200 tokens (verification response)

---

## 🐛 Troubleshooting

### Can't See the Output?

**Make sure you're looking at the RIGHT terminal:**
- Terminal with `[0]` prefix = Backend (see AI logs here!)
- Terminal with `[1]` prefix = Frontend (no AI logs)

### Backend Terminal Shows Nothing?

1. **Restart the backend**:
   ```bash
   # Kill all servers
   lsof -ti :3001 :3000 | xargs kill -9

   # Restart
   cd /home/ssd/ot_hack/governance-dkg-app
   ./start.sh
   ```

2. **Submit a new report** to trigger verification

### OpenAI API Error?

Check your API key:
```bash
grep OPENAI_API_KEY backend/.env
```

Should show:
```
OPENAI_API_KEY=sk-proj-...
```

---

## 📸 Screenshot Guide

### What to Look For:

```
┌─────────────────────────────────────────────────┐
│ Your Terminal                                    │
├─────────────────────────────────────────────────┤
│ [0] 🤖 AI VERIFICATION PROCESS STARTED          │ ← Look for this!
│ [0] 📋 Referendum #5                            │
│ [0] 📄 Report Name: Q1 Progress Report          │
│ [0] 📊 Report Size: 847 bytes                   │
│ [0]                                             │
│ [0] 📤 Sending to OpenAI GPT-4...               │
│ [0]    Model: gpt-4o-mini                       │
│ [0]    Temperature: 0.3                         │
│ [0]                                             │
│ [0] 📥 Received AI Response:                    │
│ [0] {                                           │
│ [0]   "valid": true,                            │
│ [0]   "confidence": 0.92,                       │
│ [0]   "issues": [],                             │
│ [0]   "reasoning": "..."                        │
│ [0] }                                           │
│ [0]                                             │
│ [0] ✅ VERIFICATION RESULT:                     │
│ [0]    Valid: ✅ YES                            │
│ [0]    Confidence: 92.0%                        │
└─────────────────────────────────────────────────┘
```

---

## 🎯 Quick Reference

| What | Where | When |
|------|-------|------|
| **AI Logs** | Backend terminal (`[0]` prefix) | During report submission |
| **ChatGPT Prompt** | Backend terminal | Just before API call |
| **ChatGPT Response** | Backend terminal | After API response |
| **Verification Result** | Backend terminal & Frontend | After parsing response |
| **Confidence Score** | Backend terminal | In verification result |

---

## 📚 Related Files

- **Service Code**: `backend/src/services/ai-verification-service.js`
- **API Route**: `backend/src/routes/reports.js` (line ~100)
- **Frontend**: `frontend/src/components/ProposalDetail.jsx`

---

## 🚀 Try It Now!

1. **Open Terminal** where backend is running
2. **Open Browser** to http://localhost:3000/proposal/5
3. **Submit a Report**
4. **Watch Terminal** for AI verification output!

You should see the full conversation with ChatGPT in real-time! 🎉

---

**Last Updated**: November 19, 2025
**Status**: ✅ Enhanced logging active
