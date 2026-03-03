#!/bin/bash
# Claude Code hook: block writes/edits/git-adds to sensitive files.
# Exit 0 = allow, exit 2 = block (message on stderr shown to Claude).
# No jq dependency — uses grep for pattern matching.

INPUT=$(cat)

# Extract file_path from tool_input (Write/Edit)
FILE_PATH=$(echo "$INPUT" | grep -oP '"file_path"\s*:\s*"\K[^"]+' | head -1)

# Extract command from tool_input (Bash)
COMMAND=$(echo "$INPUT" | grep -oP '"command"\s*:\s*"\K[^"]+' | head -1)

# Sensitive file patterns
SECRETS_RE='\.(env|pem|key|p12|pfx|jks|keystore|secret|wts)$|\.env\.|credentials\.json|secrets\.json|id_rsa|id_ed25519'

# Check Write/Edit file_path
if [ -n "$FILE_PATH" ]; then
  if echo "$FILE_PATH" | grep -qiE "$SECRETS_RE"; then
    # Allow .env.example
    if echo "$FILE_PATH" | grep -qiE '\.env\.example$'; then
      exit 0
    fi
    echo "BLOCKED: Cannot write to sensitive file: $FILE_PATH" >&2
    exit 2
  fi
fi

# Check Bash commands that stage sensitive files (git add)
if [ -n "$COMMAND" ]; then
  if echo "$COMMAND" | grep -qE 'git\s+add'; then
    for token in $COMMAND; do
      if echo "$token" | grep -qiE "$SECRETS_RE"; then
        # Allow .env.example
        if echo "$token" | grep -qiE '\.env\.example$'; then
          continue
        fi
        echo "BLOCKED: Cannot stage sensitive file: $token" >&2
        exit 2
      fi
    done
    # Block blanket staging that could catch secrets
    if echo "$COMMAND" | grep -qE 'git\s+add\s+(-A|\.\s|--all)'; then
      echo "BLOCKED: Use explicit file names with git add instead of -A/--all/." >&2
      exit 2
    fi
  fi
fi

exit 0
