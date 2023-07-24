// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from "vscode";
import { detectTDPatterns } from "./lib/detectTDPatterns";
import { TDManager } from "./TDManager";
import { TDTreeProvider } from "./TDTreeProvider";

// This method is called when your extension is activated
// Your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {
  const workspaceRoot = vscode.workspace.rootPath;

  const tdManager = new TDManager(workspaceRoot ?? "");
  const tdTreeProvider = new TDTreeProvider(tdManager);
  vscode.window.registerTreeDataProvider("td-manager", tdTreeProvider);

  vscode.commands.registerCommand("td-manager.refreshEntry", () =>
    tdTreeProvider.refresh()
  );

  detectTDPatterns();
  vscode.window.onDidChangeActiveTextEditor(() => {
    detectTDPatterns();
  });
  vscode.workspace.onDidChangeTextDocument(() => {
    detectTDPatterns();
  });

  vscode.workspace.onDidOpenTextDocument(() => {
    detectTDPatterns();
  });
}

// This method is called when your extension is deactivated
export function deactivate() {}
