# Chain Metrics Template

After every completed chain, the orchestrator produces this summary table.

```
| Agent        | Model  | Tokens  | Duration | Tools | Verdict | Est. Cost |
|--------------|--------|---------|----------|-------|---------|-----------|
| strategist   | opus   |   21 307 |    26.3s |     9 | PASS    |   €0.18   |
| editor       | sonnet |    8 420 |    12.1s |     5 | PASS    |   €0.04   |
| orchestrator | opus   | ~150 000 |       —  |    20 | —       |  ~€1.28   |
| **Total**    |        | ~179 727 |    38.4s |    34 |         |**~€1.50** |
```

## How to fill

**Agent rows:** `total_tokens`, `duration_ms` (as seconds), `tool_uses` from each agent's usage output.

**Orchestrator row:** estimate tokens as `tool_calls × 7500` (each turn sends full conversation history + extended thinking as output tokens). Duration is not available from within the session.

**Est. Cost (EUR):** blended rate per model (80% input / 20% output estimate), converted at $1 ≈ €0.95:
- Opus: €8.55/MTok — Sonnet: €5.13/MTok — Haiku: €1.71/MTok

Formula: `tokens / 1_000_000 × blended_rate`. Final row sums all costs. This is a rough estimate — actual costs depend on context length and thinking token usage.
