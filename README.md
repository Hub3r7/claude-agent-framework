# Claude Agent Framework

A set of markdown-defined agents for Claude Code that add structured review chains, tiered escalation, and quality gates to your development workflow. No code to maintain — everything is in `CLAUDE.md` and `.claude/` files.

> **Requires Claude Code.** This framework uses Claude Code's sub-agent system
> (`.claude/agents/*.md` and `CLAUDE.md`). It does not work with other AI tools or IDEs.

## What it does

It splits the work that Claude Code normally does in a single context — design, implementation, review, documentation — into separate agents with defined roles. Each agent has a narrow scope, explicit constraints, and a handoff protocol. Review agents can block the chain with a FAIL verdict until issues are resolved.

## Quick start

1. Download or copy these into your project root:
   - `CLAUDE.md` — project rules and orchestrator instructions
   - `.claude/agents/` — all 8 agent definitions
   - `.claude/docs/` — bootstrap protocol and session orientation template

   You can do this manually from the [repository](https://github.com/Hub3r7/claude-agent-framework), or:
   ```
   # Download and extract into current directory
   curl -sL https://github.com/Hub3r7/claude-agent-framework/archive/refs/heads/main.tar.gz \
     | tar xz --strip-components=1 claude-agent-framework-main/CLAUDE.md claude-agent-framework-main/.claude
   ```

2. Open Claude Code and say:
   ```
   bootstrap this project
   ```

3. Answer the orchestrator's questions about your project. It will:
   - Learn your stack, architecture, conventions, and security posture
   - Fill all `[PROJECT-SPECIFIC]` sections in `CLAUDE.md` and all agent files
   - Generate your `.claude/docs/project-context.md` for fast session orientation

4. Start working normally. The orchestrator automatically:
   - Classifies each change by tier (0-4)
   - Routes to the correct agent chain
   - Enforces PASS/FAIL quality gates with loop-back on failure

## Agent team

| Agent | Role | Tier |
|-------|------|------|
| `architect` | Design + chain routing | 2-4 |
| `developer` | Implementation | 1-4 |
| `quality-gate` | Security + architecture review | 1-4 (all code changes) |
| `hunter` | Offensive security / attack surface analysis | 3-4 |
| `defender` | Defensive security / hardening | 3-4 |
| `test-runner` | Test execution and coverage | On request |
| `ops-automation` | Workflow automation | On request |
| `docs` | Documentation (always last) | 0-4 |

## Dev cycle tiers

| Tier | Change type | Chain |
|------|-------------|-------|
| 0 | Typo, doc edit, config label | Direct edit → docs |
| 1 | Bug fix, small tweak, no new files | developer → quality-gate → docs |
| 2 | New feature, refactor | architect → quality-gate → developer → quality-gate → docs |
| 3 | External I/O, integrations, new attack surface | + hunter OR defender |
| 4 | New major component, security-critical, shared code | + hunter AND defender |

The tier system exists to avoid two failure modes: under-reviewing risky changes, and over-reviewing trivial ones. A typo fix does not need 7 agents. A new authentication module does.

**Loop-back protocol:** Every review agent (quality-gate, hunter, defender) issues an explicit PASS or FAIL verdict. FAIL pauses the chain and returns to developer with a numbered remediation list. The chain does not advance until PASS is issued. There is no limit on iterations.

## Key design decisions

**Why markdown instructions instead of programmatic enforcement?**
Text instructions interpreted by an LLM cover edge cases that rigid code cannot anticipate. The model understands the intent behind a rule, not just its literal form. The PASS/FAIL loop-back protocol provides the reliability that pure instruction-following lacks on its own.

**Why a tiered system instead of always running all agents?**
A Tier 4 chain costs 7 agent invocations. That is the right cost for a security-critical change to shared infrastructure. It is the wrong cost for a one-line bug fix. Tiering ensures the depth of review matches the blast radius of the change.

**Why agent notes?**
Agents accumulate project-specific knowledge across sessions through `.agentNotes/` — patterns they have seen, decisions they have made, gotchas they have encountered. Notes are subordinate to `CLAUDE.md` and agent instructions (never override authoritative rules), but they provide working memory that makes agents more effective over time.

**Why a bootstrap protocol?**
Generic agent instructions produce generic results. The bootstrap protocol replaces every `[PROJECT-SPECIFIC]` placeholder with real knowledge about your stack, architecture, and conventions — through a conversation, not a config file. The agents become specialists in your project, not generalists.

## Structure

```
CLAUDE.md                          → Project rules + orchestrator instructions
.claude/agents/
  architect.md                     → Design + chain routing
  developer.md                     → Implementation
  quality-gate.md                  → Security + architecture review
  hunter.md                        → Offensive security
  defender.md                      → Defensive security
  docs.md                          → Documentation
  ops-automation.md                → Workflow automation
  test-runner.md                   → Test execution
.claude/docs/
  project-context.md               → Quick session orientation (template)
  bootstrap-protocol.md            → Full bootstrap conversation protocol
```

## Re-bootstrap

If your project evolves significantly — new language, architecture pivot, major new component area — say "re-bootstrap" and the orchestrator will update the project-specific sections while preserving what still applies.

## Origin

This started as a personal setup for building opsbox, a Python CLI tool for IT and security operations. The agent roles, tier boundaries, and loop-back rules were shaped by what actually went wrong during development — not planned upfront. It worked well enough that I extracted it into a standalone framework.

## License

MIT — see [LICENSE](LICENSE).

## Contact

Questions, feedback, or want to contribute? Reach out at **hub3r7@pm.me**.
