import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import { 
  generatePrompt, 
  listAvailablePrompts, 
  listPromptsByCategory,
  fetchPromptTemplate,
  createPromptTemplate,
  updatePromptTemplate,
  getPromptMetadata,
  getPromptVersionHistory,
  restorePromptVersion,
  getPromptVersion,
  PromptMetadata,
  VersionHistoryEntry
} from "./tools/prompt_tool";

/**
 * MCP Server Prompts Generator for Devs
 * 
 * Enhanced MCP server implementation with comprehensive prompt management capabilities
 * including prompt listing, previewing, creation, categorization, and version control.
 * 
 * @author Wesley Willians (original implementation)
 * @author robsoncombr (https://github.com/robsoncombr) - Added caching, categorization,
 *                      version control, and extended API capabilities
 * @date May 8, 2025
 */

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
      },
      "Generate a prompt by combining a template with your specific task"
    );
    
    // Register tool to list available prompts
    server.tool(
      "list-prompts",
      {},
      async () => {
        const prompts = await listAvailablePrompts();
        return {
          content: [
            {
              type: "text",
              text: `Available prompts: ${prompts.join(", ")}`
            }
          ],
          needsConfirmation: false,
        };
      },
      "List all available prompt templates"
    );
    
    // Register tool to list prompts by category
    server.tool(
      "list-prompts-by-category",
      {},
      async () => {
        const categories = await listPromptsByCategory();
        let resultText = "# Available Prompt Templates by Category\n\n";
        
        for (const [category, prompts] of Object.entries(categories)) {
          resultText += `## ${category}\n\n`;
          
          for (const promptName of prompts) {
            try {
              const metadata = await getPromptMetadata(promptName);
              resultText += `- **${promptName}**: ${metadata.description || 'No description available'} (v${metadata.version || 1})\n`;
            } catch {
              resultText += `- **${promptName}**\n`;
            }
          }
          
          resultText += "\n";
        }
        
        return {
          content: [
            {
              type: "text",
              text: resultText
            }
          ],
          needsConfirmation: false,
        };
      },
      "List all available prompt templates organized by category"
    );
    
    // Register tool to preview prompt templates
    server.tool(
      "preview-prompt",
      {
        promptName: z
          .string()
          .describe("ID of the prompt to preview"),
      },
      async ({ promptName }) => {
        try {
          const templateContent = await fetchPromptTemplate(promptName);
          const metadata = await getPromptMetadata(promptName);
          
          let resultText = `## Preview of prompt: ${promptName} (v${metadata.version || 1})\n\n`;
          resultText += `**Category:** ${metadata.category}\n`;
          resultText += `**Description:** ${metadata.description || 'No description available'}\n\n`;
          resultText += `### Template Content\n\n${templateContent.replace(/^---[\s\S]*?---\s*\n/, '')}`;
          
          return {
            content: [
              {
                type: "text",
                text: resultText
              }
            ],
            needsConfirmation: false,
          };
        } catch (error) {
          return {
            content: [
              {
                type: "text",
                text: `Error: ${error.message}`
              }
            ],
            needsConfirmation: false,
          };
        }
      },
      "Preview the content of a specific prompt template"
    );

    // Register tool to create new prompt templates
    server.tool(
      "create-prompt",
      {
        promptName: z
          .string()
          .describe("ID of the new prompt to create"),
        content: z
          .string()
          .describe("Content of the prompt template"),
        category: z
          .string()
          .optional()
          .describe("Category for the prompt (default is 'Uncategorized')"),
        description: z
          .string()
          .optional()
          .describe("Description of what the prompt is for"),
      },
      async ({ promptName, content, category, description }) => {
        try {
          const metadata: Partial<PromptMetadata> = {
            category: category || "Uncategorized",
            description: description || ""
          };
          
          await createPromptTemplate(promptName, content, metadata);
          return {
            content: [
              {
                type: "text",
                text: `✅ Successfully created prompt template: ${promptName} (v1)`
              }
            ],
            needsConfirmation: false,
          };
        } catch (error) {
          return {
            content: [
              {
                type: "text",
                text: `Error creating prompt template: ${error.message}`
              }
            ],
            needsConfirmation: false,
          };
        }
      },
      "Create a new prompt template with customizable content and metadata"
    );

    // Register tool to update existing prompt templates
    server.tool(
      "update-prompt",
      {
        promptName: z
          .string()
          .describe("ID of the prompt to update"),
        content: z
          .string()
          .describe("New content for the prompt template"),
        category: z
          .string()
          .optional()
          .describe("Category for the prompt (leave blank to keep existing)"),
        description: z
          .string()
          .optional()
          .describe("Description of what the prompt is for (leave blank to keep existing)"),
      },
      async ({ promptName, content, category, description }) => {
        try {
          const metadata: Partial<PromptMetadata> = {};
          
          if (category !== undefined) {
            metadata.category = category;
          }
          
          if (description !== undefined) {
            metadata.description = description;
          }
          
          await updatePromptTemplate(promptName, content, metadata);
          
          // Get updated metadata to show the new version
          const updatedMetadata = await getPromptMetadata(promptName);
          
          return {
            content: [
              {
                type: "text",
                text: `✅ Successfully updated prompt template: ${promptName} (v${updatedMetadata.version || 1})`
              }
            ],
            needsConfirmation: false,
          };
        } catch (error) {
          return {
            content: [
              {
                type: "text",
                text: `Error updating prompt template: ${error.message}`
              }
            ],
            needsConfirmation: false,
          };
        }
      },
      "Update an existing prompt template with new content and/or metadata"
    );
    
    // Register tool to list version history for a prompt
    server.tool(
      "list-prompt-versions",
      {
        promptName: z
          .string()
          .describe("ID of the prompt to get history for"),
      },
      async ({ promptName }) => {
        try {
          const history = await getPromptVersionHistory(promptName);
          
          if (history.length === 0) {
            return {
              content: [
                {
                  type: "text",
                  text: `No version history found for prompt "${promptName}"`
                }
              ],
              needsConfirmation: false,
            };
          }
          
          let resultText = `# Version History for ${promptName}\n\n`;
          
          for (const version of history) {
            const date = new Date(version.timestamp).toLocaleString();
            resultText += `## Version ${version.version} (${date})\n`;
            resultText += `- **Category:** ${version.metadata.category}\n`;
            resultText += `- **Description:** ${version.metadata.description || 'No description'}\n\n`;
          }
          
          return {
            content: [
              {
                type: "text",
                text: resultText
              }
            ],
            needsConfirmation: false,
          };
        } catch (error) {
          return {
            content: [
              {
                type: "text",
                text: `Error retrieving version history: ${error.message}`
              }
            ],
            needsConfirmation: false,
          };
        }
      },
      "List all versions of a specific prompt template"
    );
    
    // Register tool to preview a specific prompt version
    server.tool(
      "preview-prompt-version",
      {
        promptName: z
          .string()
          .describe("ID of the prompt"),
        version: z
          .number()
          .describe("Version number to preview"),
      },
      async ({ promptName, version }) => {
        try {
          const versionContent = await getPromptVersion(promptName, version);
          
          // Get version history to access metadata
          const history = await getPromptVersionHistory(promptName);
          const versionEntry = history.find(entry => entry.version === version);
          
          if (!versionEntry) {
            return {
              content: [
                {
                  type: "text",
                  text: `Version ${version} of prompt "${promptName}" not found`
                }
              ],
              needsConfirmation: false,
            };
          }
          
          const date = new Date(versionEntry.timestamp).toLocaleString();
          let resultText = `## Preview of ${promptName} (v${version}, ${date})\n\n`;
          resultText += `**Category:** ${versionEntry.metadata.category}\n`;
          resultText += `**Description:** ${versionEntry.metadata.description || 'No description available'}\n\n`;
          resultText += `### Template Content\n\n${versionContent.replace(/^---[\s\S]*?---\s*\n/, '')}`;
          
          return {
            content: [
              {
                type: "text",
                text: resultText
              }
            ],
            needsConfirmation: false,
          };
        } catch (error) {
          return {
            content: [
              {
                type: "text",
                text: `Error: ${error.message}`
              }
            ],
            needsConfirmation: false,
          };
        }
      },
      "Preview a specific version of a prompt template"
    );
    
    // Register tool to restore a previous prompt version
    server.tool(
      "restore-prompt-version",
      {
        promptName: z
          .string()
          .describe("ID of the prompt"),
        version: z
          .number()
          .describe("Version number to restore"),
      },
      async ({ promptName, version }) => {
        try {
          await restorePromptVersion(promptName, version);
          
          // Get updated metadata to show the new version
          const metadata = await getPromptMetadata(promptName);
          
          return {
            content: [
              {
                type: "text",
                text: `✅ Successfully restored version ${version} of prompt "${promptName}". New version is v${metadata.version || 1}`
              }
            ],
            needsConfirmation: false,
          };
        } catch (error) {
          return {
            content: [
              {
                type: "text",
                text: `Error: ${error.message}`
              }
            ],
            needsConfirmation: false,
          };
        }
      },
      "Restore a previous version of a prompt template"
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
