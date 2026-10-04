import { spawnSync } from "node:child_process";
import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

const root = fileURLToPath(new URL("../", import.meta.url));
const temporary = await mkdtemp(
  join(tmpdir(), "combric-packed-menu-consumer-"),
);
const packages = ["tokens", "layout", "react", "menu"];

function run(command, arguments_, cwd) {
  const pnpmEntry = process.env.npm_execpath;
  if (command === "pnpm" && !pnpmEntry) {
    throw new Error("npm_execpath is required to locate the active pnpm CLI");
  }

  const executable =
    command === "node" || command === "pnpm" ? process.execPath : command;
  const spawnArguments =
    command === "pnpm" ? [pnpmEntry, ...arguments_] : arguments_;
  const result = spawnSync(executable, spawnArguments, {
    cwd,
    encoding: "utf8",
  });

  if (result.status !== 0) {
    throw new Error(
      `${command} ${arguments_.join(" ")} failed:\n${result.stdout}\n${result.stderr}`,
    );
  }

  return result.stdout;
}

try {
  const dependencies = {
    "@types/react": "19.3.0",
    "@types/react-dom": "19.3.0",
    react: "19.3.0",
    "react-dom": "19.3.0",
    typescript: "6.0.3",
  };
  const overrides = [];

  for (const packageName of packages) {
    const packageDirectory = join(root, "packages", packageName);
    const manifest = JSON.parse(
      await readFile(join(packageDirectory, "package.json"), "utf8"),
    );
    const filename = `combric-${packageName}-${manifest.version}.tgz`;

    run("pnpm", ["pack", "--pack-destination", temporary], packageDirectory);
    dependencies[`@combric/${packageName}`] = `file:./${filename}`;
    overrides.push(`  '@combric/${packageName}': file:./${filename}`);
  }

  await writeFile(
    join(temporary, "package.json"),
    JSON.stringify({ private: true, type: "module", dependencies }, null, 2),
  );
  await writeFile(
    join(temporary, "consumer.tsx"),
    `import {
  ActionMenu,
  ActionMenuContent,
  ActionMenuItem,
  ActionMenuTrigger,
  BottomNavigation,
  BottomNavigationLink,
  BottomNavigationList,
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuTrigger,
  Menubar,
  MenubarContent,
  MenubarItem,
  MenubarMenu,
  MenubarTrigger,
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuList,
  NavigationMenuTrigger,
  type NavigationMenuProps,
} from "@combric/menu";

const navigationProps: NavigationMenuProps = { "aria-label": "Products" };
const menu = <>
  <ActionMenu><ActionMenuTrigger>Actions</ActionMenuTrigger><ActionMenuContent><ActionMenuItem>Edit</ActionMenuItem></ActionMenuContent></ActionMenu>
  <ContextMenu><ContextMenuTrigger>Workspace</ContextMenuTrigger><ContextMenuContent><ContextMenuItem>Paste</ContextMenuItem></ContextMenuContent></ContextMenu>
  <NavigationMenu {...navigationProps} defaultValue="products"><NavigationMenuList><NavigationMenuItem value="products"><NavigationMenuTrigger>Products</NavigationMenuTrigger><NavigationMenuContent><a href="/atlas">Atlas</a></NavigationMenuContent></NavigationMenuItem></NavigationMenuList></NavigationMenu>
  <Menubar defaultValue="file"><MenubarMenu value="file"><MenubarTrigger>File</MenubarTrigger><MenubarContent><MenubarItem>New</MenubarItem></MenubarContent></MenubarMenu></Menubar>
  <BottomNavigation aria-label="Primary"><BottomNavigationList><BottomNavigationLink active href="/home">Home</BottomNavigationLink></BottomNavigationList></BottomNavigation>
</>;
void menu;
`,
    "utf8",
  );
  await writeFile(
    join(temporary, "tsconfig.json"),
    JSON.stringify(
      {
        compilerOptions: {
          jsx: "react-jsx",
          module: "NodeNext",
          moduleResolution: "NodeNext",
          noEmit: true,
          skipLibCheck: true,
          strict: true,
          target: "ES2022",
        },
        include: ["consumer.tsx"],
      },
      null,
      2,
    ),
    "utf8",
  );
  await writeFile(
    join(temporary, "pnpm-workspace.yaml"),
    `overrides:\n${overrides.join("\n")}\n`,
    "utf8",
  );
  await writeFile(
    join(temporary, "consumer.mjs"),
    `import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import {
  ActionMenu,
  ActionMenuContent,
  ActionMenuItem,
  ActionMenuTrigger,
  BottomNavigation,
  BottomNavigationLink,
  BottomNavigationList,
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuTrigger,
  Menubar,
  MenubarContent,
  MenubarItem,
  MenubarMenu,
  MenubarTrigger,
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuList,
  NavigationMenuTrigger,
} from "@combric/menu";

const actionMarkup = renderToStaticMarkup(
  createElement(
    ActionMenu,
    null,
    createElement(ActionMenuTrigger, null, "Actions"),
    createElement(
      ActionMenuContent,
      null,
      createElement(ActionMenuItem, null, "Edit"),
    ),
  ),
);
if (!actionMarkup.includes("Actions")) throw new Error("Packed ActionMenu API failed");

const contextMarkup = renderToStaticMarkup(
  createElement(
    ContextMenu,
    null,
    createElement(ContextMenuTrigger, null, "Workspace"),
    createElement(
      ContextMenuContent,
      null,
      createElement(ContextMenuItem, null, "Paste"),
    ),
  ),
);
if (!contextMarkup.includes("Workspace")) throw new Error("Packed ContextMenu API failed");

const navigationMarkup = renderToStaticMarkup(
  createElement(
    NavigationMenu,
    { "aria-label": "Products", defaultValue: "products" },
    createElement(
      NavigationMenuList,
      null,
      createElement(
        NavigationMenuItem,
        { value: "products" },
        createElement(NavigationMenuTrigger, null, "Products"),
        createElement(
          NavigationMenuContent,
          null,
          createElement("a", { href: "/atlas" }, "Atlas"),
        ),
      ),
    ),
  ),
);
if (!navigationMarkup.includes('aria-expanded="true"') || !navigationMarkup.includes('role="region"')) throw new Error("Packed NavigationMenu API failed");

const menubarMarkup = renderToStaticMarkup(
  createElement(
    Menubar,
    { defaultValue: "file" },
    createElement(
      MenubarMenu,
      { value: "file" },
      createElement(MenubarTrigger, null, "File"),
      createElement(MenubarContent, null, createElement(MenubarItem, null, "New")),
    ),
  ),
);
if (!menubarMarkup.includes('role="menubar"') || !menubarMarkup.includes('role="menu"')) throw new Error("Packed Menubar API failed");

const bottomNavigationMarkup = renderToStaticMarkup(
  createElement(
    BottomNavigation,
    { "aria-label": "Primary" },
    createElement(
      BottomNavigationList,
      null,
      createElement(BottomNavigationLink, { active: true, href: "/home" }, "Home"),
    ),
  ),
);
if (!bottomNavigationMarkup.includes('aria-current="page"') || !bottomNavigationMarkup.includes('href="/home"')) throw new Error("Packed BottomNavigation API failed");

const menuCss = await readFile(new URL(import.meta.resolve("@combric/menu/css")), "utf8");
for (const selector of [
  ".combric-action-menu",
  ".combric-navigation-menu",
  ".combric-menubar",
  ".combric-bottom-navigation",
]) {
  if (!menuCss.includes(selector)) throw new Error("Packed menu CSS is missing " + selector);
}

const manifest = JSON.parse(
  await readFile(
    join(process.cwd(), "node_modules", "@combric", "menu", "package.json"),
    "utf8",
  ),
);
if (
  manifest.name !== "@combric/menu" ||
  manifest.exports?.["."]?.import !== "./dist/index.js" ||
  manifest.exports?.["./css"] !== "./dist/index.css"
) {
  throw new Error("Packed menu metadata contract failed");
}
`,
    "utf8",
  );

  run("pnpm", ["install", "--offline", "--ignore-scripts"], temporary);
  run("node", ["consumer.mjs"], temporary);
  run("pnpm", ["exec", "tsc", "-p", "tsconfig.json"], temporary);
  console.log("Validated packed @combric/menu consumer.");
} finally {
  await rm(temporary, { recursive: true, force: true });
}
