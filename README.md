# AI Crawler

## Overview

AI Crawler is a Visual Studio Code extension designed to help developers quickly document their project directory by generating markdown files that detail the file structure and code contents. These markdown files can be uploaded to a chatbot (like Grok) to enable interactive discussions about your project, making it easier to get insights, debug, or explain your codebase.

When you need to describe your project directory quickly, AI Crawler automates the process by:

- Crawling a specified directory while respecting `.gitignore` and `.aiignore` patterns.
- Generating markdown files with file paths and their contents, formatted with appropriate syntax highlighting.
- Splitting large outputs into multiple markdown files (each under 5MB) for compatibility with chatbots.
- Creating a `change_tracking.json` file to track file hashes for change detection.

## Features

- **Directory Crawling**: Scans a specified directory and includes all files, excluding those in `.gitignore` or `.aiignore`.
- **Markdown Generation**: Creates markdown files with file paths and code contents, using proper syntax highlighting for various languages (e.g., Python, JavaScript, TypeScript, etc.).
- **File Size Management**: Automatically splits output into multiple markdown files if the content exceeds 5MB, ensuring compatibility with chatbot upload limits.
- **Change Tracking**: Generates a `change_tracking.json` file to track file hashes, helping identify changes in the codebase.
- **Configurable**: Allows customization of input and output directories via VS Code settings.

## Installation

1. **Download or Build the Extension**:
   - Either download the `.vsix` file from the VS Code Marketplace (once published) or build it from source.
   - To build from source:
     - Clone or download the repository.
     - Run `npm install` to install dependencies.
     - Run `npm run compile` to compile TypeScript to JavaScript.
     - Package the extension with `vsce package` to generate a `.vsix` file (requires `@vscode/vsce` installed globally: `npm install -g @vscode/vsce`).

2. **Install in VS Code**:
   - Open VS Code and go to the Extensions view (`Ctrl+Shift+X` or `Cmd+Shift+X`).
   - Click the three dots (`...`) and select **Install from VSIX**.
   - Choose the `ai-crawler-0.0.1.vsix` file and install.

3. **Configure Settings**:
   - Open VS Code settings (`Ctrl+,` or `Cmd+,`).
   - Search for `aiCrawler` and set:
     - `aiCrawler.directory`: The directory to crawl (e.g., `src` or `/path/to/project`).
     - `aiCrawler.outputDirectory`: The directory for output markdown files (e.g., `output` or `/path/to/output`).

## Usage

1. **Open a Workspace**:
   - Ensure you have a workspace open in VS Code (open a folder containing your project).

2. **Run the Crawl Command**:
   - Open the Command Palette (`Ctrl+Shift+P` or `Cmd+Shift+P`).
   - Type and select `AI Crawler: Crawl Directory`.
   - The extension will:
     - Crawl the specified directory.
     - Generate markdown files (e.g., `directory_contents_1.md`, `directory_contents_2.md`, etc.) in the output directory.
     - Create a `change_tracking.json` file to track file hashes.
     - Display a notification with the number of markdown files generated.

3. **Upload to Chatbot**:
   - Take the generated markdown files from the output directory.
   - Upload them to your chatbot (e.g., Grok on grok.com or the X app).
   - Use the chatbot to discuss your project, ask questions about the code, or get debugging help.

## Example Output

For a project directory with a file `src/index.js`, the output markdown might look like:

```markdown
# Directory Contents: src (Part 1)

## File: index.js

\```javascript
console.log("Hello, World!");
\```
```

## Requirements

- Node.js (for building the extension).
- VS Code version 1.75.0 or higher.
- A workspace folder open in VS Code.
- Write permissions for the output directory and read permissions for the source directory.

## Development

To contribute or modify the extension:

1. Clone the repository.
2. Install dependencies: `npm install`.
3. Compile TypeScript: `npm run compile`.
4. Test in VS Code by pressing `F5` to launch the Extension Development Host.
5. Package for distribution: `vsce package`.

## Troubleshooting

- **Missing Configuration**: Ensure `aiCrawler.directory` and `aiCrawler.outputDirectory` are set in VS Code settings.
- **Permission Issues**: Verify read/write permissions for the input and output directories.
- **Large Files**: Binary files or files with unsupported encodings will have a placeholder message in the markdown output.
- **Dependencies**: If `npm install` fails, try `npm cache clean --force` and reinstall.

## License

MIT License

## Contributing

Contributions are welcome! Please submit issues or pull requests to the repository.
