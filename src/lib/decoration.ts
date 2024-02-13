import {
  DecorationOptions,
  DecorationRangeBehavior,
  MarkdownString,
  Position,
  Range,
  TextEditor,
  window,
} from "vscode";

export const decoration = window.createTextEditorDecorationType({
  rangeBehavior: DecorationRangeBehavior.OpenOpen,
  after: {
    fontWeight: "800",
  },
});

export const getSign = (level?: string) => {
  let sign = "💀";
  if (level === "1") {
    sign = "🫤";
  }
  if (level === "2") {
    sign = "😞";
  }
  if (level === "3") {
    sign = "💀";
  }
  if (level === "4") {
    sign = "🏴‍☠️";
  }
  if (level === "5") {
    sign = "🪦";
  }
  return sign;
};

const getHoverMessage = (label?: string, level?: string) => {
  return new MarkdownString(
    `**Technical Debt**\n\n Label -${label || "Unknown"}\n\n Level-${
      level || "Unknown"
    }`
  );
};

const getHoverMessageTODO = (message?: string) => {
  return new MarkdownString(`**TODO**\n\n ${message || "Unknown"}`);
};

export const addDecoration = (
  _activeEditor: TextEditor,
  tdLength: number,
  line: number,
  label?: string,
  level?: string,
  options?: {
    isTodo?: boolean;
  }
): DecorationOptions | undefined => {
  if (!tdLength) {
    return;
  }
  let startPos = new Position(line, 0);
  let endPos = new Position(line, tdLength);
  let range = new Range(startPos, endPos);
  return {
    range,
    hoverMessage: options?.isTodo
      ? getHoverMessageTODO(label)
      : getHoverMessage(label, level),
    renderOptions: {
      after: {
        margin: "0 0 0 1em",
        fontWeight: "bold",
        contentText: options?.isTodo ? "📝" : getSign(level),
      },
    },
  };
};
