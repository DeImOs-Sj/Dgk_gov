# DKG Node RAGAS Evaluation

## What is RAGAS?

RAGAS (Retrieval Augmented Generation Assessment) is a framework for evaluating how well AI chatbots answer questions, especially those that use knowledge bases or document retrieval. It measures whether the chatbot:

- **Finds the right information** from available knowledge
- **Gives accurate and relevant answers**
- **Stays truthful** to the source material (no hallucinations)
- **Actually addresses** what the user asked

## RAGAS Metrics Explained

Each evaluation measures these key aspects:

### **Context Metrics** (How well we find information)

- **Context Precision** - Are we pulling the right information from our knowledge base?
- **Context Recall** - Did we find all the relevant information available?
- **Context Relevancy** - Is the information we retrieved actually useful for the question?

### **Answer Metrics** (How well we respond)

- **Answer Relevance** - Does the answer actually address what was asked?
- **Faithfulness** - Is the answer based on facts from our knowledge base (no hallucinations)?
- **Answer Similarity** - How close is the answer to what we expect?
- **Answer Correctness** - Is the answer factually correct?

Each metric gets a score from 0-1, and we set minimum thresholds (e.g., 0.8 = 80%) that answers must meet to pass.

## Test Questions & Dataset

### Where to Find Questions

The test questions are stored in: `tests/ragas/questionsAnswers/dkg-node-evaluation-dataset.json`

### Dataset Structure

```json
{
  "questions": [
    "What is a DKG (Decentralized Knowledge Graph) and how does it work?",
    "How do I publish knowledge assets to the OriginTrail DKG blockchain?"
  ],
  "answers": [
    "Real answers collected from DKG Node during evaluation...",
    "These get automatically updated each time you run RAGAS..."
  ],
  "ground_truths": [
    "The expected/correct answer for comparison...",
    "What we want DKG Node to ideally respond with..."
  ],
  "contexts": [
    "Documentation or knowledge that should inform the answer...",
    "Source material the chatbot should reference..."
  ]
}
```

### What Each Field Means

- **questions** - The questions you want to test (e.g., "What is DKG Node?")
- **answers** - Baseline answers from DKG Node
- **ground_truths** - The correct/expected answers for comparison
- **contexts** - The knowledge/documentation DKG Node should use to answer

### Adding New Questions

1. Add your question to the `questions` array
2. Add the expected answer to `ground_truths`
3. Add relevant documentation/context to `contexts`
4. Add a baseline answer to `answers` (or leave empty initially and fill it after running RAGAS once to see what DKG Node responds)

## Configuration Settings

### Evaluation Settings

Edit `tests/ragas/config.ts` to change:

- **Which metrics to run** - Enable/disable specific RAGAS metrics
- **Score thresholds** - Set minimum passing scores (e.g., require 80% minimum)
- **LLM model** - Choose which AI model evaluates the responses
- **Browser automation settings** - Playwright timeouts and behavior

### Example Configuration

```typescript
export const ragasConfig = {
  metrics: ['context_precision', 'faithfulness', 'answer_relevance'],
  thresholds: {
    context_precision: 0.8,
    faithfulness: 0.9,
    answer_relevance: 0.7
  },
```

## Setup & Installation

### Prerequisites

Before running RAGAS evaluation, make sure you have:

- **DKG Node already set up and working** (with database, user account, etc.)
- **Required environment variable** in `apps/agent/.env`:
  ```bash
  OPENAI_API_KEY=your_openai_key
  ```
- **Update login credentials** in `apps/agent/tests/ragas/dkg-node-client.ts`:
  ```typescript
  // Lines 28-29 and 264-265
  email: "admin@gmail.com",           // Change to your email/username
  password: "admin123"    // Change to your password
  ```

> **Note:** RAGAS uses OpenAI's API to evaluate the quality of DKG Node's responses. All other environment variables should already be configured from your DKG Node setup.

## How to Run RAGAS

### Quick Start (Recommended)

```bash
# Install dependencies and build the project
npm install
npm run build

# Run complete evaluation (starts servers + generates report + opens dashboard)
npm run ragas
```

### What Happens During Evaluation

The evaluation will:

1. **Start DKG Node servers** (frontend on :8081, backend on :9200)
2. **Load test questions** from the dataset file
3. **Generate fresh answers** by asking DKG Node through automated browser interaction
4. **Compare fresh answers** against the expected answers (ground_truths) using RAGAS metrics
5. **Generate detailed reports** and save them to `tests/ragas/reports/`
6. **Open dashboard** at http://localhost:3001 showing detailed results

> **Important:** The fresh answers are generated live during each evaluation but are NOT saved back to the dataset file. The dataset file remains unchanged and serves as a baseline.

> **Note:** The servers will keep running after evaluation so you can access the dashboard and test the chatbot manually.

### Manual Commands

If you want to run individual parts:

```bash
# Just run the evaluation (servers must be running)
npm run test:ragas

# Show results from last evaluation
npm run test:ragas:results

# Open dashboard (shows cached results)
npm run test:ragas:dashboard
```

## The Dashboard

When you run `npm run ragas`, a web dashboard opens at http://localhost:3001 showing:

- **Overall Score** - How well the DKG Node chatbot is performing (0-100%)
- **Metric Breakdown** - Individual scores for each RAGAS metric
- **Question-by-Question Analysis** - Detailed view of each test question with:
  - The question asked
  - DKG Node's actual answer
  - Expected answer
  - Which metrics failed and why
- **Real-time Results** - Dashboard auto-refreshes as new evaluations complete
