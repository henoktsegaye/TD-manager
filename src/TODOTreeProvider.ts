import * as vscode from "vscode";
import { TDs, TODOs } from "./TDManager";
import { TODOVSCodeManager } from "./VSCodeTODOManager";
import { getFileName } from "./lib/file";

type TODOTreeItem = {
  label: string;
  id: string;
  children: TODOs[];
};

export class TODOTreeProvider implements vscode.TreeDataProvider<String> {
  readonly #eventEmitter = new vscode.EventEmitter<void>();
  public readonly onDidChangeTreeData: vscode.Event<string | void | undefined>;
  private _isTodoByFolder = false;
  private _todosByFolder = new Map<string, string[] | TODOs[]>();
  private expanded = new Map<string, boolean>();

  constructor(
    private _todoManager: TODOVSCodeManager,
    private rootPath: string
  ) {
    this.expanded.set(rootPath, true);
     this._todoManager = _todoManager;
    this.onDidChangeTreeData = this.#eventEmitter.event;
    this._todoManager.subscribe(() => {
      this.#eventEmitter.fire();
      if (this._isTodoByFolder) {
        this.getTODOByFolder();
      }
    });
  }

  public refresh(): void {
    this._todoManager.setInitialTODOs().then(() => {
      this.#eventEmitter.fire();
    });
  }

  setExpandedState(id: string, expanded: boolean) {
    this.expanded.set(id, expanded);
    // @ts-ignore
    this.#eventEmitter.fire(id);
  }

  public changeToList() {
    this._isTodoByFolder = false;
    this.#eventEmitter.fire();
  }

  public getTODOByFolder() {
    this._isTodoByFolder = true;
    if (!this.rootPath) {
      return;
    }
    let currentParent = this.rootPath;
    const tdsByFolder = new Map<string, string[] | TODOs[]>();
    tdsByFolder.set(this.rootPath, []);
    for (const [key, value] of this._todoManager.getTODOs()) {
      const folders = key.split(this.rootPath)[1].split("/");
      folders.splice(0, 1);
      for (const [index, folder] of folders.entries()) {
        const constructed = currentParent + "/" + folder;
        if (folders.length - 1 === index) {
          tdsByFolder.set(constructed, value);
        }
        if (
          !(tdsByFolder.get(currentParent) as string[])?.includes(constructed)
        ) {
          tdsByFolder.set(currentParent, [
            ...((tdsByFolder.get(currentParent) as string[]) ?? []),
            constructed,
          ]);
        }

        currentParent = constructed;
      }
      currentParent = this.rootPath;
    }

    this._todosByFolder = tdsByFolder;
    this.#eventEmitter.fire();
  }

  countTodosInFolder(folder: string) {
    let count = 0;
    const todos = this._todosByFolder.get(folder);
    todos?.forEach((todo) => {
      if (typeof todo === "string") {
        this.countTodosInFolder(todo);
      }
      count++;
    });
    return count;
  }

  async getChildren(element?: string): Promise<string[]> {
    // TODO: clean up state
    if (this._isTodoByFolder) {
      if (!element) {
        const root = this.rootPath;
        if (!root) {
          return [];
        }
        return [root];
      }
      if (this._todosByFolder.size > 0) {
        const arr = this._todosByFolder.get(element);
        return arr?.map((el) => (typeof el === "string" ? el : el.id)) ?? [];
      }
      return [];
    }
    if (!element) {
      if (!this._todoManager.getTODOs().size) {
        return [];
      }
      return Array.from(this._todoManager.getTODOs().keys()).sort();
    }
    if (!this._todoManager.getTODOs().has(element)) {
      return [];
    }
    return (
      this._todoManager
        .getTODOs()
        .get(element)
        ?.map((todo) => todo.id) || []
    );
  }

  // TODO: clean up state here
  getTreeItem(element: string): vscode.TreeItem {
    if (this._isTodoByFolder) {
      if (this._todosByFolder.has(element)) {
        return {
          label: `${getFileName(element)}(${
            this._todoManager.getTODOs().get(element)?.length ??
            this.countTodosInFolder(element) ??
            ""
          })`,
          iconPath: new vscode.ThemeIcon(
            this._todoManager.getTODOs().get(element)
              ? "file"
              : this.expanded.get(element)
              ? "folder-opened"
              : "folder"
          ),
          description: element,
          collapsibleState: this.expanded.get(element)
            ? vscode.TreeItemCollapsibleState.Expanded
            : vscode.TreeItemCollapsibleState.Collapsed,
        };
      }
    }

    if (this._todoManager.getTODOs().has(element)) {
      return {
        label: `${getFileName(element)} (${
          this._todoManager.getTODOs().get(element)?.length
        })`,
        iconPath: new vscode.ThemeIcon("file"),
        description: element,
        collapsibleState: this.expanded.get(element)
          ? vscode.TreeItemCollapsibleState.Expanded
          : vscode.TreeItemCollapsibleState.Collapsed,
      };
    }

    const todoValuesArr = this._isTodoByFolder
      ? (Array.from(this._todosByFolder.values())
          .filter((el) => typeof el !== "string")
          .flat() as TODOs[])
      : Array.from(this._todoManager.getTODOs().values()).flat();
    const todoValue = todoValuesArr.find((todo) => todo.id === element);
    if (!todoValue) {
      return {
        id: element,
        label: element,
        collapsibleState: this.expanded.get(element)
          ? vscode.TreeItemCollapsibleState.Expanded
          : vscode.TreeItemCollapsibleState.Collapsed,
      };
    }

    return {
      command: {
        command: "vscode.open",
        title: "Open",
        arguments: [
          vscode.Uri.file(todoValue.fileName || ""),
          {
            selection: new vscode.Range(todoValue.line, 0, todoValue.line, 0),
          },
        ],
      },
      id: element,
      // +1 because vscode line numbers start at 1
      label: `line:${todoValue.line + 1} - ${todoValue.message}`,
      collapsibleState: vscode.TreeItemCollapsibleState.None,
      iconPath: new vscode.ThemeIcon("note"),
    };
  }
}
