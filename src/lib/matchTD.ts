import { randomUUID } from "crypto";
// pattern that matches the following:
// //TD:[label](level) - message
// spaces are allowed between all elements
// level , label and message are optional
// examples
// //TD:
// // TD: this has an issue
// // TD: [label] - this has an issue
// // TD: [label](1) - this has an issue
// // TD: [label](1)
// label and message are matched as words with space in between
// returns matches of label, level and message for each match

const pattern =
/\/\/[ \t]*TD[ \t]*:[ \t]*(?:\[([^\]]+)\])?[ \t]*(?:\(([^)]+)\))?(?:[ \t]*(-)?[ \t]*([^\r\n]*))/g;
export const testTDPattern = (text: string) => {
  const result = pattern.test(text);
  pattern.lastIndex = 0;
  return result;
};
type Match = {
  id: string;
  td: string;
  label?: string;
  level?: string;
  message?: string;
};

export const matchAllTD = (text: string) => {
  try {
    const matches = [];
    let match = null;
    while ((match = pattern.exec(text))) {
      matches.push([...match]);
    }
    pattern.lastIndex = 0;
 
    const matchArr: Match[] = [];
    for (const match of matches) {
      matchArr.push({
        id: randomUUID(),
        td: match[0],
        label: match[1],
        level: match[2],
        message: match[4],
      });
    }
    return matchArr;
  } catch (e) {
    console.error("ERROR", e);
    return [];
  }
};

export const matchTD = (text: string) => {
  const match = text.match(pattern);
  pattern.lastIndex = 0;
  if (!match) {
    return;
  }
  const td = match[0];
  const label = match[1];
  const level = match[2];
  const message = match[3];
  return { label, level, message, td, match };
};
