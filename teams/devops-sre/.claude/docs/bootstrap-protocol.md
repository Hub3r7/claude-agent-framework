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

1. **What is the project?** — Name, purpose, what infrastructure is managed, who operates it.
2. **Cloud providers** — AWS, GCP, Azure, on-prem, hybrid? Which services are used?
3. **IaC tools** — Terraform, Ansible, Pulumi, CloudFormation, Helm? Versions?
4. **Deployment targets** — Kubernetes, ECS, VMs, serverless, bare metal?
5. **CI/CD** — Pipeline tools, deployment strategy (blue-green, canary, rolling), environments.
6. **Monitoring stack** — Prometheus, Datadog, CloudWatch, Grafana, PagerDuty? SLO framework?
7. **Security posture** — Compliance requirements (SOC2, ISO, PCI, HIPAA), secrets management, IAM model.
8. **Incident process** — Severity classification, escalation paths, on-call rotation, postmortem culture.
9. **Conventions** — Naming rules, tagging strategy, module structure, environment isolation.

Do NOT ask all 9 at once. Start with 1-3 and let the conversation flow. Ask follow-ups
based on answers. The goal is understanding, not interrogation.

### Phase 2 — Confirmation

Summarize what you learned in a structured format:

```
PROJECT PROFILE
===============
Name:           <name>
Type:           <infrastructure platform / deployment system / monitoring setup / etc.>
Cloud:          <providers and key services>
IaC:            <tools and versions>
Deployment:     <targets and strategy>
CI/CD:          <pipeline tools>
Monitoring:     <observability stack>
Security:       <compliance frameworks, secrets management>
Incidents:      <classification, escalation, postmortem>
Conventions:    <key naming/tagging/structure rules>
```

Ask: "Does this capture the project correctly? Anything to add or change?"

### Phase 3 — Agent Specialization

Once confirmed, update the following files by replacing `[PROJECT-SPECIFIC]` sections:

1. **`CLAUDE.md`** — Fill in:
   - Project description
   - Architecture section (infrastructure topology, environments)
   - Project-specific principles
   - Language & style (IaC conventions)
   - Naming conventions (resource naming, tagging)
   - Testing (IaC validation, plan review)
   - Environment section (tools, versions, access)
   - What NOT to do (project-specific prohibitions)
   - Current status
   - Response language

2. **`.claude/agents/architect.md`** — Add project-specific infrastructure review criteria
3. **`.claude/agents/builder.md`** — Add IaC conventions, tool-specific patterns
4. **`.claude/agents/reviewer.md`** — Add cloud provider best practices, tool-specific validation rules
5. **`.claude/agents/monitor.md`** — Add monitoring stack details, SLO targets, alerting conventions
6. **`.claude/agents/incident.md`** — Add severity classification, escalation paths, postmortem template
7. **`.claude/agents/security.md`** — Add compliance frameworks, secrets management tools, security conventions
8. **`.claude/agents/docs.md`** — Add documentation templates, runbook format
9. **`.claude/docs/project-context.md`** — Fill in all sections

### Phase 4 — Verification

After updating all files:
1. Read back each modified file to verify no `[PROJECT-SPECIFIC]` placeholders remain (check `CLAUDE.md`, all 7 agent files under `.claude/agents/`, AND `.claude/docs/project-context.md`)
2. Verify consistency across files (same infrastructure description, same conventions)
3. Report to the user:

```
BOOTSTRAP COMPLETE
==================
Updated: CLAUDE.md, 7 agent files, project-context.md
Remaining placeholders: 0
Ready to start work.
```

## Bootstrap principles

- **Listen first, configure second.** Never assume — always ask.
- **Minimal viable specificity.** Don't over-specify. Leave room for the agents to adapt.
- **Consistency is king.** The same fact must not be described differently in two files.
- **User approves.** Show the profile before writing. Don't silently customize.
- **Iterative refinement.** Bootstrap doesn't have to be perfect on the first pass.

## Re-bootstrap

If the project evolves significantly (new cloud provider, new deployment target, major pivot):
- The user can say "re-bootstrap" to run the protocol again
- Previous project-specific content is shown for comparison
- Only changed sections are updated (preserve what still applies)
