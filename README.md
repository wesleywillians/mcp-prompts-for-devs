# MCP Server Prompt Generator For Devs Guide

## What is the MCP Server Prompt Generator For Devs?

The MCP Server Prompt Generator For Devs is a server that implements the Model Context Protocol (MCP) specialized in providing ready-to-use prompts for developers. Its main objective is to facilitate communication between LLMs (like Claude) and developers, allowing the generation of standardized and optimized prompts for software development tasks.

## Main Features

- Generation of prompts combining pre-defined templates with specific tasks
- Templates optimized for software development
- Available via Docker for easy execution
- Compatible with any MCP client (Claude Desktop, Cursor, VSCode)

## How to Run the Server using Docker

The simplest way to use the MCP Server Prompt Generator For Devs is through Docker:

```bash
docker run --rm -i wesleywillians/mcp-prompts-for-devs
```

This command:

- Downloads the Docker image (if not yet locally available)
- Starts the server in interactive mode (-i)
- Automatically removes the container after termination (--rm)

## Development

### Running Tests

To run the tests for this project:

```bash
npm test
```

This will execute all unit tests using Jest. The tests are located alongside the source files with the `.test.ts` extension.

### Available Scripts

- `npm run build` - Compiles the TypeScript code to JavaScript
- `npm run start` - Starts the MCP server
- `npm run dev` - Starts the server in development mode using ts-node
- `npm run test` - Runs the Jest test suite

## Available Prompts

The server comes with pre-configured prompt templates:

- **dev**: A complete prompt for software development in English, with detailed instructions to solve programming problems, following a methodical and structured approach.
- **dev-pt**: The same development prompt as above, but in Portuguese (Português).

## How to Register the MCP Server on Different Platforms

### 1. Registration on Claude Desktop

1. Open Claude Desktop
2. Click on the Claude menu (in the upper left corner)
3. Select "Settings..."
4. Click on "Developer" in the side menu
5. Click on "Edit Config"
6. Add the configuration for the MCP server:

```json
{
  "mcpServers": {
    "mcp-prompts-for-devs": {
      "command": "docker",
      "args": ["run", "--rm", "-i", "wesleywillians/mcp-prompts-for-devs"]
    }
  }
}
```

7. Save the file and restart Claude Desktop
8. Verify if the server is available by clicking on the hammer icon in the input field

### 2. Registration on Cursor

1. Open the Cursor IDE
2. Access the "Settings" menu (or use Ctrl+,)
3. Look for "MCP Servers" in the settings
4. Click on "Edit in settings.json"
5. Add to the configuration file:

```json
"mcp.servers": {
  "mcp-prompts-for-devs": {
    "command": "docker",
    "args": ["run", "--rm", "-i", "wesleywillians/mcp-prompts-for-devs"]
  }
}
```

6. Save the file
7. Restart Cursor

### 3. Registration on VSCode

1. Install the "Claude AI Assistant" extension for VSCode
2. Open VSCode settings (Ctrl+,)
3. Search for "Claude > Mcp: Servers" 
4. Click on "Edit in settings.json"
5. Add to the configuration file:

```json
"claude.mcp.servers": {
  "mcp-prompts-for-devs": {
    "command": "docker",
    "args": ["run", "--rm", "-i", "wesleywillians/mcp-prompts-for-devs"]
  }
}
```

6. Save the file
7. Restart VSCode

#### Tip: Quick Setup for VSCode

You can quickly set up the configuration by running this command in your terminal:

```bash
cat > ~/.vscode/settings.json << 'EOL'
{                             
    "claude.mcp.servers": {
        "mcp-prompts-for-devs": {
            "command": "docker",
            "args": ["run", "--rm", "-i", "wesleywillians/mcp-prompts-for-devs"]
        }
    }
}
EOL
```

This command creates the necessary settings file with the proper configuration. Note that this will overwrite your existing VSCode settings file if it exists, so you may want to merge the settings manually if you have other custom configurations.

## How to Use the Prompt Tool

After configuring the MCP server on your preferred platform, you can use the "use-prompt" tool as follows:

### Usage Format

```
Use the use-prompt tool with the prompt {prompt-name} with the task:
"{task definition}".

Use the result returned from this tool as context and start development.
```

Where:
- **{prompt-name}**: The name of the prompt to be used (e.g., "dev" for English or "dev-pt" for Portuguese)
- **{task definition}**: The detailed description of the task you want to perform

### Usage Example

```
Use the use-prompt tool with the prompt dev with the task:
"Implement an authentication system using JWT in a Node.js API".

Use the result returned from this tool as context and start development.
```

When you submit this instruction:

1. The LLM recognizes the need to call the "use-prompt" tool
2. The tool combines the "dev" template with the specific task
3. The complete prompt is returned to the LLM
4. The LLM uses this prompt as context for its response
5. The LLM begins development following the prompt guidelines
