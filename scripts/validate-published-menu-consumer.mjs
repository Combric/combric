import { spawnSync } from "node:child_process";
import { mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import {
  loadReleaseContract,
  releaseMetadata,
} from "./lib/release-contract.mjs";

const root = fileURLToPath(new URL("../", import.meta.url));
const temporary = await mkdtemp(
  join(tmpdir(), "combric-published-menu-consumer-"),
);
const { contract } = await loadReleaseContract(root);
const metadata = releaseMetadata(contract);

function run(command, arguments_, cwd) {
  const pnpmEntry = process.env.npm_execpath;
  if (command === "pnpm" && !pnpmEntry) {
    throw new Error("npm_execpath is required to locate the active pnpm CLI");
  }

  const executable = command === "pnpm" ? process.execPath : command;
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

  return result.stdout.trim();
}

try {
  const dependencies = {
    "@combric/layout": contract.version,
    "@combric/menu": contract.version,
    "@combric/react": contract.version,
    "@combric/tokens": contract.version,
    react: "19.3.0",
    "react-dom": "19.3.0",
  };
  const devDependencies = {
    "@types/react": "19.3.0",
    "@types/react-dom": "19.3.0",
    typescript: "6.0.3",
  };

  await writeFile(
    join(temporary, "package.json"),
    `${JSON.stringify(
      {
        name: "combric-published-menu-consumer",
        private: true,
        type: "module",
        dependencies,
        devDependencies,
      },
      null,
      2,
    )}\n`,
    "utf8",
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
} from "@combric/menu";

const consumer = <>
  <ActionMenu><ActionMenuTrigger>Actions</ActionMenuTrigger><ActionMenuContent><ActionMenuItem>Edit</ActionMenuItem></ActionMenuContent></ActionMenu>
  <ContextMenu><ContextMenuTrigger>Workspace</ContextMenuTrigger><ContextMenuContent><ContextMenuItem>Paste</ContextMenuItem></ContextMenuContent></ContextMenu>
  <NavigationMenu defaultValue="products"><NavigationMenuList><NavigationMenuItem value="products"><NavigationMenuTrigger>Products</NavigationMenuTrigger><NavigationMenuContent><a href="/atlas">Atlas</a></NavigationMenuContent></NavigationMenuItem></NavigationMenuList></NavigationMenu>
  <Menubar defaultValue="file"><MenubarMenu value="file"><MenubarTrigger>File</MenubarTrigger><MenubarContent><MenubarItem>New</MenubarItem></MenubarContent></MenubarMenu></Menubar>
  <BottomNavigation aria-label="Primary"><BottomNavigationList><BottomNavigationLink active href="/home">Home</BottomNavigationLink></BottomNavigationList></BottomNavigation>
</>;
void consumer;
`,
    "utf8",
  );
  await writeFile(
    join(temporary, "tsconfig.json"),
    `${JSON.stringify(
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
    )}\n`,
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
if (!actionMarkup.includes("Actions")) {
  throw new Error("Published ActionMenu API failed");
}

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
if (
  !navigationMarkup.includes('aria-expanded="true"') ||
  !navigationMarkup.includes('role="region"')
) {
  throw new Error("Published NavigationMenu API failed");
}

const menuCss = await readFile(
  new URL(import.meta.resolve("@combric/menu/css")),
  "utf8",
);
if (!menuCss.includes(".combric-navigation-menu")) {
  throw new Error("Published menu CSS contract failed");
}

const manifest = JSON.parse(
  await readFile(
    join(process.cwd(), "node_modules", "@combric", "menu", "package.json"),
    "utf8",
  ),
);
if (manifest.version !== ${JSON.stringify(contract.version)}) {
  throw new Error("Published menu version does not match the release contract");
}
`,
    "utf8",
  );

  const registry = "https://registry.npmjs.org";
  const taggedVersion = run(
    "pnpm",
    [
      "view",
      `@combric/menu@${metadata.distTag}`,
      "version",
      "--registry",
      registry,
    ],
    temporary,
  );
  if (taggedVersion !== contract.version) {
    throw new Error(
      `@combric/menu@${metadata.distTag} resolves to ${taggedVersion}, not ${contract.version}`,
    );
  }
  run(
    "pnpm",
    ["install", "--ignore-scripts", "--registry", registry],
    temporary,
  );
  run("node", ["consumer.mjs"], temporary);
  run("pnpm", ["exec", "tsc", "-p", "tsconfig.json"], temporary);
  console.log(
    `Validated published @combric/menu@${contract.version} consumer from ${metadata.distTag}.`,
  );
} finally {
  await rm(temporary, { recursive: true, force: true });
}
