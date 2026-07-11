# 🤖 7-Agent AI Swarm Agency — n8n Workflow

A lightweight, working **multi-agent swarm** workflow for n8n. Send any business or engineering objective, and 7 AI agents will collaborate in parallel to produce a comprehensive master project proposal.

## Architecture

```
                          ┌─ Product Designer ──┐
                          ├─ Lead Developer ─────┤
Webhook ─→ CEO Delegator ─┼─ Security Auditor ──┼─→ Merge ─→ CEO Synthesizer ─→ Report ─→ Response
                          ├─ QA Engineer ────────┤
                          ├─ Technical Writer ───┤
                          └─ Project Manager ────┘
```

**Tier 1:** CEO Delegator decomposes the objective into 6 mandates  
**Tier 2:** 6 specialist agents work **in parallel**  
**Tier 3:** CEO Synthesizer merges everything into a cohesive report  

## Setup Instructions

### 1. Import the Workflow

1. Open your n8n instance (e.g., `https://your-instance.app.n8n.cloud`)
2. Go to **Workflows** → **Import from File**
3. Select `n8n_7_agent_swarm.json`
4. The workflow will appear with all nodes and connections pre-configured

### 2. Configure API Credentials

The workflow uses a **single shared model node** (`Gemini 2.5 Flash (Shared)`).

1. Click on the **"Gemini 2.5 Flash (Shared)"** node
2. Under **Credential**, click **Create New**
3. Enter your **Google AI Studio API Key** (get one free at [aistudio.google.com](https://aistudio.google.com/))
4. Save

> **💡 Tip:** Gemini 2.5 Flash Lite is extremely cheap — running the full 7-agent swarm costs **< $0.005 per run**. However, the Free Tier is capped at ~15-20 RPM, which may cause failures. **Pay-As-You-Go** raises the limit to 1,000+ RPM.

#### Alternative: Use OpenAI Instead

If you prefer OpenAI:
1. Delete the `Gemini 2.5 Flash (Shared)` node
2. Add a new `OpenAI Chat Model` node
3. Set model to `gpt-4o-mini`
4. Connect it to all 8 chain nodes via the `ai_languageModel` connection

### 3. Activate the Workflow

1. Toggle the workflow to **Active** (top-right switch)
2. The webhook endpoint will become live

## Usage

### Webhook Endpoint

```
POST https://your-instance.app.n8n.cloud/webhook/ai-swarm-agency
Content-Type: application/json

{
  "objective": "Design a secure, serverless URL Shortener with analytics dashboard"
}
```

### Using curl

```bash
curl -X POST https://your-instance.app.n8n.cloud/webhook/ai-swarm-agency \
  -H "Content-Type: application/json" \
  -d '{"objective": "Build a SaaS platform for AI-powered resume screening"}'
```

### Using the test script

```bash
node test_swarm.js
```

## Response Format

```json
{
  "success": true,
  "report": {
    "title": "Master Project Proposal — 7-Agent AI Swarm",
    "generated_at": "2026-06-03T12:00:00.000Z",
    "agent_count": 7,
    "word_count": 4500,
    "sections_count": 10,
    "sections": [
      { "title": "EXECUTIVE SUMMARY", "body": "..." },
      { "title": "PRODUCT DESIGN & USER EXPERIENCE", "body": "..." },
      { "title": "TECHNICAL ARCHITECTURE", "body": "..." },
      { "title": "SECURITY ASSESSMENT", "body": "..." },
      { "title": "QUALITY ASSURANCE PLAN", "body": "..." },
      { "title": "DOCUMENTATION PLAN", "body": "..." },
      { "title": "PROJECT MANAGEMENT & TIMELINE", "body": "..." },
      { "title": "CROSS-CUTTING CONCERNS", "body": "..." },
      { "title": "RISKS & MITIGATIONS", "body": "..." },
      { "title": "RECOMMENDED NEXT STEPS", "body": "..." }
    ],
    "code_blocks": [],
    "raw_markdown": "..."
  }
}
```

## Agent Details

| Agent | Role | Key Deliverables |
|:---|:---|:---|
| **CEO (Delegator)** | Orchestrator | Decomposes objective into 6 mandates |
| **Product Designer** | UX/UI & Product | Personas, user journeys, feature specs, design tokens |
| **Lead Developer** | Architecture | Tech stack, DB schema, API contracts, auth strategy |
| **Security Auditor** | Security | STRIDE threats, OWASP checklist, encryption plan |
| **QA Engineer** | Quality | Test cases, automation plan, performance benchmarks |
| **Technical Writer** | Documentation | API docs, user guide, onboarding, changelog |
| **Project Manager** | Coordination | Sprint backlog, risk register, timeline, DoD |
| **CEO (Synthesizer)** | Aggregator | Merges all outputs into board-ready proposal |

## Troubleshooting

| Issue | Solution |
|:---|:---|
| Empty response / timeout | Upgrade to Pay-As-You-Go on Google AI Studio (Free Tier is limited to ~15 RPM) |
| 429 Rate Limit errors | Reduce parallel agents or add retry logic |
| Webhook not responding | Make sure the workflow is **Active** |
| Missing credentials error | Ensure the Gemini API credential is configured and linked to the shared model node |

## Cost Estimate

| Model | Cost per Run (approx.) |
|:---|:---|
| Gemini 2.5 Flash Lite | ~$0.003 |
| GPT-4o-mini | ~$0.02 |
| GPT-4o | ~$0.15 |
