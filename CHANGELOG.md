# Changelog

All notable changes to the MCP Server Prompt Generator for Devs will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added

- **feat(prompt-cache):** Cache system for prompt templates to improve performance ([@robsoncombr](https://github.com/robsoncombr))
- **feat(api):** New `list-prompts` tool to discover available prompts ([@robsoncombr](https://github.com/robsoncombr))
- **feat(api):** New `preview-prompt` tool to view templates before using them ([@robsoncombr](https://github.com/robsoncombr))
- **feat(templates):** Dynamic creation and update of prompt templates via MCP protocol ([@robsoncombr](https://github.com/robsoncombr))
- **feat(organization):** Categories system for organizing prompts with metadata ([@robsoncombr](https://github.com/robsoncombr))
- **feat(version-control):** Complete version history tracking for all prompt templates ([@robsoncombr](https://github.com/robsoncombr))
- **feat(version-control):** Tool to view previous versions with `preview-prompt-version` ([@robsoncombr](https://github.com/robsoncombr))
- **feat(version-control):** Tool to restore previous versions with `restore-prompt-version` ([@robsoncombr](https://github.com/robsoncombr))
- **feat(api):** New `list-prompts-by-category` tool for better prompt discoverability ([@robsoncombr](https://github.com/robsoncombr))
- **feat(metadata):** Rich metadata support including categories, descriptions, and versioning ([@robsoncombr](https://github.com/robsoncombr))

### Changed

- **refactor(prompt-tool):** Enhanced prompt loading with caching and metadata extraction ([@robsoncombr](https://github.com/robsoncombr))
- **refactor(mcp):** Improved MCP server implementation with more comprehensive tools ([@robsoncombr](https://github.com/robsoncombr))
- **docs(api):** Better documentation for all available MCP tools ([@robsoncombr](https://github.com/robsoncombr))

## [0.1.2] - 2025-04-15

### Added

- Initial public release
- Basic MCP server implementation
- Support for English and Portuguese development prompts
- Docker containerization for easy deployment

### Fixed

- Path resolution issues in Docker environment
- Encoding issues with special characters in prompts

## [0.1.1] - 2025-03-28

### Added

- Initial Docker support
- Basic prompt templates for dev and dev-pt

### Fixed

- Fixed error handling in template loading

## [0.1.0] - 2025-03-15

### Added

- Initial project setup
- Basic MCP protocol implementation
- Core prompt generation functionality
