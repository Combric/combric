export type PackageManager = "pnpm" | "npm" | "yarn" | "bun";
export type Mode = "css" | "react" | "tailwind" | "react-tailwind";

export interface CliConfig {
  schemaVersion: 1;
  packageManager: PackageManager;
  mode: Mode;
  cssFile: string;
}

export interface ProjectInfo {
  projectRoot: string;
  nodeVersion: string;
  packageManager: PackageManager | null;
  packageManagerEvidence: string[];
  packageManagerConflict: boolean;
  manifest: Record<string, unknown>;
  dependencies: Record<string, string>;
  installed: Record<string, string>;
  react: string | null;
  tailwind: string | null;
  combricPackages: Record<string, string>;
  config: CliConfig | null;
  configError: string | null;
  configUnknownFields: string[];
  cssImports: string[] | null;
  workspace: boolean;
  workspaceRoot: string | null;
}

export interface Diagnostic {
  severity: "pass" | "warning" | "error";
  code: string;
  message: string;
}

export interface PlannedAction {
  type: "install" | "update-css" | "create-config";
  target: string;
  reason: string;
  changesState: true;
  packages?: string[];
  content?: string;
  before?: string | null;
}

export interface InitPlan {
  projectRoot: string;
  packageManager: PackageManager;
  mode: Mode;
  cssFile: string;
  actions: PlannedAction[];
}

export class CliError extends Error {
  constructor(
    message: string,
    readonly code: string,
    readonly exitCode: 1 | 2 = 1,
  ) {
    super(message);
  }
}
