import assert from "node:assert/strict";
import { access, readFile } from "node:fs/promises";
import test from "node:test";

const packageNames = ["core", "tokens", "react", "cli", "guard"];
const tokenRuntimeExports = [
  "metriq",
  "primitiveCssVariableNames",
  "primitiveTokens",
  "semanticCssVariableNames",
  "semanticTokenReferences",
  "semanticTokens",
];
const reactRuntimeExports = [
  "Accordion",
  "AccordionContent",
  "AccordionItem",
  "AccordionTrigger",
  "Avatar",
  "AvatarFallback",
  "AvatarImage",
  "Badge",
  "Breadcrumb",
  "BreadcrumbItem",
  "BreadcrumbLink",
  "BreadcrumbList",
  "BreadcrumbPage",
  "BreadcrumbSeparator",
  "Button",
  "Card",
  "CardContent",
  "CardDescription",
  "CardFooter",
  "CardHeader",
  "CardTitle",
  "Checkbox",
  "Cluster",
  "Container",
  "Grid",
  "Inline",
  "Input",
  "Label",
  "Pagination",
  "PaginationItem",
  "PaginationLink",
  "PaginationList",
  "PaginationNext",
  "PaginationPrevious",
  "Radio",
  "RadioGroup",
  "Select",
  "Separator",
  "Stack",
  "Switch",
  "Tabs",
  "TabsContent",
  "TabsList",
  "TabsTrigger",
  "Textarea",
];

for (const packageName of packageNames) {
  test(`@combric/${packageName} exposes a loadable ESM entry point`, async () => {
    const packageUrl = new URL(`../packages/${packageName}/`, import.meta.url);
    const manifest = JSON.parse(
      await readFile(new URL("package.json", packageUrl), "utf8"),
    );
    const importUrl = new URL(manifest.exports["."].import, packageUrl);
    const typesUrl = new URL(manifest.exports["."].types, packageUrl);

    await access(typesUrl);
    const entryPoint = await import(importUrl);

    assert.deepEqual(
      Object.keys(entryPoint).sort(),
      packageName === "tokens"
        ? tokenRuntimeExports
        : packageName === "react"
          ? reactRuntimeExports
          : [],
    );
  });
}

test("@combric/tailwind exposes its public CSS entry point", async () => {
  const packageUrl = new URL("../packages/tailwind/", import.meta.url);
  const manifest = JSON.parse(
    await readFile(new URL("package.json", packageUrl), "utf8"),
  );

  assert.equal(manifest.exports["."], "./dist/index.css");
  await access(new URL(manifest.exports["."], packageUrl));
});

test("@combric/layout exposes its framework-independent CSS entry point", async () => {
  const packageUrl = new URL("../packages/layout/", import.meta.url);
  const manifest = JSON.parse(
    await readFile(new URL("package.json", packageUrl), "utf8"),
  );

  assert.equal(manifest.exports["."], "./dist/index.css");
  assert.equal(manifest.exports["./css"], "./dist/index.css");
  await access(new URL(manifest.exports["./css"], packageUrl));
});

test("@combric/react exposes its public CSS entry point", async () => {
  const packageUrl = new URL("../packages/react/", import.meta.url);
  const manifest = JSON.parse(
    await readFile(new URL("package.json", packageUrl), "utf8"),
  );

  assert.equal(manifest.exports["./css"], "./dist/index.css");
  await access(new URL(manifest.exports["./css"], packageUrl));
});
