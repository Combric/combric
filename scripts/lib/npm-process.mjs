import { existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { spawnSync } from "node:child_process";

export function resolveNpmInvocation({
  platform = process.platform,
  nodePath = process.execPath,
  npmCliPath,
} = {}) {
  if (npmCliPath && /\.(?:c|m)?js$/i.test(npmCliPath))
    return { executable: nodePath, prefix: [npmCliPath], shell: false };
  if (platform === "win32") {
    const bundled = join(
      dirname(nodePath),
      "node_modules",
      "npm",
      "bin",
      "npm-cli.js",
    );
    if (existsSync(bundled))
      return { executable: nodePath, prefix: [bundled], shell: false };
    return { executable: "npm.cmd", prefix: [], shell: true };
  }
  return { executable: "npm", prefix: [], shell: false };
}

export function runNpm(args, options = {}) {
  const invocation = resolveNpmInvocation(options);
  return spawnSync(invocation.executable, [...invocation.prefix, ...args], {
    cwd: options.cwd,
    env: options.env,
    encoding: "utf8",
    shell: invocation.shell,
    stdio: options.stdio ?? "inherit",
  });
}
