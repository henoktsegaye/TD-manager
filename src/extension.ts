import * as vscode from "vscode";
import { TDManager } from "./TDManager";
import { TDTreeProvider } from "./TDTreeProvider";
import { AnalyticsWebPanel } from "./panels/AnalyticsPanel";
import { commands, ExtensionContext } from "vscode";
import { TDAnalytics } from "./TDAnalytics";
import { TDFileDecorator } from "./FileDecoratorProvider";
import { TDVscodeManager } from "./VSCodeTDManager";

export function activate(context: vscode.ExtensionContext) {
  const tdManager = new TDVscodeManager();
  const workspaceRoot = vscode.workspace.rootPath;

  const tdTreeProvider = new TDTreeProvider(tdManager);
  context.subscriptions.push(
    vscode.window.registerTreeDataProvider("td-manager", tdTreeProvider)
  );

  context.subscriptions.push(
    vscode.commands.registerCommand("td-manager.refreshEntry", () =>
      tdTreeProvider.refresh()
    )
  );

  const tdAnalytics = new TDAnalytics(tdManager, workspaceRoot ?? "");
  context.subscriptions.push(
    vscode.window.registerWebviewViewProvider(
      "td-analysis",
      new AnalyticsWebPanel(context.extensionUri, tdAnalytics)
    )
  );
  const fileDec = new TDFileDecorator(tdManager);
  context.subscriptions.push(
    vscode.window.registerFileDecorationProvider(fileDec)
  );
}
