import { promises as fs } from "fs";
import path from "path";

// Interface for the prompt result
export interface PromptResult {
  promptContent: string;
  needsConfirmation: boolean;
}

/**
 * Lists the available prompts in the prompts/ directory
 */
async function listAvailablePrompts(): Promise<string[]> {
  try {
    const files = await fs.readdir(path.join(process.cwd(), "prompts"));
    return files
      .filter((file) => file.startsWith("@") && file.endsWith(".md"))
      .map((file) => file.slice(1, -3));
  } catch {
    return [];
  }
}

/**
 * Reads the content of the prompt file
 */
export async function fetchPromptTemplate(promptName = "dev"): Promise<string> {
  const promptPath = path.join(process.cwd(), "prompts", `@${promptName}.md`);

  try {
    return await fs.readFile(promptPath, "utf-8");
  } catch (error) {
    if (error.code === "ENOENT") {
      const availablePrompts = await listAvailablePrompts();
      const promptOptions = availablePrompts.length
        ? `Available prompts: ${availablePrompts.join(", ")}`
        : "No prompts found.";

      throw new Error(`Prompt "${promptName}" not found. ${promptOptions}`);
    }
    throw new Error(`Error loading prompt: ${error.message}`);
  }
}

/**
 * Generates a complete prompt by combining template with task
 */
export async function generatePrompt(
  task: string,
  promptName = "dev"
): Promise<PromptResult> {
  const template = await fetchPromptTemplate(promptName);
  return {
    promptContent: `${template}\n${task}`,
    needsConfirmation: true,
  };
}
