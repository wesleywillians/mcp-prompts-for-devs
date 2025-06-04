import { promises as fs } from "fs";
import path from "path";

/**
 * MCP Server Prompt Generator for Devs
 * 
 * Enhanced prompt tool implementation with caching, categorization, 
 * metadata, and version control support
 * 
 * @author Wesley Willians (original implementation)
 * @author robsoncombr (https://github.com/robsoncombr) - Added caching, metadata, 
 *                      categories, and version control features
 * @date May 8, 2025
 */

// Interface for the prompt result
export interface PromptResult {
  promptContent: string;
  needsConfirmation: boolean;
}

// Interface for prompt metadata
export interface PromptMetadata {
  name: string;
  category: string;
  description: string;
  version?: number;
  lastModified?: Date;
}

// Interface for version history entry
export interface VersionHistoryEntry {
  version: number;
  content: string;
  metadata: PromptMetadata;
  timestamp: Date;
}

// Cache for storing prompt templates
const promptCache: Record<string, string> = {};

// Cache for storing prompt metadata
const metadataCache: Record<string, PromptMetadata> = {};

/**
 * Lists the available prompts in the prompts/ directory
 */
export async function listAvailablePrompts(): Promise<string[]> {
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
 * Lists all prompts with their categories
 */
export async function listPromptsByCategory(): Promise<Record<string, string[]>> {
  const prompts = await listAvailablePrompts();
  const categories: Record<string, string[]> = {};
  
  for (const promptName of prompts) {
    let metadata: PromptMetadata;
    try {
      metadata = await getPromptMetadata(promptName);
    } catch {
      // If metadata can't be read, use "Uncategorized"
      metadata = {
        name: promptName,
        category: "Uncategorized",
        description: "",
      };
    }
    
    if (!categories[metadata.category]) {
      categories[metadata.category] = [];
    }
    
    categories[metadata.category].push(promptName);
  }
  
  return categories;
}

/**
 * Gets metadata for a specific prompt
 */
export async function getPromptMetadata(promptName: string): Promise<PromptMetadata> {
  // Check if metadata is already in cache
  if (metadataCache[promptName]) {
    return metadataCache[promptName];
  }
  
  // Try to read metadata from the first few lines of the prompt file
  const promptContent = await fetchPromptTemplate(promptName);
  const metadataSection = extractMetadataSection(promptContent);
  
  if (metadataSection) {
    const metadata = parseMetadata(metadataSection, promptName);
    metadataCache[promptName] = metadata;
    return metadata;
  }
  
  // If no metadata found, return default
  const defaultMetadata: PromptMetadata = {
    name: promptName,
    category: "Uncategorized",
    description: "",
    version: 1
  };
  
  metadataCache[promptName] = defaultMetadata;
  return defaultMetadata;
}

/**
 * Extract metadata section from prompt content
 * The metadata is expected to be in YAML-like format at the beginning of the file:
 * ---
 * category: Development
 * description: A prompt for general development tasks
 * ---
 */
function extractMetadataSection(content: string): string | null {
  const metadataRegex = /^---\s*\n([\s\S]*?)\n---\s*\n/;
  const match = content.match(metadataRegex);
  return match ? match[1] : null;
}

/**
 * Parse metadata from the extracted section
 */
function parseMetadata(section: string, promptName: string): PromptMetadata {
  const metadata: PromptMetadata = {
    name: promptName,
    category: "Uncategorized",
    description: "",
    version: 1
  };
  
  const lines = section.split("\n");
  
  for (const line of lines) {
    const [key, value] = line.split(":").map(part => part.trim());
    
    if (key && value) {
      switch(key.toLowerCase()) {
        case 'category':
          metadata.category = value;
          break;
        case 'description':
          metadata.description = value;
          break;
        case 'version':
          metadata.version = parseInt(value, 10);
          break;
      }
    }
  }
  
  return metadata;
}

/**
 * Reads the content of the prompt file
 * Uses cache when available to improve performance
 */
export async function fetchPromptTemplate(promptName = "dev"): Promise<string> {
  // Check if prompt is already in cache
  if (promptCache[promptName]) {
    return promptCache[promptName];
  }

  const promptPath = path.join(process.cwd(), "prompts", `@${promptName}.md`);

  try {
    const promptContent = await fs.readFile(promptPath, "utf-8");
    // Store in cache for future use
    promptCache[promptName] = promptContent;
    return promptContent;
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
 * Ensures the version history directory exists
 */
async function ensureVersionHistoryDir(promptName: string): Promise<string> {
  const historyDir = path.join(process.cwd(), "prompts", "history", promptName);
  await fs.mkdir(historyDir, { recursive: true });
  return historyDir;
}

/**
 * Saves a version of the prompt to the version history
 */
async function saveToVersionHistory(
  promptName: string,
  content: string,
  metadata: PromptMetadata
): Promise<number> {
  const historyDir = await ensureVersionHistoryDir(promptName);
  const version = metadata.version || 1;
  
  const historyEntry: VersionHistoryEntry = {
    version,
    content,
    metadata: { ...metadata },
    timestamp: new Date()
  };
  
  const historyFilePath = path.join(historyDir, `v${version}.json`);
  await fs.writeFile(
    historyFilePath,
    JSON.stringify(historyEntry, null, 2),
    'utf-8'
  );
  
  return version;
}

/**
 * Gets all versions of a prompt template
 */
export async function getPromptVersionHistory(promptName: string): Promise<VersionHistoryEntry[]> {
  try {
    const historyDir = path.join(process.cwd(), "prompts", "history", promptName);
    const files = await fs.readdir(historyDir);
    
    const versionFiles = files
      .filter(file => file.match(/^v\d+\.json$/))
      .sort((a, b) => {
        const versionA = parseInt(a.match(/^v(\d+)\.json$/)[1], 10);
        const versionB = parseInt(b.match(/^v(\d+)\.json$/)[1], 10);
        return versionB - versionA; // Sort descending
      });
      
    const history: VersionHistoryEntry[] = [];
    
    for (const file of versionFiles) {
      const filePath = path.join(historyDir, file);
      const content = await fs.readFile(filePath, 'utf-8');
      history.push(JSON.parse(content));
    }
    
    return history;
  } catch (error) {
    if (error.code === 'ENOENT') {
      return [];
    }
    throw error;
  }
}

/**
 * Gets a specific version of a prompt template
 */
export async function getPromptVersion(promptName: string, version: number): Promise<string> {
  try {
    const historyFilePath = path.join(
      process.cwd(),
      "prompts",
      "history",
      promptName,
      `v${version}.json`
    );
    
    const content = await fs.readFile(historyFilePath, 'utf-8');
    const historyEntry: VersionHistoryEntry = JSON.parse(content);
    
    return historyEntry.content;
  } catch (error) {
    throw new Error(`Version ${version} of prompt "${promptName}" not found`);
  }
}

/**
 * Restores a previous version of a prompt
 */
export async function restorePromptVersion(promptName: string, version: number): Promise<boolean> {
  try {
    // Get the content of the specified version
    const versionContent = await getPromptVersion(promptName, version);
    
    // Get metadata from the historical version
    const historyFilePath = path.join(
      process.cwd(),
      "prompts",
      "history",
      promptName,
      `v${version}.json`
    );
    
    const historyContent = await fs.readFile(historyFilePath, 'utf-8');
    const historyEntry: VersionHistoryEntry = JSON.parse(historyContent);
    
    // Get current metadata to determine next version number
    let currentMetadata: PromptMetadata;
    try {
      currentMetadata = await getPromptMetadata(promptName);
    } catch {
      currentMetadata = {
        name: promptName,
        category: "Uncategorized",
        description: "",
        version: 1
      };
    }
    
    // Create restored metadata with incremented version
    const restoredMetadata: PromptMetadata = {
      ...historyEntry.metadata,
      version: (currentMetadata.version || 0) + 1,
      lastModified: new Date()
    };
    
    // Update the prompt with the restored content and metadata
    await updatePromptTemplate(promptName, versionContent, restoredMetadata);
    
    return true;
  } catch (error) {
    throw new Error(`Failed to restore version ${version} of prompt "${promptName}": ${error.message}`);
  }
}

/**
 * Creates a new prompt template and saves it to the prompts directory
 */
export async function createPromptTemplate(
  promptName: string, 
  content: string,
  metadata?: Partial<PromptMetadata>
): Promise<boolean> {
  // Validate prompt name
  if (!/^[a-zA-Z0-9-_]+$/.test(promptName)) {
    throw new Error("Prompt name can only contain letters, numbers, hyphens and underscores");
  }
  
  // Check if prompt directory exists, create if not
  const promptsDir = path.join(process.cwd(), "prompts");
  try {
    await fs.access(promptsDir);
  } catch {
    await fs.mkdir(promptsDir, { recursive: true });
  }
  
  const promptPath = path.join(promptsDir, `@${promptName}.md`);
  
  // Check if prompt already exists
  try {
    await fs.access(promptPath);
    throw new Error(`Prompt "${promptName}" already exists`);
  } catch (error) {
    // File doesn't exist, which is what we want for creation
    if (error.code !== 'ENOENT') {
      throw error;
    }
  }
  
  // Create metadata with version 1
  const fullMetadata: PromptMetadata = {
    name: promptName,
    category: metadata?.category || "Uncategorized",
    description: metadata?.description || "",
    version: 1,
    lastModified: new Date()
  };
  
  // Add metadata to the content
  const metadataString = generateMetadataSection(fullMetadata);
  const finalContent = `${metadataString}\n${content}`;
  
  // Write the new prompt file
  await fs.writeFile(promptPath, finalContent, 'utf-8');
  
  // Save to version history
  await saveToVersionHistory(promptName, finalContent, fullMetadata);
  
  // Update cache
  promptCache[promptName] = finalContent;
  metadataCache[promptName] = fullMetadata;
  
  return true;
}

/**
 * Generate metadata section in YAML format
 */
function generateMetadataSection(metadata: PromptMetadata): string {
  return `---
category: ${metadata.category}
description: ${metadata.description}
version: ${metadata.version || 1}
lastModified: ${metadata.lastModified?.toISOString() || new Date().toISOString()}
---`;
}

/**
 * Updates an existing prompt template
 */
export async function updatePromptTemplate(
  promptName: string,
  content: string,
  metadata?: Partial<PromptMetadata>
): Promise<boolean> {
  const promptPath = path.join(process.cwd(), "prompts", `@${promptName}.md`);
  
  // Check if prompt exists
  try {
    await fs.access(promptPath);
  } catch {
    throw new Error(`Prompt "${promptName}" does not exist`);
  }
  
  // Get existing metadata
  let existingMetadata: PromptMetadata;
  try {
    existingMetadata = await getPromptMetadata(promptName);
  } catch {
    existingMetadata = {
      name: promptName,
      category: "Uncategorized",
      description: "",
      version: 0
    };
  }
  
  // Increment version number
  const newVersion = (existingMetadata.version || 0) + 1;
  
  // Update metadata
  const updatedMetadata: PromptMetadata = {
    ...existingMetadata,
    ...metadata,
    name: promptName,
    version: newVersion,
    lastModified: new Date()
  };
  
  // Read existing content before modifying
  const existingContent = await fs.readFile(promptPath, 'utf-8');
  
  // Save current version to history before updating
  await saveToVersionHistory(
    promptName,
    existingContent,
    existingMetadata
  );
  
  // Remove existing metadata section if present
  const contentWithoutMetadata = content.replace(/^---[\s\S]*?---\s*\n/, '');
  
  // Generate new metadata section
  const metadataSection = generateMetadataSection(updatedMetadata);
  
  // Combine metadata with content
  const finalContent = `${metadataSection}\n${contentWithoutMetadata}`;
  
  // Update the prompt file
  await fs.writeFile(promptPath, finalContent, 'utf-8');
  
  // Update caches
  promptCache[promptName] = finalContent;
  metadataCache[promptName] = updatedMetadata;
  
  return true;
}

/**
 * Generates a complete prompt by combining template with task
 */
export async function generatePrompt(
  task: string,
  promptName = "dev"
): Promise<PromptResult> {
  const template = await fetchPromptTemplate(promptName);
  
  // Remove metadata section before combining with task
  const templateWithoutMetadata = template.replace(/^---[\s\S]*?---\s*\n/, '');
  
  return {
    promptContent: `${templateWithoutMetadata}\n${task}`,
    needsConfirmation: true,
  };
}

/**
 * Clears the prompt cache
 * Useful for development and testing purposes
 */
export function clearPromptCache(): void {
  Object.keys(promptCache).forEach(key => {
    delete promptCache[key];
  });
  
  Object.keys(metadataCache).forEach(key => {
    delete metadataCache[key];
  });
}
