#!/bin/bash

# Create .cursor directory if it doesn't exist
mkdir -p .cursor

# Instalar dependencias
echo "Instalando dependencias..."
bun install

# Configurar para Claude Desktop
echo "Configurando para Claude Desktop..."
node scripts/configure-claude.js

echo "Configuración completada."
echo "Para usar el MCP, asegúrate de iniciar el servidor WebSocket:"
echo "bun socket"

# Create mcp.json with the current directory path
echo "{
  \"mcpServers\": {
    \"TalkToFigma\": {
      \"command\": \"bunx\",
      \"args\": [
        \"cursor-talk-to-figma-mcp@latest\"
      ]
    }
  }
}" > .cursor/mcp.json 