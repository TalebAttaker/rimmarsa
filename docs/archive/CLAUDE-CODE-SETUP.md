# Claude Code Integration Setup

This document describes the integrations configured for Claude Code to work seamlessly with your development environment.

## ✅ Configured Integrations

### 1. **Supabase MCP Server** (Connected)
- **Status**: ✓ Connected
- **Type**: HTTP MCP Server
- **Scope**: User-level (available in all projects)
- **Features**: Database, Docs, Account, Debugging, Development, Functions, Branching, Storage
- **Project Reference**: wmnugqjjizsgusbeqyyt

**How to verify:**
```bash
claude mcp list
```

### 2. **Vercel CLI** (Configured)
- **Status**: ✓ Authenticated
- **Account**: tasynmym-2033
- **Token**: Stored in `~/.bashrc_claude`
- **Projects**: 7 projects accessible
  - rimmarsa (https://www.rimmarsa.com)
  - marketplace
  - telebac
  - And 4 others

**How to use:**
```bash
# List projects
vercel projects ls

# List deployments
vercel ls

# Deploy
vercel deploy
```

### 3. **GitHub CLI** (Authenticated)
- **Status**: ✓ Logged in
- **Account**: taharou7-max
- **Repository**: TalebAttaker/rimmarsa
- **Protocol**: HTTPS
- **Scopes**: repo, workflow, gist, read:org

**How to use:**
```bash
# Check status
gh auth status

# List repositories
gh repo list

# View current repo
gh repo view
```

## 📁 Configuration Files

### `/home/taleb/.claude.json`
Contains Claude Code global and project-specific settings, including:
- MCP server configurations
- Project settings
- User preferences

### `/home/taleb/.bashrc_claude`
Environment variables for authentication:
```bash
export VERCEL_TOKEN="EOggoXTM5MUWBeesRGNpXWz9"
export SUPABASE_ACCESS_TOKEN="sbp_v0_e53a3b6d2b927f5a9941aacc8a0ce059df79c013"
```

This file is automatically sourced by `~/.bashrc` on terminal startup.

### `/home/taleb/.config/gh/hosts.yml`
GitHub CLI authentication configuration.

## 🚀 Using Claude Code from Browser

When you connect to Claude Code from the browser, it will automatically have access to:

1. **Supabase Database** - All MCP tools for database operations:
   - `mcp__supabase__list_tables`
   - `mcp__supabase__execute_sql`
   - `mcp__supabase__apply_migration`
   - `mcp__supabase__get_logs`
   - `mcp__supabase__get_advisors`
   - And many more...

2. **Vercel Deployments** - Via environment variable:
   ```bash
   vercel-auth <command> --token="$VERCEL_TOKEN"
   # Or just use vercel commands with VERCEL_TOKEN in environment
   ```

3. **GitHub Repository** - Via gh CLI:
   ```bash
   gh repo view
   gh pr create
   gh issue list
   ```

## 🔧 Testing Connections

Run these commands to verify everything is working:

```bash
# Test Supabase MCP
claude mcp list

# Test Vercel
vercel projects ls

# Test GitHub
gh auth status
gh repo view
```

## 📝 Common Commands

### Supabase Operations (via MCP)
Claude can directly call MCP tools like:
- List tables: `mcp__supabase__list_tables`
- Execute SQL: `mcp__supabase__execute_sql`
- Apply migrations: `mcp__supabase__apply_migration`

### Vercel Operations
```bash
# List deployments
vercel ls

# Deploy to production
vercel --prod

# Get deployment logs
vercel logs <deployment-url>
```

### GitHub Operations
```bash
# Create pull request
gh pr create

# View repository
gh repo view

# Check workflow status
gh run list
```

## 🔐 Security Notes

- All authentication tokens are stored locally
- Tokens are in plain text files (secure your system accordingly)
- MCP connection is HTTP-based with secure endpoint
- GitHub uses personal access token with limited scopes
- Vercel token has project-level access

## 🆘 Troubleshooting

### MCP Server Not Connected
```bash
claude mcp list
# Should show: supabase: ... - ✓ Connected
```

If not connected, re-add:
```bash
claude mcp add --scope user --transport http supabase "https://mcp.supabase.com/mcp?project_ref=wmnugqjjizsgusbeqyyt&features=docs%2Caccount%2Cdatabase%2Cdebugging%2Cdevelopment%2Cfunctions%2Cbranching%2Cstorage"
```

### Vercel Not Authenticated
```bash
source ~/.bashrc_claude
vercel whoami
```

### GitHub Not Authenticated
```bash
gh auth login
```

## 📚 Additional Resources

- [Claude Code Documentation](https://docs.claude.com/claude-code)
- [Supabase MCP Server](https://supabase.com/docs/guides/ai/mcp)
- [Vercel CLI Documentation](https://vercel.com/docs/cli)
- [GitHub CLI Documentation](https://cli.github.com/manual/)
