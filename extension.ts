import * as vscode from 'vscode';
import { processDirectory } from './code_snapshot';

export function activate(context: vscode.ExtensionContext) {
  let disposable = vscode.commands.registerCommand('codeSnapshot.capture', async () => {
    try {
      const workspaceFolders = vscode.workspace.workspaceFolders;
      if (!workspaceFolders || workspaceFolders.length === 0) {
        vscode.window.showErrorMessage('No workspace folder open');
        return;
      }

      const workspaceRoot = workspaceFolders[0].uri.fsPath;
      const fileCount = await processDirectory(workspaceRoot);
      
      vscode.window.showInformationMessage(
        `Successfully crawled directory and generated ${fileCount} markdown file(s)`
      );
    } catch (error) {
      vscode.window.showErrorMessage(`Error crawling directory: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  });

  context.subscriptions.push(disposable);
}

export function deactivate() {}