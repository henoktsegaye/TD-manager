import { TODOs } from "../TDManager";
import { TextEditor, Uri, window, workspace } from "vscode";
import { addDecoration, decoration } from "./decoration";
import { isNeitherNullNorUndefined } from "./ts";
import { randomUUID } from "crypto";
import { matchAllTODO } from "./matchTD";

export const setTODODecorations = (
  activeEditor: TextEditor,
  decsFounds: TODOs[]
) => {
  const decs = decsFounds
    .map((el) => {
      const { line, message, todo, id } = el;

      const length =
        activeEditor.document.lineAt(line).text.length || todo.length;

      const dec = addDecoration(
        activeEditor,
        length,
        line,
        message,
        undefined,
        {
          isTodo: true,
        }
      );
      if (!dec) {
        return undefined;
      }
      return dec;
    })
    .filter(isNeitherNullNorUndefined);
  return decs;
};

export const getTODODecorations = (fileContent: string, fileName?: string) => {
  const matches = matchAllTODO(fileContent);
  if (!matches.length) {
    return [];
  }
  const dec: TODOs[] = [];
  matches.forEach((match, index) => {
    if (!match || !match.todo) {
      return;
    }
    const { todo, message } = match;
    const elements = matches
      .slice(0, index + 1)
      .filter((m) => m.todo.includes(todo));
    let line = 0;

    elements.forEach((m, i) => {
      const firstLine =
        (fileContent.split(m.todo)?.[i]?.split("\n")?.length ?? 1) - 1;
      line += firstLine;
    });
    dec.push({
      id: randomUUID(),
      todo,
      message,
      line,
      fileName,
    });
  });
  return dec;
};
