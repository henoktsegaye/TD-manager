import { TDs } from "../TDManager";

export type MessageFromWebPanel =
  | {
      command: "TDsByLevel";
      payload: {
        [key: string]: TDs[];
      };
    }
  | {
      command: "TDsOverview";
      payload: {
        totalFiles: number;
        filesWithTD: number;
      };
    };
