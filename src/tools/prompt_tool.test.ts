import { promises as fs } from "fs";
import path from "path";
import {
  fetchPromptTemplate,
  generatePrompt,
  createPromptTemplate,
  updatePromptTemplate,
  getPromptMetadata,
  getPromptVersionHistory,
  restorePromptVersion,
  clearPromptCache,
} from "./prompt_tool";

// Mock the fs module
jest.mock("fs", () => ({
  promises: {
    readdir: jest.fn(),
    readFile: jest.fn(),
    writeFile: jest.fn(),
    mkdir: jest.fn(),
    access: jest.fn(),
    unlink: jest.fn(),
    rm: jest.fn(),
  },
}));

// Store original process.cwd
const originalCwd = process.cwd;

describe("fetchPromptTemplate", () => {
  beforeAll(() => {
    // Mock process.cwd
    process.cwd = jest.fn().mockReturnValue("/mock/path");
  });

  afterAll(() => {
    // Restore process.cwd
    process.cwd = originalCwd;
  });

  beforeEach(() => {
    jest.clearAllMocks();
    clearPromptCache(); // Clear cache between tests
  });

  it("should return the content of the prompt template", async () => {
    const templateContent = "# Test Template\n\nThis is a test template";
    (fs.readFile as jest.Mock).mockResolvedValue(templateContent);

    const result = await fetchPromptTemplate("test");

    expect(fs.readFile).toHaveBeenCalledWith(
      path.join("/mock/path", "prompts", "@test.md"),
      "utf-8"
    );
    expect(result).toBe(templateContent);
  });

  it('should use "dev" as the default prompt name', async () => {
    const templateContent = "# Dev Template\n\nThis is the dev template";
    (fs.readFile as jest.Mock).mockResolvedValue(templateContent);

    const result = await fetchPromptTemplate();

    expect(fs.readFile).toHaveBeenCalledWith(
      path.join("/mock/path", "prompts", "@dev.md"),
      "utf-8"
    );
    expect(result).toBe(templateContent);
  });

  it("should throw an error with available prompts if the prompt is not found", async () => {
    // Mock readFile to throw ENOENT error
    const error = new Error("File not found");
    (error as any).code = "ENOENT";
    (fs.readFile as jest.Mock).mockRejectedValue(error);

    // Mock readdir for the available prompts check
    (fs.readdir as jest.Mock).mockResolvedValue(["@dev.md", "@other.md"]);

    await expect(fetchPromptTemplate("nonexistent")).rejects.toThrow(
      'Prompt "nonexistent" not found. Available prompts: dev, other'
    );
  });

  it("should throw a generic error if an unexpected error occurs", async () => {
    // Mock readFile to throw a different error
    const error = new Error("Permission denied");
    (fs.readFile as jest.Mock).mockRejectedValue(error);
    
    // Need to make sure readdir also fails or returns empty to avoid the available prompts check
    (fs.readdir as jest.Mock).mockResolvedValue([]);

    await expect(fetchPromptTemplate("test")).rejects.toThrow(
      "Error loading prompt: Permission denied"
    );
  });
});

describe("generatePrompt", () => {
  beforeAll(() => {
    // Mock process.cwd
    process.cwd = jest.fn().mockReturnValue("/mock/path");
  });

  afterAll(() => {
    // Restore process.cwd
    process.cwd = originalCwd;
  });

  beforeEach(() => {
    jest.clearAllMocks();
    clearPromptCache(); // Clear cache between tests
  });

  it("should combine template and task", async () => {
    const templateContent = "# Test Template\n\nThis is a test template";
    (fs.readFile as jest.Mock).mockResolvedValue(templateContent);

    const task = "Create a new feature";
    const result = await generatePrompt(task, "test");

    expect(result).toEqual({
      promptContent: `${templateContent}\n${task}`,
      needsConfirmation: true,
    });
  });

  it('should use "dev" as the default prompt name', async () => {
    const templateContent = "# Dev Template\n\nThis is the dev template";
    (fs.readFile as jest.Mock).mockResolvedValue(templateContent);

    const task = "Fix a bug";
    const result = await generatePrompt(task);

    expect(fs.readFile).toHaveBeenCalledWith(
      path.join("/mock/path", "prompts", "@dev.md"),
      "utf-8"
    );
    expect(result).toEqual({
      promptContent: `${templateContent}\n${task}`,
      needsConfirmation: true,
    });
  });
});

describe("Prompt Tools with Version Control", () => {
  beforeAll(() => {
    // Mock process.cwd
    process.cwd = jest.fn().mockReturnValue("/mock/path");
  });

  afterAll(() => {
    // Restore process.cwd
    process.cwd = originalCwd;
  });

  beforeEach(() => {
    jest.clearAllMocks();
    clearPromptCache(); // Clear cache between tests
    
    // Default behavior for access - throw ENOENT for any path
    (fs.access as jest.Mock).mockImplementation(() => {
      const error = new Error("File not found");
      (error as any).code = "ENOENT";
      throw error;
    });
    
    // Default success for mkdir
    (fs.mkdir as jest.Mock).mockResolvedValue(undefined);
    
    // Default success for writeFile
    (fs.writeFile as jest.Mock).mockResolvedValue(undefined);
  });

  test("should create a prompt with version 1", async () => {
    // Setup mocks for createPromptTemplate
    (fs.access as jest.Mock).mockImplementation((path) => {
      // Allow access to the prompts directory but not to the prompt file
      if (path.endsWith("prompts")) {
        return Promise.resolve();
      }
      const error = new Error("File not found");
      (error as any).code = "ENOENT";
      throw error;
    });

    // Create template
    await createPromptTemplate(
      "test-prompt",
      "This is test content",
      {
        category: "Test",
        description: "Test description"
      }
    );
    
    // Verify writeFile was called with correct parameters for the prompt file
    expect(fs.writeFile).toHaveBeenCalledWith(
      expect.stringMatching(/@test-prompt\.md$/),
      expect.stringContaining("This is test content"),
      "utf-8"
    );
    
    // Verify version history was saved - check each call separately
    const calls = (fs.writeFile as jest.Mock).mock.calls;
    const historyCall = calls.find(call => call[0].includes('v1.json'));
    expect(historyCall).toBeDefined();
    expect(historyCall[0]).toMatch(/v1\.json$/);
    expect(historyCall[1]).toContain('"version": 1');
    expect(historyCall[2]).toBe("utf-8");
  });
  
  test("should update prompt and increment version", async () => {
    // Mock readFile for getPromptMetadata
    const initialContent = `---
category: Test
description: Initial description
version: 1
lastModified: 2025-05-08T12:00:00.000Z
---
Initial content`;
    
    (fs.readFile as jest.Mock).mockImplementation((path) => {
      if (path.includes("@test-prompt.md")) {
        return Promise.resolve(initialContent);
      }
      return Promise.resolve("{}");
    });
    
    // Make fs.access succeed for the prompt file
    (fs.access as jest.Mock).mockImplementation((path) => {
      if (path.includes("@test-prompt.md")) {
        return Promise.resolve();
      }
      const error = new Error("File not found");
      (error as any).code = "ENOENT";
      throw error;
    });
    
    // Update the prompt
    await updatePromptTemplate(
      "test-prompt",
      "Updated content",
      { description: "Updated description" }
    );
    
    // Verify writeFile was called for the prompt file
    expect(fs.writeFile).toHaveBeenCalledWith(
      expect.stringMatching(/@test-prompt\.md$/),
      expect.stringContaining("Updated content"),
      "utf-8"
    );
    
    // Check version was incremented to 2 in the content
    expect(fs.writeFile).toHaveBeenCalledWith(
      expect.any(String),
      expect.stringContaining("version: 2"),
      expect.any(String)
    );
  });
  
  test("should save version history when updating", async () => {
    // Mock for readFile to return existing prompt
    const promptContent = `---
category: Test
description: Initial description
version: 1
lastModified: 2025-05-08T12:00:00.000Z
---
Initial content`;
    
    (fs.readFile as jest.Mock).mockImplementation((path) => {
      if (path.includes("@test-prompt.md")) {
        return Promise.resolve(promptContent);
      }
      return Promise.resolve("{}");
    });
    
    // Mock access to succeed for the prompt file
    (fs.access as jest.Mock).mockImplementation((path) => {
      if (path.includes("@test-prompt.md")) {
        return Promise.resolve();
      }
      const error = new Error("File not found");
      (error as any).code = "ENOENT";
      throw error;
    });
    
    // Update prompt
    await updatePromptTemplate("test-prompt", "Updated content");
    
    // Verify history was saved - first writeFile call should be to save history
    const calls = (fs.writeFile as jest.Mock).mock.calls;
    expect(calls.length).toBeGreaterThanOrEqual(1);
    expect(calls[0][0]).toMatch(/history.*test-prompt.*v1\.json$/);
    expect(calls[0][2]).toBe("utf-8");
  });
  
  test("should restore previous version", async () => {
    // Mock for getPromptVersion
    const oldVersionContent = `---
category: Test
description: Old version
version: 1
lastModified: 2025-05-07T12:00:00.000Z
---
Old content`;
    
    // Mock for current version
    const currentVersionContent = `---
category: Test
description: Current version
version: 2
lastModified: 2025-05-08T12:00:00.000Z
---
Current content`;
    
    // Mock history file
    const historyEntry = JSON.stringify({
      version: 1,
      content: oldVersionContent,
      metadata: {
        name: "test-prompt",
        category: "Test",
        description: "Old version",
        version: 1,
        lastModified: "2025-05-07T12:00:00.000Z"
      },
      timestamp: "2025-05-07T12:00:00.000Z"
    });
    
    (fs.readFile as jest.Mock).mockImplementation((path) => {
      if (path.includes("v1.json")) {
        return Promise.resolve(historyEntry);
      }
      if (path.includes("@test-prompt.md")) {
        return Promise.resolve(currentVersionContent);
      }
      return Promise.resolve("{}");
    });
    
    // Mock readdir for getPromptVersionHistory
    (fs.readdir as jest.Mock).mockResolvedValue(["v1.json", "v2.json"]);
    
    // Mock access to succeed for all required files
    (fs.access as jest.Mock).mockResolvedValue(undefined);
    
    // Restore version
    await restorePromptVersion("test-prompt", 1);
    
    // Verify the prompt was updated with old content
    expect(fs.writeFile).toHaveBeenCalledWith(
      expect.stringMatching(/@test-prompt\.md$/),
      expect.stringContaining("Old content"),
      "utf-8"
    );
    
    // Verify version was incremented in the content
    expect(fs.writeFile).toHaveBeenCalledWith(
      expect.any(String),
      expect.stringContaining("version: 3"),
      expect.any(String)
    );
  });
});
