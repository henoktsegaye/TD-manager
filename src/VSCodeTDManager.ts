import * as vscode from "vscode";
import { TDManager, TDs } from "./TDManager";
import { getDecoration, setDecoration } from "./lib/detectTDPatterns";

export class TDVscodeManager extends TDManager {
  private _allTds = new Map<string, TDs[]>();
  private _subscribedToChange: (() => void)[] = [];
   private _watcher: vscode.FileSystemWatcher;

  constructor() {
    super();
    this.setInitialTDs();
    this._watcher = this.watchChanges();
    vscode.window.onDidChangeActiveTextEditor(this.getTDForActiveFile.bind(this));
    vscode.workspace.onDidChangeTextDocument(this.getTDForActiveFile.bind(this));
    vscode.workspace.onDidOpenTextDocument(this.getTDForActiveFile.bind(this));
  }

  resetTDs() {
    this._allTds = new Map<string, TDs[]>();
  }

  dispose() {
    this._watcher.dispose();
    this._subscribedToChange = [];
    this.resetTDs();
  }

  async setInitialTDs() {
    try {
      this._allTds = await this.getAllTD();
     } catch (error) {
      console.error(error);
    } finally {
      this._subscribedToChange.forEach((fn) => fn());
    }
  }

  getTDs() {
    return this._allTds;
  }

  getTDForActiveFile() {
    const activeEditor = vscode.window.activeTextEditor;
    if (!activeEditor) {
      return;
    }
    const activeFile = activeEditor.document.fileName;
    const text = activeEditor.document.getText();
    

    const decorations = getDecoration(text, activeFile);
     if (!areEqualsTDsShallow(decorations, this._allTds.get(activeFile) ?? [])) {
      if (!decorations.length) {
        this._allTds.delete(activeFile);
      } else {
        this._allTds.set(activeFile, decorations);
      }
      this._subscribedToChange.forEach((fn) => fn());
    }
    
    setDecoration(activeEditor, decorations);
  }

  subscribe(fn: () => void) {
    this._subscribedToChange.push(fn);
  }

  unSubscribe(fn: () => void) {
    this._subscribedToChange = this._subscribedToChange.filter(
      (subscribedFn) => subscribedFn !== fn
    );
  }

  

  watchChanges() {
    const watcher = vscode.workspace.createFileSystemWatcher(
      "**/*.{*}",
      true,
      false,
      false
    );
    watcher.onDidChange(async () => {
      const allTds = await this.getAllTD();
      this._allTds = allTds;
      this._subscribedToChange.forEach((fn) => fn());
    });
    return watcher;
  }
}

function areEqualsTDsShallow(a: TDs[], b: TDs[]) {
  if (a.length !== b.length) {
    return false;
  }
  return a.every((el, index) => {
    return (
      el.label === b[index].label &&
      el.td === b[index].td &&
      el.level === b[index].level &&
      el.line === b[index].line &&
      el.fileName === b[index].fileName
    );
  });
}
