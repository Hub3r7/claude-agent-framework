# Bootstrap Protocol — From Generic to Project-Specific

This document defines the bootstrap conversation that the orchestrator (Claude Code) runs
when first setting up the agent framework for a new project.

## Purpose

The framework ships with generic agent instructions containing `[PROJECT-SPECIFIC]`
placeholder sections. The bootstrap protocol replaces those placeholders with concrete,
project-specific rules through a structured conversation with the user.

## When to run

Run bootstrap when:
- Starting a new project with this framework
- `CLAUDE.md` still contains `[PROJECT-SPECIFIC]` placeholders
- The user says "bootstrap", "set up agents", or "configure for this project"

## Bootstrap phases

### Phase 1 — Project Discovery

Ask the user about the project. Cover these topics (adapt phrasing naturally):

1. **What is the project?** — Name, purpose, who is it for, what problem does it solve.
2. **Tech stack** — Language(s), framework(s), runtime, package manager, database (if any).
3. **Architecture** — Monolith vs microservices, directory structure, component model, module/plugin system.
4. **Environment** — How to set up locally, how to run, how to test, virtual environments, CI/CD.
5. **Conventions** — Naming rules, code style, commit conventions, existing patterns.
6. **Security posture** — What is sensitive? Auth model? External integrations? Data handling?
7. **Special principles** — Any project-specific non-negotiables (e.g., operator anonymity, zero-trust, offline-first).

Do NOT ask all 7 at once. Start with 1-3 and let the conversation flow. Ask follow-ups
based on answers. The goal is understanding, not interrogation.

### Phase 2 — Confirmation

Summarize what you learned in a structured format:

```
PROJECT PROFILE
===============
Name:           <name>
Type:           <CLI tool / web app / API service / library / etc.>
Stack:          <language, framework, key deps>
Architecture:   <brief structural description>
Environment:    <how to run, test, build>
Conventions:    <key naming/style rules>
Security:       <key security considerations>
Principles:     <project-specific non-negotiables>
```

Ask: "Does this capture the project correctly? Anything to add or change?"

### Phase 3 — Agent Specialization

Once confirmed, update the following files by replacing `[PROJECT-SPECIFIC]` sections:

1. **`CLAUDE.md`** — Fill in:
   - Project description
   - Architecture section (directory structure, component model)
   - Project-specific principles
   - Language & style
   - Naming conventions
   - Testing (test runner, directory structure, coverage expectations)
   - Environment section
   - What NOT to do (project-specific additions)
   - Current status
   - Response language (user's preferred communication language)

2. **`.claude/agents/architect.md`** — Add:
   - Project-specific review criteria (what to check during design review)
   - Component contract details (if the project has a module/plugin system)

3. **`.claude/agents/developer.md`** — Add:
   - Project-specific implementation rules
   - Framework conventions, file patterns, import rules

4. **`.claude/agents/quality-gate.md`** — Add:
   - Project-specific security review criteria
   - Framework-specific vulnerability patterns (e.g., XSS for web, injection for APIs)

5. **`.claude/agents/hunter.md`** — Add:
   - Project-specific attack surface areas
   - Technology-specific vulnerability classes to watch for

6. **`.claude/agents/defender.md`** — Add:
   - Project-specific defensive review criteria
   - Data integrity, logging, and audit trail expectations

7. **`.claude/agents/docs.md`** — Add:
   - Documentation templates for the project's component type
   - What documents to maintain and their update triggers

8. **`.claude/agents/ops-automation.md`** — Add:
   - Project-specific automation rules and tool paths

9. **`.claude/agents/test-runner.md`** — Add:
   - Test framework, conventions, directory structure, coverage expectations

10. **`.claude/docs/project-context.md`** — Fill in all sections.

### Phase 4 — Verification

After updating all files:
1. Read back each modified file to verify no `[PROJECT-SPECIFIC]` placeholders remain (check both `CLAUDE.md`, all 8 agent files under `.claude/agents/`, AND `.claude/docs/project-context.md`)
2. Verify consistency across files (same architecture description, same conventions)
3. Report to the user:

```
BOOTSTRAP COMPLETE
==================
Updated: CLAUDE.md, 8 agent files, project-context.md
Remaining placeholders: 0
Ready to start development.
```

## Bootstrap principles

- **Listen first, configure second.** Never assume — always ask.
- **Minimal viable specificity.** Don't over-specify. Leave room for the agents to adapt through iteration. Add only what is known now, not what might be needed later.
- **Consistency is king.** The same fact must not be described differently in two files.
- **User approves.** Show the profile before writing. Don't silently customize.
- **Iterative refinement.** Bootstrap doesn't have to be perfect on the first pass. The agents will learn through their notes and the framework will improve through real use.

## Re-bootstrap

If the project evolves significantly (new language, new architecture, major pivot):
- The user can say "re-bootstrap" to run the protocol again
- Previous project-specific content is shown for comparison
- Only changed sections are updated (preserve what still applies)
