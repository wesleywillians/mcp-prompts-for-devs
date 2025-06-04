import { promises as fs } from "fs";
import path from "path";
import { fetchPromptTemplate, generatePrompt } from "./prompt_tool";

// Mock the fs module
jest.mock("fs", () => ({
  promises: {
    readdir: jest.fn(),
    readFile: jest.fn(),
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

  it("should handle a missing prompts directory", async () => {
    const error = new Error("File not found");
    (error as any).code = "ENOENT";
    (fs.readFile as jest.Mock).mockRejectedValue(error);

    (fs.readdir as jest.Mock).mockRejectedValue(new Error("directory missing"));

    await expect(fetchPromptTemplate("missing")).rejects.toThrow(
      'Prompt "missing" not found. No prompts found.'
    );
  });

  it("should throw a generic error if an unexpected error occurs", async () => {
    // Mock readFile to throw a different error
    const error = new Error("Permission denied");
    (fs.readFile as jest.Mock).mockRejectedValue(error);

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
