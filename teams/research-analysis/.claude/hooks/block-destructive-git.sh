#!/bin/bash
# PreToolUse hook: block destructive git operations unless explicitly approved.
# Reads JSON from stdin (Claude Code hook contract).

INPUT=$(cat)
TOOL=$(echo "$INPUT" | jq -r '.tool_name // empty')
COMMAND=$(echo "$INPUT" | jq -r '.tool_input.command // empty')

if [ "$TOOL" != "Bash" ]; then
  exit 0
fi

if echo "$COMMAND" | grep -qE "(git\s+push\s+--force|git\s+reset\s+--hard|git\s+clean\s+-f|git\s+checkout\s+\.\s*$|git\s+branch\s+-D)"; then
  echo "Blocked: destructive git operation requires explicit user approval." >&2
  exit 2
fi

exit 0
