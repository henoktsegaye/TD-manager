// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from "vscode";
import { detectTDPatterns } from "./lib/detectTDPatterns";
import { TDManager } from "./TDManager";
import { TDTreeProvider } from "./TDTreeProvider";
import { AnalyticsWebPanel } from "./panels/AnalyticsPanel";
import { commands, ExtensionContext } from "vscode";
import { TDAnalytics } from "./TDAnalytics";
import { TDFileDecorator } from "./FileDecoratorProvider";

// This method is called when your extension is activated
// Your extension is activated the very first time the command is executed
//TD: [combile-state](2) - we need to combine state
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
  const tdAnalytics = new TDAnalytics(tdManager, workspaceRoot ?? "");
  vscode.window.registerWebviewViewProvider(
    "td-analysis",
    new AnalyticsWebPanel(context.extensionUri, tdAnalytics),
    {
      webviewOptions: {
        retainContextWhenHidden: true,
      },
    }
  );
  const fileDec = new TDFileDecorator(tdManager);
  vscode.window.registerFileDecorationProvider(fileDec);
}

// This method is called when your extension is deactivated
export function deactivate() {}
