---
name: chain-metrics
description: Display chain metrics summary after a completed agent chain. Use when the user asks for cost/token/duration breakdown of the last chain run.
disable-model-invocation: true
allowed-tools: Read
---

# Chain Metrics

Read the metrics template from `.claude/docs/chain-metrics.md`.

Fill the template with data from the agent chain that just completed. For each agent that ran in the chain, report:
- Agent name and model used
- Token count (from agent usage output)
- Duration
- Tool call count
- Verdict (PASS/FAIL or N/A)
- Estimated cost (using the rates from the template)

Add an orchestrator row estimating orchestrator overhead as `tool_calls × 7500` tokens.

Present the filled table to the user.
