import { createRequire } from "node:module";
import { mkdir, readdir, readFile, rm, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = fileURLToPath(new URL("../", import.meta.url));
const packageRoot = join(root, "packages", "icons");
const sourceRoot = join(packageRoot, "src");
const generatedRoot = join(sourceRoot, "generated");
const distRoot = join(packageRoot, "dist");
const iconoirVersion = "7.12.1";
const require = createRequire(import.meta.url);

const attributeNames = new Map([
  ["clip-path", "clipPath"],
  ["clip-rule", "clipRule"],
  ["fill-rule", "fillRule"],
  ["stroke-dasharray", "strokeDasharray"],
  ["stroke-linecap", "strokeLinecap"],
  ["stroke-linejoin", "strokeLinejoin"],
  ["stroke-miterlimit", "strokeMiterlimit"],
  ["stroke-width", "strokeWidth"],
]);

function iconComponentName(name) {
  return `${name
    .split("-")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join("")}Icon`;
}

function parseAttributes(source, filename) {
  const attributes = {};
  const pattern = /([A-Za-z_:][A-Za-z0-9_.:-]*)\s*=\s*(?:"([^"]*)"|'([^']*)')/g;
  let cursor = 0;
  let match;

  while ((match = pattern.exec(source))) {
    if (source.slice(cursor, match.index).trim()) {
      throw new Error(`Unsupported SVG attribute syntax in ${filename}`);
    }
    attributes[match[1]] = match[2] ?? match[3] ?? "";
    cursor = pattern.lastIndex;
  }

  if (source.slice(cursor).trim()) {
    throw new Error(`Unsupported SVG attribute syntax in ${filename}`);
  }

  return attributes;
}

function parseSvg(source, filename) {
  const documentRoot = { tag: "document", attributes: {}, children: [] };
  const stack = [documentRoot];
  const tokens = source.match(/<!--[\s\S]*?-->|<[^>]+>|[^<]+/g) ?? [];

  for (const token of tokens) {
    if (token.startsWith("<!--") || token.trim() === "") continue;
    if (token.startsWith("<?") || token.startsWith("<!")) continue;

    if (token.startsWith("</")) {
      const closingTag = token.slice(2, -1).trim();
      const node = stack.pop();
      if (!node || node.tag !== closingTag) {
        throw new Error(`Malformed SVG nesting in ${filename}`);
      }
      continue;
    }

    if (!token.startsWith("<")) {
      throw new Error(`Unsupported SVG text content in ${filename}`);
    }

    let body = token.slice(1, -1).trim();
    const selfClosing = body.endsWith("/");
    if (selfClosing) body = body.slice(0, -1).trim();

    const nameMatch = body.match(/^([A-Za-z][A-Za-z0-9:-]*)(?:\s|$)/);
    if (!nameMatch) throw new Error(`Malformed SVG tag in ${filename}`);
    const tag = nameMatch[1];
    const attributeSource = body.slice(nameMatch[0].length);
    const node = {
      tag,
      attributes: parseAttributes(attributeSource, filename),
      children: [],
    };
    stack.at(-1).children.push(node);
    if (!selfClosing) stack.push(node);
  }

  if (stack.length !== 1) throw new Error(`Unclosed SVG tag in ${filename}`);
  const rootNode = documentRoot.children[0];
  if (!rootNode || rootNode.tag !== "svg") {
    throw new Error(`SVG root is missing in ${filename}`);
  }
  return rootNode;
}

function prefixSvgIds(source, prefix) {
  const ids = [...source.matchAll(/\bid="([^"]+)"/g)].map((match) => [
    match[1],
    `${prefix}-${match[1]}`,
  ]);
  let result = source;
  for (const [original, replacement] of ids) {
    result = result
      .replaceAll(`id="${original}"`, `id="${replacement}"`)
      .replaceAll(`#${original}`, `#${replacement}`);
  }
  return result;
}

function jsxAttributes(attributes) {
  return Object.fromEntries(
    Object.entries(attributes).map(([name, value]) => [
      attributeNames.get(name) ?? name,
      value,
    ]),
  );
}

function serializeNodeTuple(node) {
  const attributes = JSON.stringify(jsxAttributes(node.attributes));
  const children = node.children.length
    ? `,[${node.children.map((child) => serializeNodeTuple(child)).join(",")}]`
    : "";
  return `[${JSON.stringify(node.tag)},${attributes}${children}]`;
}

function svgDefaults(rootNode) {
  const attributes = rootNode.attributes;
  const defaults = {
    viewBox: attributes.viewBox ?? "0 0 24 24",
    fill: attributes.fill ?? "none",
  };
  if (attributes["stroke-width"] !== undefined) {
    defaults.strokeWidth = attributes["stroke-width"];
  }
  return defaults;
}

function encodeSvg(svg) {
  return encodeURIComponent(svg).replace(
    /[!'()*]/g,
    (character) => `%${character.charCodeAt(0).toString(16).toUpperCase()}`,
  );
}

function cssHeader() {
  return `/*!\n * @combric/icons generated from Iconoir ${iconoirVersion}.\n * Iconoir license: https://github.com/iconoir-icons/iconoir/blob/main/LICENSE\n */\n\n.combric-icon {\n  display: inline-block;\n  width: 1em;\n  height: 1em;\n  vertical-align: -0.125em;\n  background-color: currentColor;\n  background-repeat: no-repeat;\n  background-position: center;\n  background-size: contain;\n  mask-repeat: no-repeat;\n  mask-position: center;\n  mask-size: contain;\n  -webkit-mask-repeat: no-repeat;\n  -webkit-mask-position: center;\n  -webkit-mask-size: contain;\n}\n`;
}

async function resolveIconoirRoot() {
  const probe = require.resolve("iconoir/icons/regular/accessibility.svg");
  const iconoirRoot = join(dirname(probe), "..", "..");
  const manifest = JSON.parse(
    await readFile(join(iconoirRoot, "package.json"), "utf8"),
  );
  if (manifest.version !== iconoirVersion) {
    throw new Error(
      `Expected iconoir@${iconoirVersion}, found iconoir@${manifest.version}`,
    );
  }
  return iconoirRoot;
}

async function iconFiles(directory) {
  return (await readdir(directory))
    .filter((filename) => filename.endsWith(".svg"))
    .map((filename) => filename.slice(0, -4))
    .sort((left, right) => left.localeCompare(right));
}

async function generateStyle({ iconoirRoot, style, names }) {
  const generatedStyleRoot = join(generatedRoot, style);
  const svgOutputRoot = join(distRoot, "svg", style);
  await mkdir(generatedStyleRoot, { recursive: true });
  await mkdir(svgOutputRoot, { recursive: true });

  const exports = [];
  const cssRules = [];

  for (const name of names) {
    const sourcePath = join(iconoirRoot, "icons", style, `${name}.svg`);
    const source = await readFile(sourcePath, "utf8");
    const normalized = prefixSvgIds(source, `combric-${style}-${name}`);
    const rootNode = parseSvg(normalized, sourcePath);
    const nodes = rootNode.children.map((child) => serializeNodeTuple(child));
    const componentName = iconComponentName(name);
    const sourceModule = [
      `/* Generated from Iconoir ${iconoirVersion}; do not edit. */`,
      'import { createIcon, type CombricIcon } from "../../icon.js";',
      "",
      `export const ${componentName}: CombricIcon = createIcon(`,
      `  ${JSON.stringify(name)},`,
      `  [${nodes.join(",")} ] as const,`,
      `  ${JSON.stringify(svgDefaults(rootNode))},`,
      ");",
      "",
    ].join("\n");
    await writeFile(
      join(generatedStyleRoot, `${name}.tsx`),
      sourceModule,
      "utf8",
    );
    exports.push(`export { ${componentName} } from "./${style}/${name}.js";`);

    const publicSvg = normalized.trim();
    await writeFile(
      join(svgOutputRoot, `${name}.svg`),
      `${publicSvg}\n`,
      "utf8",
    );
    const encoded = encodeSvg(publicSvg);
    const dataUri = `url("data:image/svg+xml,${encoded}")`;
    cssRules.push(
      `.combric-icon-${name}{mask-image:${dataUri};-webkit-mask-image:${dataUri};}`,
    );
  }

  await writeFile(
    join(generatedRoot, `${style}.ts`),
    `/* Generated from Iconoir ${iconoirVersion}; do not edit. */\n${exports.join("\n")}\n`,
    "utf8",
  );
  await writeFile(
    join(distRoot, "css", `${style}.css`),
    `${cssHeader()}\n${cssRules.join("\n")}\n`,
    "utf8",
  );
}

const iconoirRoot = await resolveIconoirRoot();
const regularNames = await iconFiles(join(iconoirRoot, "icons", "regular"));
const solidNames = await iconFiles(join(iconoirRoot, "icons", "solid"));
const solidSet = new Set(solidNames);

await rm(generatedRoot, { force: true, recursive: true });
await rm(join(distRoot, "svg"), { force: true, recursive: true });
await rm(join(distRoot, "css"), { force: true, recursive: true });
await rm(join(distRoot, "metadata.json"), { force: true });
await rm(join(distRoot, "ICONOIR-LICENSE"), { force: true });
await mkdir(distRoot, { recursive: true });
await mkdir(join(distRoot, "css"), { recursive: true });

await generateStyle({ iconoirRoot, style: "regular", names: regularNames });
await generateStyle({ iconoirRoot, style: "solid", names: solidNames });

const catalog = regularNames.map((name) => ({
  name,
  componentName: iconComponentName(name),
  styles: solidSet.has(name) ? ["regular", "solid"] : ["regular"],
}));
const metadata = {
  source: "Iconoir",
  sourceVersion: iconoirVersion,
  viewBox: "0 0 24 24",
  icons: catalog,
};
const metadataSource = [
  `/* Generated from Iconoir ${iconoirVersion}; do not edit. */`,
  `export const iconoirVersion = ${JSON.stringify(iconoirVersion)} as const;`,
  `export const iconNames = ${JSON.stringify(regularNames)} as const;`,
  "export const regularIconNames: typeof iconNames = iconNames;",
  `export const solidIconNames = ${JSON.stringify(solidNames)} as const;`,
  "",
  "export type IconName = (typeof iconNames)[number];",
  'export type IconStyle = "regular" | "solid";',
  "export interface IconMetadata {",
  "  readonly name: string;",
  "  readonly componentName: string;",
  "  readonly styles: readonly IconStyle[];",
  "}",
  `export const iconCatalog: readonly IconMetadata[] = ${JSON.stringify(catalog)};`,
  "",
].join("\n");
await writeFile(join(sourceRoot, "metadata.ts"), metadataSource, "utf8");
await writeFile(
  join(distRoot, "metadata.json"),
  `${JSON.stringify(metadata, null, 2)}\n`,
  "utf8",
);
await writeFile(
  join(distRoot, "css", "index.css"),
  `${cssHeader()}\n@import "./regular.css";\n@import "./solid.css";\n`,
  "utf8",
);
await writeFile(
  join(distRoot, "ICONOIR-LICENSE"),
  await readFile(join(iconoirRoot, "LICENSE"), "utf8"),
  "utf8",
);

console.log(
  `Generated ${regularNames.length} regular and ${solidNames.length} solid icons from iconoir@${iconoirVersion}.`,
);
