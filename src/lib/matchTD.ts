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
  /\/\/\s*TD:\s*(?:\[([^\]]+)\])?\s*(?:\(([^\)]+)\))?\s*-\s*(.*)/g;

export const testTDPattern = (text: string) => {
  return pattern.test(text);
};

type Match = {
  id: string;
  td: string;
  label: string;
  level: string;
  message: string;
};

export const matchAllTD = (text: string) => {
  const matches = text.matchAll(pattern);
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
};

export const matchTD = (text: string) => {
  const match = text.match(pattern);
  if (!match) {
    return;
  }
  const td = match[0];
  const label = match[1];
  const level = match[2];
  const message = match[3];
  return { label, level, message, td, match };
};
