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
  "Alert",
  "AlertDescription",
  "AlertTitle",
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
  "Collapsible",
  "CollapsibleContent",
  "CollapsibleTrigger",
  "Container",
  "DescriptionDetails",
  "DescriptionList",
  "DescriptionTerm",
  "Dialog",
  "DialogClose",
  "DialogContent",
  "DialogDescription",
  "DialogTitle",
  "DialogTrigger",
  "Drawer",
  "DrawerClose",
  "DrawerContent",
  "DrawerDescription",
  "DrawerTitle",
  "DrawerTrigger",
  "DropdownMenu",
  "DropdownMenuContent",
  "DropdownMenuItem",
  "DropdownMenuSeparator",
  "DropdownMenuTrigger",
  "EmptyState",
  "EmptyStateActions",
  "EmptyStateDescription",
  "EmptyStateMedia",
  "EmptyStateTitle",
  "Field",
  "FieldDescription",
  "FieldLegend",
  "FieldMessage",
  "Fieldset",
  "Grid",
  "Inline",
  "Input",
  "InputGroup",
  "Label",
  "Pagination",
  "PaginationItem",
  "PaginationLink",
  "PaginationList",
  "PaginationNext",
  "PaginationPrevious",
  "Popover",
  "PopoverContent",
  "PopoverTrigger",
  "Progress",
  "Radio",
  "RadioGroup",
  "Select",
  "Separator",
  "Sheet",
  "SheetClose",
  "SheetContent",
  "SheetDescription",
  "SheetTitle",
  "SheetTrigger",
  "Skeleton",
  "Slider",
  "Spinner",
  "Stack",
  "Switch",
  "Table",
  "TableBody",
  "TableCaption",
  "TableCell",
  "TableContainer",
  "TableFooter",
  "TableHead",
  "TableHeader",
  "TableRow",
  "Tabs",
  "TabsContent",
  "TabsList",
  "TabsTrigger",
  "Textarea",
  "Toast",
  "ToastClose",
  "ToastDescription",
  "ToastTitle",
  "ToastViewport",
  "Toggle",
  "ToggleGroup",
  "ToggleGroupItem",
  "Tooltip",
  "TooltipContent",
  "TooltipTrigger",
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
