# MCP Configuration for Rimmarsa Project

This document explains how to configure the Supabase MCP server for the Rimmarsa project.

## Supabase Project Details

- **Project Name:** rimmarsa
- **Access Token:** `sbp_v0_e53a3b6d2b927f5a9941aacc8a0ce059df79c013`

## MCP Server Configuration

### Understanding MCP with Multiple Projects

You now have **two Supabase projects**:
1. **telebac** - Your existing project
2. **rimmarsa** - Your new project

Each project needs its own MCP server configuration with its own Supabase access token.

### Configuration Options

#### Option 1: Manual Token Switching (Simple but Manual)

Keep one MCP server configuration and manually change the token when switching projects.

**Claude Code Settings (claude_desktop_config.json):**
```json
{
  "mcpServers": {
    "supabase": {
      "command": "npx",
      "args": [
        "-y",
        "@supabase/mcp-server-supabase@latest"
      ],
      "env": {
        "SUPABASE_ACCESS_TOKEN": "YOUR_CURRENT_PROJECT_TOKEN"
      }
    }
  }
}
```

**When working on rimmarsa:** Set token to `sbp_v0_e53a3b6d2b927f5a9941aacc8a0ce059df79c013`
**When working on telebac:** Switch back to telebac's token

#### Option 2: Multiple MCP Servers (Recommended)

Configure two separate MCP servers with different names.

**Claude Code Settings (claude_desktop_config.json):**
```json
{
  "mcpServers": {
    "supabase-telebac": {
      "command": "npx",
      "args": [
        "-y",
        "@supabase/mcp-server-supabase@latest"
      ],
      "env": {
        "SUPABASE_ACCESS_TOKEN": "YOUR_TELEBAC_TOKEN"
      }
    },
    "supabase-rimmarsa": {
      "command": "npx",
      "args": [
        "-y",
        "@supabase/mcp-server-supabase@latest"
      ],
      "env": {
        "SUPABASE_ACCESS_TOKEN": "sbp_v0_e53a3b6d2b927f5a9941aacc8a0ce059df79c013"
      }
    }
  }
}
```

This way, both MCP servers are available simultaneously, and the tools will be prefixed:
- `mcp__supabase-telebac__*` (for telebac tools)
- `mcp__supabase-rimmarsa__*` (for rimmarsa tools)

### Where to Find Claude Code Settings

**Linux:**
```bash
~/.config/Claude/claude_desktop_config.json
```

**macOS:**
```bash
~/Library/Application Support/Claude/claude_desktop_config.json
```

**Windows:**
```
%APPDATA%\Claude\claude_desktop_config.json
```

### How to Apply Changes

1. Edit the `claude_desktop_config.json` file
2. Add or update the MCP server configuration
3. **Restart Claude Code** for changes to take effect

### Verifying MCP Connection

After restarting Claude Code, you should be able to use commands like:
- `mcp__supabase__list_tables` (if using Option 1)
- `mcp__supabase-rimmarsa__list_tables` (if using Option 2)

## Environment Variables

Create a `.env.local` file in your project with:

```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=YOUR_SUPABASE_PROJECT_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY=YOUR_SUPABASE_ANON_KEY
SUPABASE_SERVICE_ROLE_KEY=YOUR_SUPABASE_SERVICE_ROLE_KEY
SUPABASE_ACCESS_TOKEN=sbp_v0_e53a3b6d2b927f5a9941aacc8a0ce059df79c013
```

## Switching Between Projects

### If Using Option 1 (Manual Switching):
1. Edit `claude_desktop_config.json`
2. Change `SUPABASE_ACCESS_TOKEN` to the project you want to work on
3. Restart Claude Code
4. Open the project directory: `cd /home/taleb/rimmarsa` or `cd /home/taleb/telebac`

### If Using Option 2 (Multiple Servers - Recommended):
1. No need to edit config
2. Just tell Claude which project you're working on
3. Claude will use the appropriate MCP server tools
4. Switch directories: `cd /home/taleb/rimmarsa` or `cd /home/taleb/telebac`

## Security Notes

⚠️ **IMPORTANT:**
- Never commit `.env.local` or files containing tokens to Git
- The `.gitignore` file is configured to exclude these files
- Access tokens grant full access to your Supabase project

## Need Help?

If you encounter issues:
1. Check that Claude Code has been restarted after config changes
2. Verify the token is correct
3. Ensure you're in the correct project directory
4. Check Claude Code logs for MCP connection errors
