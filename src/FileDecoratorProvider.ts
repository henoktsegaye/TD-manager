import {
  CancellationToken,
  FileDecoration,
  FileDecorationProvider,
  EventEmitter,
  Uri,
  workspace,
  Event,
} from "vscode";
import { TDManager } from "./TDManager";
import { testTDPattern } from "./lib/matchTD";
// FILE NAME decorator provider for files with TDs

export class TDFileDecorator implements FileDecorationProvider {
  #allTds = new Set<string>();
  readonly #eventEmitter = new EventEmitter<Uri>();
  onDidChangeFileDecorations?: Event<Uri | Uri[] | undefined> | undefined;
  constructor(private _tdManager: TDManager) {
    this.onDidChangeFileDecorations = this.#eventEmitter.event;
    this.getAllTdFiles();
    this.watchForChange();
  }

  async getAllTdFiles() {
    const allTds = await this._tdManager.getAllTD();
    this.#allTds = new Set(Array.from(allTds.keys()));

    this.#allTds.forEach((td) => {
      this.#eventEmitter.fire(Uri.file(td));
    });
  }

  async watchForChange() {
    workspace.onDidChangeTextDocument((e) => {
      const path = e.document.uri.fsPath;
      if (!e) {
        return;
      }
      if (!e.document.uri) {
        return;
      }
      const test = testTDPattern(e.document.getText());
      if (test && this.#allTds.has(path)) {
        return;
      }
      if (!test && !this.#allTds.has(path)) {
        return;
      }
      if (test) {
        this.#allTds.add(path);
      }
      if (!test) {
        this.#allTds.delete(path);
      }

      this.#eventEmitter.fire(e.document.uri);
    });
  }

  async provideFileDecoration(
    uri: Uri,
    token: CancellationToken
  ): Promise<FileDecoration | null | undefined> {
    if (token.isCancellationRequested) {
      return;
    }
    if (!this.#allTds.has(uri.fsPath)) {
      return null;
    }
    return {
      badge: "💀",
      tooltip: "Technical Debt",
      color: "red",
    };
  }
}
