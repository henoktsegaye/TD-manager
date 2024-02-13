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

const tdPattern =
  /\/\/[ \t]*TD[ \t]*:[ \t]*(?:\[([^\]]+)\])?[ \t]*(?:\(([^)]+)\))?(?:[ \t]*(-)?[ \t]*([^\r\n]*))/g;
const todoPattern = /\/\/[ \t]*TODO[ \t]*:[ \t]*([^\r\n]*)/g;

export const testTDPattern = (text: string) => {
  const result = tdPattern.test(text);
  tdPattern.lastIndex = 0;
  return result;
};

export const testTodoPattern = (text: string) => {
  const result = todoPattern.test(text);
  todoPattern.lastIndex = 0;
  return result;
};

type TDMatch = {
  id: string;
  td: string;
  label?: string;
  level?: string;
  message?: string;
};

export type TodoMatch = {
  id: string;
  todo: string;
  message?: string;
};

export const matchAllTD = (text: string) => {
  try {
    const matches = [];
    let match = null;
    while ((match = tdPattern.exec(text))) {
      matches.push([...match]);
    }
    tdPattern.lastIndex = 0;

    const matchArr: TDMatch[] = [];
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

export const matchAllTODO = (text: string) => {
  try {
    const matches = [];
    let match = null;
    while ((match = todoPattern.exec(text))) {
      matches.push([...match]);
    }
    todoPattern.lastIndex = 0;

    const matchArr: TodoMatch[] = [];
    for (const match of matches) {
      matchArr.push({
        id: randomUUID(),
        message: match[1],
        todo: match[0],
      });
    }
    return matchArr;
  } catch (e) {
    console.error("ERROR", e);
    return [];
  }
};

export const matchTD = (text: string) => {
  const match = text.match(tdPattern);
  tdPattern.lastIndex = 0;
  if (!match) {
    return;
  }
  const td = match[0];
  const label = match[1];
  const level = match[2];
  const message = match[3];
  return { label, level, message, td, match };
};

export const matchTODO = (text: string) => {
  const match = text.match(todoPattern);
  todoPattern.lastIndex = 0;
  if (!match) {
    return;
  }
  const todo = match[0];
  const message = match[1];
  return { message, todo, match };
};
