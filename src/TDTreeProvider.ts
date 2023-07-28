import * as vscode from "vscode";
import { TDManager, TDs } from "./TDManager";
import { getSign } from "./lib/decoration";
import { getFileName } from "./lib/file";

type TDTreeItem = {
  label: string;
  id: string;
  children: TDs[];
};

export class TDTreeProvider implements vscode.TreeDataProvider<any> {
  #allTds = new Map<string, TDs[]>();
  readonly #eventEmitter = new vscode.EventEmitter<void>();
  public readonly onDidChangeTreeData: vscode.Event<void>;

  constructor(private _tdManager: TDManager) {
    this._tdManager = _tdManager;
    this.onDidChangeTreeData = this.#eventEmitter.event;
    this.watchChanges();
  }

  public refresh(): void {
    this.#eventEmitter.fire();
  }

  async watchChanges() {
    const watcher = vscode.workspace.createFileSystemWatcher(
      "**/*.{ts,js}",
      true,
      false,
      true
    );
    watcher.onDidChange(async () => {
      const allTds = await this._tdManager.getAllTD();
      this.#allTds = allTds;
      this.#eventEmitter.fire();
    });
  }

  async getChildren(element?: string): Promise<string[]> {
    if (!element) {
      if (!this.#allTds.size) {
        const allTds = await this._tdManager.getAllTD();
        this.#allTds = allTds;
      }
      return Array.from(this.#allTds.keys()).sort();
    }
    if (!this.#allTds.has(element)) {
      return [];
    }
    return this.#allTds.get(element)?.map((td) => td.id) || [];
  }

  getTreeItem(element: string): vscode.TreeItem {
    if (this.#allTds.has(element)) {
      return {
        label: `${getFileName(element)} - ${this.#allTds.get(element)?.length}`,
        description: element,
        collapsibleState: vscode.TreeItemCollapsibleState.Expanded,
      };
    }

    const tdValuesArr = Array.from(this.#allTds.values()).flat();
    const tdValues = tdValuesArr.find((td) => td.id === element);
    if (!tdValues) {
      return {
        id: element,
        label: element,
        collapsibleState: vscode.TreeItemCollapsibleState.None,
      };
    }
    return {
      command: {
        command: "vscode.open",
        title: "Open",
        arguments: [
          vscode.Uri.file(tdValues.fileName || ""),
          {
            selection: new vscode.Range(tdValues.line, 0, tdValues.line, 0),
          },
        ],
      },
      label: `${getSign(tdValues.level)} ${tdValues.label ?? ""}  ${tdValues.level ? ` - ${tdValues.level}`: ""}`,
      id: element,
      collapsibleState: vscode.TreeItemCollapsibleState.None,
    };
  }
}
