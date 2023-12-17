import {
  CancellationToken,
  FileDecoration,
  FileDecorationProvider,
  EventEmitter,
  Uri,
  workspace,
  Event,
  window,
} from "vscode";
import { TDManager } from "./TDManager";
import { testTDPattern } from "./lib/matchTD";
import { TDVscodeManager } from "./VSCodeTDManager";
// FILE NAME decorator provider for files with TDs

export class TDFileDecorator implements FileDecorationProvider {
  private _prevTDs = new Set<string>();
  readonly #eventEmitter = new EventEmitter<Uri>();
  onDidChangeFileDecorations?: Event<Uri | Uri[] | undefined> | undefined;
  constructor(private _tdManager: TDVscodeManager) {
    this.onDidChangeFileDecorations = this.#eventEmitter.event;
    this.getAllTdFiles();
    this._tdManager.subscribe(() => {
      const currentTds = this._tdManager.getTDs();
      const currentTdsSet = new Set<string>(Array.from(currentTds.keys()));

      const added = Array.from(currentTdsSet).filter(
        (td) => !this._prevTDs.has(td)
      );
      const removed = Array.from(this._prevTDs).filter(
        (td) => !currentTdsSet.has(td)
      );
 
      for (const td of added) {
        this.#eventEmitter.fire(Uri.file(td));
      }
      for (const td of removed) {
        this.#eventEmitter.fire(Uri.file(td));
      }
      this._prevTDs =  currentTdsSet;
    });
  }

  async getAllTdFiles() {
    const allTds = this._tdManager.getTDs();

    Array.from(allTds).forEach(([file, td]) => {
      this.#eventEmitter.fire(Uri.file(file));
    });
  }

  async provideFileDecoration(
    uri: Uri,
    token: CancellationToken
  ): Promise<FileDecoration | null | undefined> {
    if (token.isCancellationRequested) {
      return;
    }
    if (!this._tdManager.getTDs().has(uri.fsPath)) {
      return null;
    }
    return {
      badge: "💀",
      tooltip: "Technical Debt",
      color: "red",
    };
  }
}
