import { TextEditor, Uri, window, workspace } from "vscode";
import { matchAllTD, testTDPattern } from "./matchTD";
import { decoration, addDecoration } from "../lib/decoration";
import { TDs } from "../TDManager";
import { randomUUID } from "crypto";
import { isNeitherNullNorUndefined } from "./ts";

export const setDecoration = (activeEditor: TextEditor, decsFounds: TDs[]) => {
  const decs = decsFounds
    .map((el) => {
      const { line, label, level, td } = el;

      const length =
        activeEditor.document.lineAt(line).text.length || td.length;

      const dec = addDecoration(activeEditor, length, line, label, level, {
        isTodo: false
      });
      if (!dec) {
        return undefined;
      }
      return dec;
    })
    .filter(isNeitherNullNorUndefined);
  return decs;
};

export const getDecoration = (fileContent: string, fileName?: string) => {
  const matches = matchAllTD(fileContent);
  if (!matches.length) {
    return [];
  }
  const dec: TDs[] = [];
  matches.forEach((match, index) => {
    if (!match || !match.td) {
      return;
    }
    const { label, level, message, td } = match;
    const elements = matches
      .slice(0, index + 1)
      .filter((m) => m.td.includes(td));
    let line = 0;

    elements.forEach((m, i) => {
      const firstLine =
        (fileContent.split(m.td)?.[i]?.split("\n")?.length ?? 1) - 1;
      line += firstLine;
    });
    dec.push({
      id: randomUUID(),
      label,
      level,
      td,
      message,
      line,
      fileName,
    });
  });
  return dec;
};
