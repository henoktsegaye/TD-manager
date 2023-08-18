export const getFileName = (path?: string) => {
  if (!path && typeof path !== "string") {
    return "";
  }
  return path.split("/").pop();
};
