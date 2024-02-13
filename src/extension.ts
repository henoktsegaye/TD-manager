import * as vscode from "vscode";
import { TDTreeProvider } from "./TDTreeProvider";
import { AnalyticsWebPanel } from "./panels/AnalyticsPanel";
import { TDAnalytics } from "./TDAnalytics";
import { TDFileDecorator, TODOFileDecorator } from "./FileDecoratorProvider";
import { TDVscodeManager } from "./VSCodeTDManager";
import { TODOVSCodeManager } from "./VSCodeTODOManager";
import { TODOTreeProvider } from "./TODOTreeProvider";
import { setDecoration } from "./lib/detectTDPatterns";
import { setTODODecorations } from "./lib/detectTODOPatterns";
import { decoration } from "./lib/decoration";

const getRootPath = () => {
  return vscode.workspace.workspaceFolders &&
    vscode.workspace.workspaceFolders.length > 0
    ? vscode.workspace.workspaceFolders[0].uri.fsPath
    : vscode.workspace.rootPath;
};

export function activate(context: vscode.ExtensionContext) {
  // TODOManager manages todo related state
  const todoManager = new TODOVSCodeManager();

  // TdManager manages td related state
  const tdManager = new TDVscodeManager();

  function setActiveEditorDecorations() {
    const activeEditor = vscode.window.activeTextEditor;
    if (!activeEditor) {
      return;
    }
    const activeFile = activeEditor.document.fileName;

    const tds = tdManager.getTDs().get(activeFile) ?? [];
    const todos = todoManager.getTODOs().get(activeFile) ?? [];

    const decs = setDecoration(activeEditor, tds);
    const todoDecs = setTODODecorations(activeEditor, todos);
    activeEditor.setDecorations(decoration, [...decs, ...todoDecs]);
  }

  tdManager.subscribe(setActiveEditorDecorations);
  todoManager.subscribe(setActiveEditorDecorations);
  vscode.window.onDidChangeActiveTextEditor(setActiveEditorDecorations);
  vscode.workspace.onDidOpenTextDocument(setActiveEditorDecorations);

  const workspaceRoot = getRootPath();
  if (!workspaceRoot) {
    vscode.window.showErrorMessage(
      "No workspace root found. Quitting TdManager."
    );
    throw new Error("No workspace root found");
  }

  const tdTreeProvider = new TDTreeProvider(tdManager);
  const todoTreeProvider = new TODOTreeProvider(todoManager, workspaceRoot);
  context.subscriptions.push(
    vscode.window.createTreeView("td-manager", {
      treeDataProvider: tdTreeProvider,
    })
  );

  const todoTree = vscode.window.createTreeView("todo-manager", {
    treeDataProvider: todoTreeProvider,
  });
  context.subscriptions.push(todoTree);

  todoTree.onDidCollapseElement((e) => {
    todoTreeProvider.setExpandedState(e.element, false);
  });

  todoTree.onDidExpandElement((e) => {
    todoTreeProvider.setExpandedState(e.element, true);
  });

  context.subscriptions.push(
    vscode.commands.registerCommand("td-manager.refreshEntry", () =>
      tdTreeProvider.refresh()
    )
  );
  context.subscriptions.push(
    vscode.commands.registerCommand("todo-manager.groupByFolder", () =>
      todoTreeProvider.getTODOByFolder()
    )
  );

  context.subscriptions.push(
    vscode.commands.registerCommand("todo-manager.list", () =>
      todoTreeProvider.changeToList()
    )
  );

  context.subscriptions.push(
    vscode.commands.registerCommand("todo-manager.refreshEntry", () =>
      todoTreeProvider.refresh()
    )
  );

  const tdAnalytics = new TDAnalytics(tdManager, workspaceRoot ?? "");
  context.subscriptions.push(
    vscode.window.registerWebviewViewProvider(
      "td-analysis",
      new AnalyticsWebPanel(context.extensionUri, tdAnalytics)
    )
  );

  const totoFileDec = new TODOFileDecorator(todoManager);
  context.subscriptions.push(
    vscode.window.registerFileDecorationProvider(totoFileDec)
  );

  const fileDec = new TDFileDecorator(tdManager);
  context.subscriptions.push(
    vscode.window.registerFileDecorationProvider(fileDec)
  );
}
