import { workspace } from "vscode";
import { getDecoration } from "./lib/detectTDPatterns";

const excludeFolders = ["node_modules", ".git"];

export type TDs = {
  id: string;
  label: string;
  level: string;
  td: string;
  message: string;
  line: number;
  fileName?: string;
};

type FileTDs = Map<string, TDs[]>;

export class TDManager {
  #workspaceRoot: string;
  constructor(private workspaceRoot: string) {
    this.#workspaceRoot = workspaceRoot;
  }

  public async getAllTD(): Promise<FileTDs> {
    const tdFilesMap = new Map<string, TDs[]>();
    const tdFiles = await this.getAllTDInWorkspace();
    for (const file of tdFiles) {
      const fileContent = (await workspace.fs.readFile(file)).toString();
      const decs = getDecoration(fileContent, file.fsPath);
      if (!decs) {
        continue;
      }
      tdFilesMap.set(file.fsPath, decs);
    }
    return tdFilesMap;
  }

  private async getAllTDInWorkspace() {
    const files = await this.getAllFilesInWorkspace();
    const tdFiles = files.filter((file) => {
      return file.fsPath.endsWith(".ts") || file.fsPath.endsWith(".js");
    });
    return tdFiles;
  }

  private getAllFilesInWorkspace() {
    return workspace.findFiles(
      "**/*",
      `!**/{${excludeFolders.join(",")}}/**`,
      1000
    );
  }
}