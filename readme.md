# Claude Talk to Figma MCP

A Model Context Protocol (MCP) plugin that allows Claude Desktop to interact directly with Figma, enabling powerful AI-assisted design capabilities.

> **Important**: This project is based on [cursor-talk-to-figma-mcp](https://github.com/sonnylazuardi/cursor-talk-to-figma-mcp) by Sonny Lazuardi. It has been adapted to work with Claude Desktop instead of Cursor. The original implementation and main credit belongs to Sonny Lazuardi ❤️

## 🚀 Features

- **Native Claude Integration**: Allows Claude to communicate with Figma through the Model Context Protocol (MCP)
- **Powerful Commands**: Manipulate objects in Figma, get information, create and modify elements
- **Bidirectional Communication**: Real-time WebSocket channel between Claude and Figma
- **Fluid Experience**: Design with AI as your assistant, accelerating creative workflows
- **Text Scanning**: Identify and manipulate text nodes within Figma documents

## 📋 Prerequisites

- [Claude Desktop](https://claude.ai) installed
- [Figma](https://figma.com) account
- [Bun](https://bun.sh) v1.0.0 or higher
- [Cursor Talk to Figma MCP Plugin](https://www.figma.com/community/plugin/1485687494525374295/cursor-talk-to-figma-mcp-plugin) installed in Figma

## ⚙️ Installation

1. Clone this repository:
   ```bash
   git clone https://github.com/arinspunk/claude-talk-to-figma-mcp.git
   cd claude-talk-to-figma-mcp
   ```

2. Install dependencies:
   ```bash
   bun install
   ```

3. Build the project:
   ```bash
   bun run build
   ```

4. Configure the plugin in Claude Desktop:
   ```bash
   bun run configure-claude
   ```
   Restart Claude Desktop if it was open.

## 🔌 Usage

### Complete Workflow

To use Claude with Figma, follow these steps in order:

1. **Start the WebSocket server**:
   ```bash
   bun socket
   ```
   Verify it's running with `http://localhost:3055/status`

2. **Install the Figma plugin**:
   Install the [Cursor Talk to Figma MCP Plugin](https://www.figma.com/community/plugin/1485687494525374295/cursor-talk-to-figma-mcp-plugin) from the Figma Community.

3. **Connect the plugin to the server**:
   Open the plugin in Figma and enter port 3055.

4. **Select the MCP in Claude Desktop**:
   Open Claude Desktop and select "ClaudeTalkToFigma" from the MCPs selector.

5. **Ready to use!** Now you can send commands to Figma from Claude.

The following diagram illustrates the integration architecture:

```
+----------------+         +------------------+         +---------------+
|                |         |                  |         |               |
| Claude Desktop |<------->|  WebSocket Srv  |<------->| Figma Plugin  |
|   (AI Agent)   |  MCP    |  (Port 3055)    |         |  (UI Plugin)  |
|                |         |                  |         |               |
+----------------+         +------------------+         +---------------+
```

### Starting the WebSocket Server

```bash
bun socket
```

The WebSocket server will start on port 3055 by default. You can verify the status by accessing `http://localhost:3055/status`.

### Installing the Figma Plugin

1. Install the [Cursor Talk to Figma MCP Plugin](https://www.figma.com/community/plugin/1485687494525374295/cursor-talk-to-figma-mcp-plugin) from the Figma Community.
2. The plugin will appear in your plugins list in Figma.

> **Note**: This project originally included a custom Figma plugin, but we now use the official plugin from Figma Community which provides the same functionality. The original plugin has been archived in this repository for reference.

## ⚡ Claude Desktop Configuration

For "ClaudeTalkToFigma" to appear in the list of available MCPs in Claude Desktop, follow these steps:

1. **Run the configuration script**:
   ```bash
   bun run configure-claude
   ```
   
   This script does the following:
   
   - Locates the Claude Desktop configuration file:
     - On macOS: `~/Library/Application Support/Claude/claude_desktop_config.json`
     - On Windows: `%APPDATA%\Claude\claude_desktop_config.json`
   
   - Creates a backup of the existing configuration file
   
   - Modifies or creates the configuration file to include "ClaudeTalkToFigma" in the list of MCPs
   
   - Configures the command that Claude Desktop should execute to start the MCP

2. **Restart Claude Desktop**:
   If Claude Desktop was open during configuration, you must close and reopen it for the changes to take effect.

3. **Verify the configuration**:
   If the MCP doesn't appear in the list after restarting Claude Desktop, you can verify that the configuration was applied correctly:
   
   - Open the configuration file manually:
     - macOS: `~/Library/Application Support/Claude/claude_desktop_config.json`
     - Windows: `%APPDATA%\Claude\claude_desktop_config.json`
   
   - Check that there's a `mcpServers` section with an entry for `ClaudeTalkToFigma`
   
   - It should look like this:
     ```json
     {
       "mcpServers": {
         "ClaudeTalkToFigma": {
           "command": "npx",
           "args": ["claude-talk-to-figma-mcp@latest"]
         }
       }
     }
     ```

### Connecting Claude to Figma

1. Open the Cursor Talk to Figma MCP Plugin in Figma from the plugins menu
2. Enter port 3055 (or the custom port if you've changed the configuration)
3. Click "Connect"
4. Once connected, you'll see "Connected to Claude MCP server"
5. In Claude Desktop, select "ClaudeTalkToFigma" from the list of available MCPs

## 🛠️ Available Commands

Claude can execute a wide variety of commands in Figma:

- **Get Information**
  - View current document information
  - Get selection details
  - Explore specific node properties

- **Create Elements**
  - Create rectangles, frames, and texts
  - Create component instances
  - Clone existing nodes

- **Modify Elements**
  - Change fill and stroke colors
  - Modify size and position
  - Edit text content
  - Adjust corner radius

- **Advanced Manipulation**
  - Scan text nodes
  - Apply batch modifications
  - Export nodes as images

## 🔍 Usage Examples

### Get Document Information

In Claude:
```
Can you show me information about my current Figma document?
```

### Create a Rectangle

In Claude:
```
Create a red rectangle of 200x200 pixels at position x:100, y:100
```

### Modify Selected Text

In Claude:
```
Change the text of the selected element to "New Title"
```

### Scan and Replace Text

In Claude:
```
Find all texts containing "Lorem Ipsum" and replace them with "Real Content"
```

## 🐛 Troubleshooting

If you encounter problems, check the following common issues:

### Common Issues

- **Connection Error**: Make sure the WebSocket server is running with `npx claude-talk-to-figma-mcp-socket`
- **Plugin Not Appearing**: Verify that you've correctly installed the plugin from Figma Community
- **Claude Can't Find the MCP**: Make sure you've run `bun run configure-claude` and restarted Claude Desktop
- **Claude Not Responding**: Confirm you've selected "ClaudeTalkToFigma" in the MCPs menu
- **Execution Errors**: Check the Figma development console for detailed messages

## 🧪 Testing

To run the integration tests:

```bash
bun run test
```

For more details about testing, see [TESTING.md](TESTING.md).

## 🤝 Contributions

Contributions are welcome. Please follow these steps:

1. Fork the repository
2. Create a branch for your feature (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is under the MIT License - see the [LICENSE](LICENSE) file for details.

## 👥 Authors

- **Xúlio Zé** - *Adaptation for Claude* - [GitHub](https://github.com/arinspunk)
- **Sonny Lazuardi** - *Original Cursor implementation* - [GitHub](https://github.com/sonnylazuardi)

## 🙏 Acknowledgments

- Anthropic team for Claude and the Model Context Protocol
- Figma community for their excellent plugin API
- Sonny Lazuardi for the original Cursor Talk to Figma MCP implementation
- Bun team for providing a fast JavaScript runtime 