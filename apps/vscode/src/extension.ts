import * as vscode from 'vscode';
import * as fs from 'node:fs';
import * as path from 'node:path';
import { detect, resolveConfig } from '@clipcloak/core';
import genericPack from '@clipcloak/pack-generic';
import brPack from '@clipcloak/pack-br';
import euPack from '@clipcloak/pack-eu';

const ALL_PACKS_MAP: Record<string, any> = { generic: genericPack, br: brPack, eu: euPack };

export function activate(context: vscode.ExtensionContext) {
  const diagnosticCollection = vscode.languages.createDiagnosticCollection('clipcloak');
  context.subscriptions.push(diagnosticCollection);

  const scanDocument = (document: vscode.TextDocument) => {
    // Only scan normal files, avoid scanning output panels or very large files
    if (document.uri.scheme !== 'file') return;
    if (document.getText().length > 5 * 1024 * 1024) return;

    let config: any = { minSeverity: 'medium', packs: ['generic', 'br', 'eu'] };
    const workspaceFolder = vscode.workspace.getWorkspaceFolder(document.uri);
    
    if (workspaceFolder) {
      const configPath = path.join(workspaceFolder.uri.fsPath, '.clipcloak.json');
      if (fs.existsSync(configPath)) {
        try {
          const fileConfig = JSON.parse(fs.readFileSync(configPath, 'utf8'));
          config = resolveConfig(fileConfig, {});
        } catch {
          // ignore parsing errors
        }
      }
    }

    const activePacks = (config.packs || ['generic', 'br', 'eu'])
      .map((p: string) => ALL_PACKS_MAP[p])
      .filter(Boolean);

    const text = document.getText();
    const { findings } = detect(text, activePacks, {
      minSeverity: config.minSeverity || 'medium',
      context: { filename: document.fileName },
    });

    const diagnostics: vscode.Diagnostic[] = [];

    for (const finding of findings) {
      // Find position using text offsets
      const startPos = document.positionAt(finding.start);
      const endPos = document.positionAt(finding.end);
      const range = new vscode.Range(startPos, endPos);

      // Map severity
      let vsSeverity = vscode.DiagnosticSeverity.Warning;
      if (finding.severity === 'critical') vsSeverity = vscode.DiagnosticSeverity.Error;
      if (finding.severity === 'low') vsSeverity = vscode.DiagnosticSeverity.Information;

      const message = `[ClipCloak] Sensitive Data Detected: ${finding.packId}/${finding.detectorId}\nSeverity: ${finding.severity.toUpperCase()}\nReason: ${finding.reason}`;
      const diagnostic = new vscode.Diagnostic(range, message, vsSeverity);
      diagnostic.source = 'ClipCloak';
      diagnostic.code = finding.detectorId;
      diagnostics.push(diagnostic);
    }

    diagnosticCollection.set(document.uri, diagnostics);
  };

  // Debounce state for document changes
  const timeoutMap = new Map<string, NodeJS.Timeout>();

  const debouncedScan = (document: vscode.TextDocument) => {
    const key = document.uri.toString();
    if (timeoutMap.has(key)) {
      clearTimeout(timeoutMap.get(key)!);
    }
    timeoutMap.set(
      key,
      setTimeout(() => {
        scanDocument(document);
        timeoutMap.delete(key);
      }, 300),
    );
  };

  // Scan on open and on change
  context.subscriptions.push(
    vscode.workspace.onDidOpenTextDocument(scanDocument),
    vscode.workspace.onDidChangeTextDocument((e) => debouncedScan(e.document)),
    vscode.workspace.onDidSaveTextDocument(scanDocument),
  );

  // Command to run manually
  const scanCommand = vscode.commands.registerCommand('clipcloak.scanFile', () => {
    const editor = vscode.window.activeTextEditor;
    if (editor) {
      scanDocument(editor.document);
      vscode.window.showInformationMessage('ClipCloak: Scan completed.');
    }
  });

  context.subscriptions.push(scanCommand);

  // Scan currently open documents
  if (vscode.window.activeTextEditor) {
    scanDocument(vscode.window.activeTextEditor.document);
  }
}

export function deactivate() {}
