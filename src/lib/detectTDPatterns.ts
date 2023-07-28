import { TextEditor, window, workspace } from "vscode";
import { matchAllTD, testTDPattern } from "./matchTD";
import { decoration, addDecoration } from "../lib/decoration";
import { TDs } from "../TDManager";
import { randomUUID } from "crypto";
import { asssertIsNeitherNullNorUndefined } from "./ts";

const textButtonDecoration = window.registerFileDecorationProvider({
  provideFileDecoration: async (uri) => {
    const fileContent = (await workspace.fs.readFile(uri)).toString();

    if (!fileContent) {
      return;
    }

    if (!testTDPattern(fileContent)) {
      return;
    }
    return {
      badge: "💀",
      tooltip: "Technical Debt",
      color: "red",
    };
  },
});

export const detectTDPatterns = (activeEditor?: TextEditor) => {
  const editor = window.activeTextEditor;
  if (!editor) {
    return;
  }
  setDecoration(editor);
};

export const getDecoration = (fileContent: string, fileName?: string) => {
  const matches = matchAllTD(fileContent);
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
      const firstLine = fileContent.split(m.td)[i].split("\n").length - 1;
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

const setDecoration = (activeEditor: TextEditor) => {
  const document = activeEditor.document;
  const text = document.getText();
  if (!text) {
    return;
  }
  const decs = getDecoration(text)
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
