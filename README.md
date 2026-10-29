# AlphaSignal — AI Investment Research Agent

> An AI-powered investment research agent that conducts real-time web research on any company and delivers a clear **INVEST** or **PASS** recommendation with detailed reasoning.

---

## Overview

AlphaSignal is a full-stack web application that acts as your AI investment analyst. Enter a company name, and the agent:

1. **Plans** 6 targeted research questions covering financials, competitive moat, market position, growth trajectory, news sentiment, and key risks
2. **Researches** each question using Tavily's finance-optimized web search API, gathering real-time data and sources
3. **Scores** the company across 4 dimensions — Financial Health, Competitive Moat, Growth Potential, and Risk Level — using GPT-4o
4. **Synthesizes** a final investment memo with an INVEST or PASS decision, confidence level, bull/bear cases, and cited sources

The entire research process (typically 45–90 seconds) is streamed live to the UI via Server-Sent Events, so you watch the agent work in real-time.

---

## How to Run It

### Prerequisites

- Node.js 18+ (LTS recommended)
- An [OpenAI API key](https://platform.openai.com/api-keys) (GPT-4o access required)
- A [Tavily API key](https://tavily.com) (free tier: 1,000 searches/month)

### Setup

```bash
# 1. Clone the repository
git clone <repo-url>
cd InvestmentApp

# 2. Set up the backend
cd backend
cp .env.example .env
# Fill in your API keys in .env
npm install

# 3. Set up the frontend (in a new terminal)
cd ../frontend
npm install
```

### Required Environment Variables

Create `backend/.env` with:

```bash
OPENAI_API_KEY=sk-...          # Your OpenAI API key (GPT-4o)
TAVILY_API_KEY=tvly-...        # Your Tavily Search API key
PORT=3001                      # Backend port (optional, defaults to 3001)
```

### Running Locally

```bash
# Terminal 1 — Start the backend
cd backend
npm run dev
# → Server running at http://localhost:3001

# Terminal 2 — Start the frontend
cd frontend
npm run dev
# → App running at http://localhost:5173
```

Open [http://localhost:5173](http://localhost:5173) in your browser and start researching!

---

## How It Works

### Architecture

```
Frontend (React + Vite)          Backend (Node.js + Express)
┌──────────────────────┐         ┌──────────────────────────────────┐
│  SearchBar           │──POST──▶│  /api/research (SSE endpoint)    │
│  ResearchProgress    │◀─SSE───│  LangGraph StateGraph            │
│  MetricsCard         │         │  ┌──────────────────────────┐   │
│  ReportCard          │         │  │ Node 1: plannerNode      │   │
└──────────────────────┘         │  │ Node 2: researcherNode   │   │
                                 │  │ Node 3: analystNode      │   │
                                 │  │ Node 4: riskAssessorNode │   │
                                 │  │ Node 5: synthesizerNode  │   │
                                 │  └──────────────────────────┘   │
                                 │  Tools: Tavily (finance + news)  │
                                 └──────────────────────────────────┘
```

### LangGraph Pipeline

The AI orchestration uses **LangGraph.js** — a stateful graph framework built on top of LangChain. The pipeline has 5 sequential nodes:

| Node | Model | Purpose |
|------|-------|---------|
| `plannerNode` | GPT-4o | Generates 6 targeted research questions |
| `researcherNode` | GPT-4o-mini + Tavily | Executes searches, summarizes findings |
| `analystNode` | GPT-4o | Scores financial health, moat, and growth (1-10) |
| `riskAssessorNode`| GPT-4o + Tavily | Deep dive on regulatory, competitive, and financial risks |
| `synthesizerNode`| GPT-4o | Writes final INVEST/PASS memo + bull/bear cases |

### Research Dimensions

The agent evaluates every company on:

- **Financial Health** (1-10): Revenue growth, profit margins, debt load, cash flow
- **Competitive Moat** (1-10): Brand strength, switching costs, network effects, patents
- **Growth Potential** (1-10): TAM size, product pipeline, expansion trajectory
- **Risk Level** (Low/Medium/High): Regulatory exposure, competitive threats, execution risk

**Decision logic:** INVEST if `overallScore ≥ 7.0 AND risk ≠ High`, or `overallScore ≥ 6.0 AND risk = Low`. Otherwise PASS.

### Streaming

The backend streams SSE events to the frontend using Express's `res.write()`. The frontend uses `fetch()` with a `ReadableStream` (instead of `EventSource`) because POST requests with a body are required to send the company name. Events are typed (`stage`, `research_step`, `research_result`, `analysis`, `complete`, `error`) so the UI updates incrementally.

---

## Key Decisions & Trade-offs

### What I Chose

| Decision | Choice | Reasoning |
|----------|--------|-----------|
| **LLM** | OpenAI GPT-4o | Best structured output, financial reasoning, and JSON reliability at reasonable cost |
| **Orchestration** | LangGraph.js `StateGraph` | Stateful graph > chains for multi-step research; clean separation of concerns |
| **Search** | Tavily API | Finance-topic mode optimized for financial queries; LangChain-native; returns structured data |
| **Streaming** | SSE (Server-Sent Events) | Simpler than WebSockets for unidirectional server→client streaming; native browser support |
| **Frontend** | React + Vite | Fastest DX, HMR, and modern tooling; Vite's proxy simplifies local dev |
| **Styling** | Vanilla CSS with CSS custom properties | Full control over design system; no Tailwind overhead; easier to customize |
| **Research flow** | 4-node linear pipeline | Clear, debuggable; each node has single responsibility |

### What I Left Out (and Why)

| Feature | Reason |
|---------|--------|
| **Caching/persistence** | Adds complexity (DB, cache invalidation). Research data is time-sensitive anyway. |
| **WebSockets** | SSE is sufficient for unidirectional streaming; WebSockets add unnecessary bidirectional overhead |
| **Financial data APIs (Polygon, Alpha Vantage)** | Tavily's finance mode already fetches real financial data; direct API integrations would require paid subscriptions and add maintenance burden |
| **User authentication** | Out of scope for this prototype; would add Firebase Auth in production |
| **Rate limiting** | Not implemented; production would require Redis-backed rate limiting per IP |
| **Parallel research nodes** | Implemented sequentially for simplicity; parallel execution would be faster but harder to stream progressively |
| **Database storage** | Research results aren't persisted; would add Supabase/Postgres in production |
| **Ticker/ISIN lookup** | Company name is used directly; a production version would resolve to a canonical ticker first |

---

## Example Runs

### 1. Apple Inc. — INVEST

```
Financial Health:  9/10  — Dominant profits, $90B+ operating income, fortress balance sheet
Competitive Moat:  10/10 — Unmatched ecosystem lock-in, brand premium, services flywheel
Growth Potential:  8/10  — Services growing 15%+ YoY; Vision Pro and AI features as new vectors
Risk Level:        Low   — Well-diversified, minimal debt, regulatory risk manageable
Overall Score:     9.1/10

Recommendation: ✅ INVEST (High Confidence)
```

### 2. NVIDIA — INVEST

```
Financial Health:  10/10 — Revenue grew 265% YoY; net margins above 55%
Competitive Moat:  9/10  — CUDA ecosystem monopoly; AI chip dominance nearly unchallengeable
Growth Potential:  9/10  — AI infrastructure spending still in early innings; data center TAM massive
Risk Level:        Medium — Valuation premium, export restrictions to China, AMD competition emerging
Overall Score:     9.3/10

Recommendation: ✅ INVEST (High Confidence)
```

### 3. WeWork — PASS

```
Financial Health:  2/10  — Multiple bankruptcies, persistent cash burn, debt restructuring
Competitive Moat:  3/10  — Commoditized office space, no defensible moat vs. IWG/Regus
Growth Potential:  3/10  — Contraction mode; reduced footprint; demand shift to remote work
Risk Level:        High  — Post-bankruptcy reorganization, uncertain future business model
Overall Score:     2.8/10

Recommendation: 🚫 PASS (High Confidence)
```

### 4. Tesla — INVEST (Medium Confidence)

```
Financial Health:  7/10  — Profitable but margins under pressure; price cuts impacting revenue
Competitive Moat:  7/10  — Supercharger network, software OTA, brand; but BYD is closing gap
Growth Potential:  8/10  — FSD, Robotaxi, energy storage (Megapack) are major growth vectors
Risk Level:        Medium — CEO distraction risk, competition from China, valuation sensitivity
Overall Score:     7.5/10

Recommendation: ✅ INVEST (Medium Confidence)
```

### 5. Blockbuster (historical) — PASS

```
Financial Health:  2/10  — Deeply unprofitable at end of life; debt spiral
Competitive Moat:  1/10  — Physical rental model obsoleted by streaming
Growth Potential:  1/10  — Industry in secular decline; no digital pivot
Risk Level:        High  — Existential threat from Netflix and digital distribution
Overall Score:     1.4/10

Recommendation: 🚫 PASS (High Confidence)
```

---

## What I Would Improve With More Time

1. **Parallel research execution** — Run all 6 Tavily searches concurrently (`Promise.all`) rather than sequentially. Would cut research time from ~60s to ~20s. Currently sequential to make SSE step-by-step progress display cleaner.

2. **Structured financial data** — Integrate Polygon.io or Alpha Vantage for raw financial statement data (P/E, EV/EBITDA, revenue CAGR) instead of relying solely on web search summaries. This would make the scoring far more precise.

3. **Company resolution layer** — Map company names to canonical tickers/ISIN before research. Ensures "Google" and "Alphabet" resolve to the same entity and enables direct financial API lookups.

4. **Research caching** — Cache research results in Redis with a 24-hour TTL so repeated queries don't re-run expensive API calls. Would also enable building a company research database.

5. **PDF/shareable reports** — Generate a downloadable PDF of the research report using Puppeteer or React-PDF.

6. **Comparison mode** — Research two companies side-by-side and produce a comparative analysis.

7. **Portfolio tracking** — Let users save INVEST decisions and track whether the agent's calls proved correct over time.

8. **LangSmith tracing** — Add LangSmith for end-to-end observability into the agent's reasoning chain. Critical for debugging and improving prompt quality in production.

9. **Human-in-the-loop checkpoint** — Add a LangGraph interrupt before the final synthesis step where a human analyst can add context or override scores before the recommendation is generated.

10. **Better error recovery** — Implement graceful node-level retry logic (currently a node failure kills the whole pipeline). Use LangGraph's built-in error boundaries.

---

## Bonus: LLM Chat Logs

LLM (Antigravity/Claude) was used as the development partner throughout this build. The full conversation transcript is available in the project as `LLM_CHAT_LOG.md`, covering:

- Architecture planning discussions
- Tech stack selection rationale
- Streaming implementation debugging
- Component design decisions
- Prompt engineering for the investment scoring nodes

See `LLM_CHAT_LOG.md` for the complete development conversation.

---

## License

MIT
