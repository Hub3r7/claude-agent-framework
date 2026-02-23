# Claude Agent Framework

A collection of markdown-defined agent teams for Claude Code. Each team adds structured review chains, tiered escalation, and quality gates to a specific workflow domain. No code to maintain — everything is in `CLAUDE.md` and `.claude/` files.

> **Requires Claude Code.** This framework uses Claude Code's sub-agent system
> (`.claude/agents/*.md` and `CLAUDE.md`). It does not work with other AI tools or IDEs.

## Teams

| Team | Domain | Agents | Use case |
|------|--------|--------|----------|
| [software-development](teams/software-development/) | Software engineering | architect, developer, quality-gate, hunter, defender, test-runner, ops-automation, docs | Building and maintaining software projects |
| [devops-sre](teams/devops-sre/) | Infrastructure & operations | architect, builder, reviewer, monitor, incident, security, docs | IaC, deployment, monitoring, incident response |
| [data-engineering](teams/data-engineering/) | Data pipelines & analytics | architect, builder, quality, analyst, security, optimizer, docs | ETL/ELT, data quality, pipeline development |
| [security-operations](teams/security-operations/) | SOC & threat response | triager, analyst, hunter, responder, forensic, compliance, docs | Threat detection, incident response, compliance |
| [restaurant-cost-optimization](teams/restaurant-cost-optimization/) | Restaurant management | analyst, sourcing, menu-engineer, waste, operations, quality-gate, docs | Food cost, labor, waste, menu optimization |
| [content-marketing](teams/content-marketing/) | Content & editorial | strategist, writer, editor, seo, reviewer, publisher, docs | Blog, social media, newsletters, campaigns |
| [research-analysis](teams/research-analysis/) | Research & synthesis | planner, researcher, analyst, critic, visualizer, docs | Literature review, data analysis, reports |

## Quick start

1. **Pick a team** that matches your workflow domain.

2. **Copy the team files** into your project root:

   ```bash
   # Example: using the software-development team
   TEAM=software-development

   # Download and extract
   curl -sL https://github.com/Hub3r7/claude-agent-framework/archive/refs/heads/main.tar.gz \
     | tar xz --strip-components=3 \
       "claude-agent-framework-main/teams/$TEAM/CLAUDE.md" \
       "claude-agent-framework-main/teams/$TEAM/.claude"

   # Or clone and copy manually
   git clone https://github.com/Hub3r7/claude-agent-framework.git
   cp claude-agent-framework/teams/$TEAM/CLAUDE.md .
   cp -r claude-agent-framework/teams/$TEAM/.claude .
   ```

3. **Open Claude Code** and say:
   ```
   bootstrap this project
   ```

4. **Answer the orchestrator's questions.** It will:
   - Learn about your project/organization/context
   - Fill all `[PROJECT-SPECIFIC]` sections in `CLAUDE.md` and all agent files
   - Generate `.claude/docs/project-context.md` for fast session orientation

5. **Start working.** The orchestrator automatically classifies tasks by tier, routes to the correct agent chain, and enforces quality gates.

## How it works

Every team follows the same core architecture:

**Tiered escalation** — Each task is classified by complexity (Tier 0-4). Simple changes get minimal review. Complex changes get the full agent chain. The depth of review matches the blast radius of the change.

**Quality gates with loop-back** — Review agents issue explicit PASS or FAIL verdicts. FAIL pauses the chain and returns work for fixes. The chain does not advance until PASS is issued. No limit on iterations.

**HANDOFF protocol** — Every agent writes a structured handoff with context for the next agent. The orchestrator follows the tier chain by default but may override routing when needed.

**Bootstrap customization** — Generic `[PROJECT-SPECIFIC]` placeholders are replaced through a structured conversation, not a config file. Agents become specialists in your specific context.

**Agent notes** — Agents accumulate knowledge across sessions through `.agentNotes/`. Notes are subordinate to `CLAUDE.md` (never override rules) but provide working memory that makes agents more effective over time.

## Team structure

Every team directory contains:

```
teams/<team-name>/
  CLAUDE.md                          → Project rules + orchestrator instructions
  .claude/
    agents/
      <agent-1>.md                   → Agent definition with role, constraints, protocols
      <agent-2>.md
      ...
    docs/
      bootstrap-protocol.md          → Bootstrap conversation protocol
      project-context.md             → Session orientation template
```

## Choosing a team

Pick the team closest to your primary workflow:

- **Building software?** → `software-development`
- **Managing infrastructure?** → `devops-sre`
- **Building data pipelines?** → `data-engineering`
- **Running a SOC or security team?** → `security-operations`
- **Optimizing restaurant costs?** → `restaurant-cost-optimization`
- **Creating content?** → `content-marketing`
- **Doing research?** → `research-analysis`

Each team is **completely standalone**. You only need the files from one team — no shared dependencies, no cross-team imports.

## Re-bootstrap

If your project evolves significantly, say "re-bootstrap" and the orchestrator will update the project-specific sections while preserving what still applies.

## Building your own team

Want a team for a domain not listed here? Use any existing team as a template:

1. Copy a team directory
2. Rename agents and adjust roles
3. Adapt the tier system for your workflow
4. Update the bootstrap protocol with relevant discovery questions
5. Keep the core protocols: HANDOFF, PASS/FAIL, knowledge hierarchy, agent notes

The framework is domain-agnostic — the protocols work for any structured workflow where multiple perspectives add value.

## Origin

This started as a personal setup for building [opsbox](https://github.com/Hub3r7/opsbox), a Python CLI tool for IT and security operations. The agent roles, tier boundaries, and loop-back rules were shaped by what actually went wrong during development — not planned upfront. It worked well enough that I extracted it into a standalone framework, then generalized it to non-software domains.

## License

MIT — see [LICENSE](LICENSE).

## Contact

Questions, feedback, or want to contribute? Reach out at **hub3r7@pm.me**.
