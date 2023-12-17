import { TDManager, TDs } from "./TDManager";
import { TDVscodeManager } from "./VSCodeTDManager";

export class TDAnalytics {
  #rootPath: string;
  constructor(private _tdManger: TDVscodeManager, rootPath: string) {
    this.#rootPath = rootPath;
  }

  subscribeToChanges(fn: () => void) {
    this._tdManger.subscribe(fn);
  }

  async getHowMuchFilesHasTds() {
    return {
      totalFiles: (await this._tdManger.filesInWorkspace()).length,
      filesWithTD: this._tdManger.getTDs().size,
    };
  }

  async categorizeTDByLevel() {
    const levelsWithTds: {
      [key in string]: TDs[];
    } = {};

    const tds = Array.from(this._tdManger.getTDs().entries());
    tds.forEach(([_key, value]) => {
      value.forEach((td) => {
        const level = td.level ?? "unknown";
        if (levelsWithTds[level]) {
          levelsWithTds[level].push(td);
        } else {
          levelsWithTds[level] = [td];
        }
      });
    });
    return levelsWithTds;
  }
}
