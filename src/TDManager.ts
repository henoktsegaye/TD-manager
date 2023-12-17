import { workspace } from "vscode";
import { getDecoration } from "./lib/detectTDPatterns";

// node_modules, build , dist and anything that stats with a dot
const excludeFolders = [
  "node_modules",
  "build",
  "dist",
  "dist-cache",
  ".next",
  ".cache",
  ".git",
  ".output",
  ".gradle",
  ".idea",
  "vender",
];

export type TDs = {
  id: string;
  label?: string;
  level?: string;
  td: string;
  message?: string;
  line: number;
  fileName?: string;
};

type FileTDs = Map<string, TDs[]>;

export class TDManager {
  

  public async getAllTD(): Promise<FileTDs> {
    const tdFilesMap = new Map<string, TDs[]>();
    const tdFiles = await this.filesInWorkspace();
    for (const file of tdFiles) {
      const fileContent = (await workspace.fs.readFile(file)).toString();
      if (!fileContent) {
        continue;
      }
      const decs = getDecoration(fileContent, file.fsPath);
      if (!decs) {
        continue;
      }
      if (decs.length === 0) {
        continue;
      }
      tdFilesMap.set(file.fsPath, decs);
    }
    return tdFilesMap;
  }

  public filesInWorkspace() {
    return this.getAllFilesInWorkspace();
  }

  private getAllFilesInWorkspace() {
    return workspace.findFiles(
      "**/*",
      `**/{${excludeFolders.join(",")}}/**`,
      1000
    );
  }
}


