import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import { generatePrompt } from "./tools/prompt_tool";

/**
 * Main function to initialize and start the MCP server
 * This server provides optimized prompts for developers to use with LLMs
 */
async function main() {
  try {
    // Create a new instance of McpServer with detailed information
    const server = new McpServer({
      name: "MCP Server Prompts Generator for Devs",
      version: "0.1.0",
      description:
        "MCP server specialized in generating optimized prompts for developers, combining pre-defined templates with specific tasks to improve efficiency during software development.",
      documentation:
        "Use this server to get structured prompts that optimize communication with language models during software development. Example usage: 'Use the use-prompt tool with the prompt dev with the task: \"Implement an authentication system using JWT in a Node.js API\". Use the result returned from this tool as context and start development.'",
    });

    // Register tool to generate prompt
    server.tool(
      "use-prompt",
      {
        task: z
          .string()
          .describe(
            "Description of the task to be concatenated to the template"
          ),
        promptName: z
          .string()
          .optional()
          .describe("ID of the prompt to be used (default is 'dev')"),
      },
      async ({ task, promptName }) => {
        // Generate the complete prompt using the function from prompt_tool module
        const result = await generatePrompt(task, promptName);
        return {
          content: [
            {
              type: "text",
              text: result.promptContent,
            },
          ],
          needsConfirmation: result.needsConfirmation,
        };
      }
    );

    // Configure transport
    const transport = new StdioServerTransport();
    await server.connect(transport);
  } catch (error) {
    console.error("Error during initialization:", error);
    process.exit(1);
  }
}

// Start the server
main().catch((error) => {
  console.error("Fatal error in main():", error);
  process.exit(1);
});
