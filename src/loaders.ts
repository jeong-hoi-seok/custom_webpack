export type Loader = (source: string, filename: string) => string;

export const jsLoader: Loader = (source) => source;

export const jsonLoader: Loader = (source, filename) => {
  try {
    return `module.exports = ${JSON.stringify(JSON.parse(source))};`;
  } catch (error) {
    throw new Error(`Invalid JSON in ${filename}: ${(error as Error).message}`);
  }
};

export const cssLoader: Loader = (source) => {
  const css = JSON.stringify(source);

  return `
const css = ${css};

if (typeof document !== "undefined") {
  const style = document.createElement("style");
  style.textContent = css;
  document.head.appendChild(style);
}

module.exports = css;
`;
};
