import * as fs from 'fs/promises';
import * as path from 'path';
import ignore, { Ignore } from 'ignore';
import * as crypto from 'crypto';
import * as vscode from 'vscode';

interface ChangeTracking {
  remote_files: { [key: string]: string };
  local_files: { [key: string]: string };
}

async function loadIgnorePatterns(directory: string): Promise<Ignore> {
  const ig = ignore();
  const gitignorePath = path.join(directory, '.gitignore');
  const aiignorePath = path.join(directory, '.aiignore');
  let err: any;
  try {
    const gitignoreContent = await fs.readFile(gitignorePath, 'utf-8');
    ig.add(gitignoreContent);
  } catch (e) {
    // Ignore if .gitignore doesn't exist
    console.error(e);
    err = e;
  }

  try {
    const aiignoreContent = await fs.readFile(aiignorePath, 'utf-8');
    ig.add(aiignoreContent);
  } catch (e) {
    // Ignore if .aiignore doesn't exist
    console.error(e);
    err = e;
  }

  return ig;
}

function detectLanguage(filePath: string): string {
  const extensionMap: { [key: string]: string } = {
    '.py': 'python',
    '.php': 'php',
    '.js': 'javascript',
    '.json': 'json',
    '.html': 'html',
    '.css': 'css',
    '.java': 'java',
    '.cpp': 'cpp',
    '.c': 'c',
    '.cs': 'csharp',
    '.rb': 'ruby',
    '.go': 'go',
    '.ts': 'typescript',
    '.sql': 'sql',
    '.sh': 'bash',
    '.md': 'markdown',
    '.xml': 'xml',
    '.yaml': 'yaml',
    '.yml': 'yaml'
  };
  return extensionMap[path.extname(filePath).toLowerCase()] || 'text';
}

async function computeFileHash(filePath: string): Promise<string | null> {
  try {
    const content = await fs.readFile(filePath);
    return crypto.createHash('sha256').update(content).digest('hex');
  } catch (e) {
    return null;
  }
}

function estimateContentSize(content: string, filePath: string, language: string): number {
  const markdownContent = `## File: ${filePath}\n\n\`\`\`${language}\n${content}\n\`\`\`\n\n`;
  return Buffer.byteLength(markdownContent, 'utf-8');
}

async function* walkDirectory(directory: string, ig: Ignore): AsyncGenerator<string, void, undefined> {
  const entries = await fs.readdir(directory, { withFileTypes: true });
  for (const entry of entries.sort((a, b) => a.name.localeCompare(b.name))) {
    if(entry.name.startsWith('.')) continue;
    const fullPath = path.join(directory, entry.name);
    const relativePath = path.relative(directory, fullPath);
    if (ig.ignores(relativePath)) continue;
    if (entry.isFile()) {
      yield fullPath;
    } else if (entry.isDirectory()) {
      yield* walkDirectory(fullPath, ig);
    }
  }
}

async function generateChangeTracking(directory: string, outputDirectory: string, ig: Ignore, idx: number = 0): Promise<ChangeTracking> {
  const tracking: ChangeTracking = { remote_files: {}, local_files: {} };

  // Hash remote files
  for await (const filePath of walkDirectory(directory, ig)) {
    const relativePath = path.relative(directory, filePath);
    const fileHash = await computeFileHash(filePath);
    if (fileHash) {
      tracking.remote_files[relativePath] = fileHash;
    }
  }

  // Hash local files
  const localFiles = (await fs.readdir(outputDirectory)).filter(f => f.startsWith('directory_contents_') && f.endsWith('.md'));
  for (const file of localFiles.sort()) {
    const filePath = path.join(outputDirectory, file);
    const fileHash = await computeFileHash(filePath);
    if (fileHash) {
      tracking.local_files[file] = fileHash;
    }
  }

  // Save change_tracking.json
  const trackingFile = path.join(outputDirectory, `change_tracking-${idx}.json`);
  await fs.writeFile(trackingFile, JSON.stringify(tracking, null, 2), 'utf-8');
  return tracking;
}

export async function processDirectory(workspaceRoot: string): Promise<number> {
  const config = vscode.workspace.getConfiguration('aiCrawler');
  let directory = config.get<string>('directory', '');
  let outputDirectory = config.get<string>('outputDirectory', '');

  if (!directory || !outputDirectory) {
    throw new Error("Configuration must specify 'aiCrawler.directory' and 'aiCrawler.outputDirectory'.");
  }

  outputDirectory = path.isAbsolute(outputDirectory) ? outputDirectory : path.join(workspaceRoot, outputDirectory);

  // Ensure output directory exists
  await fs.mkdir(outputDirectory, { recursive: true });
  const maxSize = 5242880; // 5 MB
  let currentSize = 0;
  let fileCount = 1;
  let outputFile = path.join(outputDirectory, `directory_contents_${fileCount}.md`);
  let fileBuffer: string[] = [];
  
  const directories = directory.split(",");
  for (let c = 0; c < directories.length; c++) {
    directory = directories[c];
    let header = `# Directory Contents: ${path.basename(directory)} (Part ${fileCount})\n\n`;
    currentSize += Buffer.byteLength(header, 'utf-8');

    // Resolve paths relative to workspace root if not absolute
    directory = path.isAbsolute(directory) ? directory : path.join(workspaceRoot, directory);
    const ig = await loadIgnorePatterns(directory);
    for await (const filePath of walkDirectory(directory, ig)) {
      const relativePath = path.relative(directory, filePath);
      const language = detectLanguage(filePath);
      let content: string;
      try {
        content = await fs.readFile(filePath, 'utf-8');
      } catch (e) {
        content = 'Unable to read file contents (binary or unsupported encoding).';
      }

      const contentSize = estimateContentSize(content, relativePath, language);

      if (currentSize + contentSize > maxSize) {
        await fs.writeFile(outputFile, header + fileBuffer.join(''), 'utf-8');
        fileBuffer = [];
        currentSize = Buffer.byteLength(header, 'utf-8');
        fileCount++;
        outputFile = path.join(outputDirectory, `directory_contents_${fileCount}.md`);
        header = `# Directory Contents: ${path.basename(directory)} (Part ${fileCount})\n\n`;
      }

      fileBuffer.push(`## File: ${relativePath}\n\n\`\`\`${language}\n${content}\n\`\`\`\n\n`);
      currentSize += contentSize;
    }

    if (fileBuffer.length > 0) {
      await fs.writeFile(outputFile, header + fileBuffer.join(''), 'utf-8');
    }
    await generateChangeTracking(directory, outputDirectory, ig, c);

  }
  return fileCount;
}