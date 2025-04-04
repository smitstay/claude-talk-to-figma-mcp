#!/bin/bash

# Install dependencies
echo "Installing dependencies..."
bun install

# Configure for Claude Desktop
echo "Configuring for Claude Desktop..."
node scripts/configure-claude.js

echo "Configuration completed."
echo "To use the MCP, make sure to start the WebSocket server:"
echo "bun socket" 