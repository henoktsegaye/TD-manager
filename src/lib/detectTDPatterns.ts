import { TextEditor, Uri, window, workspace } from "vscode";
import { matchAllTD, testTDPattern } from "./matchTD";
import { decoration, addDecoration } from "../lib/decoration";
import { TDs } from "../TDManager";
import { randomUUID } from "crypto";
import { asssertIsNeitherNullNorUndefined } from "./ts";

export const detectTDPatterns = (activeEditor?: TextEditor) => {
  const editor = window.activeTextEditor;
  if (!editor) {
    return;
  }
  setDecoration(editor);
};



export const setDecoration = (activeEditor: TextEditor) => {
  const document = activeEditor.document;
  const text = document.getText();
  if (!text) {
    return;
  }
  const decsFounds = getDecoration(text);
console.log("decsFounds", decsFounds , activeEditor.document.fileName);
  const decs =decsFounds
    .map((el) => {
       const { line, label, level, td } = el;

      const length =
        activeEditor.document.lineAt(line).text.length || td.length;

      const dec = addDecoration(activeEditor, length, line, label, level);
      if (!dec) {
        return undefined;
      }
      return dec;
    })
    .filter(asssertIsNeitherNullNorUndefined);
  activeEditor.setDecorations(decoration, decs);
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
    const { label, level, td } = match;
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
      message: "",
      line,
      fileName,
    });
  });
  return dec;
};