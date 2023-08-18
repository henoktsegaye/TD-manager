import { TDManager, TDs } from "./TDManager";

export class TDAnalytics {
  #rootPath: string;
  #allTds = new Map<string, TDs[]>();
  constructor(private _tdManger: TDManager, rootPath: string) {
    this.#rootPath = rootPath;
  }

  public async clearState() {
    this.#allTds = new Map<string, TDs[]>();
  }

  async setTds() {
    this.#allTds = await this._tdManger.getAllTD();
  }

  async getHowMuchFilesHasTds() {
    return {
      totalFiles: (await this._tdManger.filesInWorkspace()).length,
      filesWithTD: this.#allTds.size,
    };
  }

  async categorizeTDByLevel() {
    const levelsWithTds: {
      [key in string]: TDs[];
    } = {};

    const tds = Array.from(this.#allTds.entries());
    tds.forEach(([key, value]) => {
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
