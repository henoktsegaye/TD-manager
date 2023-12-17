import * as vscode from "vscode";
import { TDManager, TDs } from "./TDManager";
import { getSign } from "./lib/decoration";
import { getFileName } from "./lib/file";
import { TDVscodeManager } from "./VSCodeTDManager";

type TDTreeItem = {
  label: string;
  id: string;
  children: TDs[];
};

export class TDTreeProvider implements vscode.TreeDataProvider<any> {
  readonly #eventEmitter = new vscode.EventEmitter<void>();
  public readonly onDidChangeTreeData: vscode.Event<void>;

  constructor(private _tdManager: TDVscodeManager) {
    this._tdManager = _tdManager;
    this.onDidChangeTreeData = this.#eventEmitter.event;
    this._tdManager.subscribe(() => {
      this.#eventEmitter.fire();
    });
  }

  public refresh(): void {
    this._tdManager.setInitialTDs().then(() => {
      this.#eventEmitter.fire();
    });
  }

  async getChildren(element?: string): Promise<string[]> {
    if (!element) {
      if (!this._tdManager.getTDs().size) {
        return [];
      }
      return Array.from(this._tdManager.getTDs().keys()).sort();
    }
    if (!this._tdManager.getTDs().has(element)) {
      return [];
    }
    return (
      this._tdManager
        .getTDs()
        .get(element)
        ?.map((td) => td.id) || []
    );
  }

  getTreeItem(element: string): vscode.TreeItem {
    if (this._tdManager.getTDs().has(element)) {
      return {
        label: `${getFileName(element)} - ${
          this._tdManager.getTDs().get(element)?.length
        }`,
        description: element,
        collapsibleState: vscode.TreeItemCollapsibleState.Expanded,
      };
    }

    const tdValuesArr = Array.from(this._tdManager.getTDs().values()).flat();
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
      label: `${getSign(tdValues.level)} ${tdValues.label ?? ""}  ${
        tdValues.level ? ` - ${tdValues.level}` : ""
      }`,
      id: element,
      collapsibleState: vscode.TreeItemCollapsibleState.None,
    };
  }
}
