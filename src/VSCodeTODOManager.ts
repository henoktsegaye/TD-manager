import * as vscode from "vscode";
import { TODOManager, TODOs } from "./TDManager";
import {
  getTODODecorations,
  setTODODecorations,
} from "./lib/detectTODOPatterns";

export class TODOVSCodeManager extends TODOManager {
  private _allTODOs = new Map<string, TODOs[]>();
  private _subscribedToChange: (() => void)[] = [];
  private _watcher: vscode.FileSystemWatcher;
 
  constructor() {
    super();
    this.setInitialTODOs();
    this._watcher = this.watchChanges();

    vscode.workspace.onDidChangeTextDocument(
      this.getTODOForActiveFile.bind(this)
    );
  }

  structureTODOSByFolder() {
  }

  resetTODOs() {
    this._allTODOs = new Map<string, TODOs[]>();
  }

  dispose() {
    this._watcher.dispose();
    this._subscribedToChange = [];
    this.resetTODOs();
  }

  async setInitialTODOs() {
    try {
      this._allTODOs = await this.getAllTODO();
    } catch (error) {
      console.error(error);
    } finally {
      this._subscribedToChange.forEach((fn) => fn());
    }
  }

  getTODOs() {
    return this._allTODOs;
  }

  getTODOForActiveFile() {
    const activeEditor = vscode.window.activeTextEditor;
    if (!activeEditor) {
      return;
    }
    const activeFile = activeEditor.document.fileName;
    const text = activeEditor.document.getText();

    const decorations = getTODODecorations(text, activeFile);
    if (
      !areEqualsTODOsShallow(decorations, this._allTODOs.get(activeFile) ?? [])
    ) {
      if (!decorations.length) {
        this._allTODOs.delete(activeFile);
      } else {
        this._allTODOs.set(activeFile, decorations);
      }
      this._subscribedToChange.forEach((fn) => fn());
      setTODODecorations(activeEditor, decorations);
    }
  }

  watchChanges() {
    const watcher = vscode.workspace.createFileSystemWatcher("**/*");
    watcher.onDidChange((e) => {
      this.getTODOForActiveFile();
    });
    watcher.onDidCreate((e) => {
      this.getTODOForActiveFile();
    });
    watcher.onDidDelete((e) => {
      this.getTODOForActiveFile();
    });
    return watcher;
  }

  subscribe(fn: () => void) {
    this._subscribedToChange.push(fn);
  }
  unSubscribe(fn: () => void) {
    this._subscribedToChange = this._subscribedToChange.filter(
      (subscribedFn) => subscribedFn !== fn
    );
  }
}

function areEqualsTODOsShallow(a: TODOs[], b: TODOs[]) {
  if (a.length !== b.length) {
    return false;
  }
  return a.every((el, index) => {
    const bEl = b[index];
    return (
      el.todo === bEl.todo &&
      el.message === bEl.message &&
      el.line === bEl.line &&
      el.fileName === bEl.fileName
    );
  });
}
