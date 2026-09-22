import { requiredImports, requiredPackages } from "./requirements.js";
import { supportsReact19, supportsTailwind4 } from "./inspect.js";
import type { Diagnostic, ProjectInfo } from "./model.js";

export function diagnose(project: ProjectInfo): Diagnostic[] {
  const checks: Diagnostic[] = [];
  const add = (
    severity: Diagnostic["severity"],
    code: string,
    message: string,
  ) => checks.push({ severity, code, message });
  if (Number(project.nodeVersion.split(".")[0]) < 24) {
    add("error", "NODE_UNSUPPORTED", "Node 24 or newer is required.");
  } else {
    add("pass", "NODE_SUPPORTED", `Node ${project.nodeVersion} is supported.`);
  }
  if (project.packageManagerConflict) {
    add(
      "error",
      "PACKAGE_MANAGER_CONFLICT",
      `Conflicting package-manager evidence: ${project.packageManagerEvidence.join(", ")}. Resolve it before init.`,
    );
  } else if (!project.packageManager) {
    add(
      "warning",
      "PACKAGE_MANAGER_UNKNOWN",
      "No package-manager evidence was found. Choose one explicitly for init.",
    );
  } else {
    add(
      "pass",
      "PACKAGE_MANAGER",
      `Package manager: ${project.packageManager}.`,
    );
  }
  if (project.configError) {
    add("error", "CONFIG_INVALID", project.configError);
  } else if (!project.config) {
    add(
      "warning",
      "NOT_CONFIGURED",
      "No combric.config.json exists. Use init to configure this project.",
    );
  } else {
    add("pass", "CONFIG_VALID", "Combric config schema 1 is valid.");
    if (project.configUnknownFields.length) {
      add(
        "warning",
        "CONFIG_UNKNOWN_FIELDS",
        `Unknown config fields: ${project.configUnknownFields.join(", ")}. Init will not rewrite them.`,
      );
    }
    for (const name of requiredPackages(project.config.mode)) {
      if (!project.dependencies[name])
        add(
          "error",
          "PACKAGE_MISSING",
          `${name} is required for ${project.config.mode} mode.`,
        );
      else add("pass", "PACKAGE_DECLARED", `${name} is declared.`);
      if (project.dependencies[name] && !project.installed[name]) {
        add(
          "warning",
          "PACKAGE_NOT_INSTALLED",
          `${name} is declared but was not found in node_modules. Run the selected package manager's install command.`,
        );
      }
    }
    if (project.config.mode.includes("react")) {
      if (
        !project.react ||
        !supportsReact19(project.react) ||
        !project.dependencies["react-dom"] ||
        !supportsReact19(project.dependencies["react-dom"])
      ) {
        add(
          "error",
          "REACT_UNSUPPORTED",
          "React and React DOM 19 are required for this mode.",
        );
      } else
        add("pass", "REACT_SUPPORTED", "React and React DOM 19 are declared.");
    }
    if (project.config.mode.includes("tailwind")) {
      if (!project.tailwind || !supportsTailwind4(project.tailwind)) {
        add(
          "error",
          "TAILWIND_UNSUPPORTED",
          "Tailwind CSS >=4.3 and <5 is required for this mode.",
        );
      } else
        add(
          "pass",
          "TAILWIND_SUPPORTED",
          "Compatible Tailwind v4 is declared.",
        );
    }
    if (!project.cssImports) {
      add(
        "error",
        "CSS_MISSING",
        `Configured CSS file ${project.config.cssFile} is missing or unsafe.`,
      );
    } else {
      const expectedImports = requiredImports(project.config.mode);
      const conflicting = project.cssImports.filter(
        (name) =>
          name.startsWith("@combric/") && !expectedImports.includes(name),
      );
      if (conflicting.length) {
        add(
          "error",
          "CSS_IMPORT_CONFLICT",
          `Unexpected Combric CSS imports: ${conflicting.join(", ")}.`,
        );
      }
      for (const name of requiredImports(project.config.mode)) {
        if (!project.cssImports.includes(name))
          add(
            "error",
            "CSS_IMPORT_MISSING",
            `CSS import ${name} is missing from ${project.config.cssFile}.`,
          );
      }
      if (
        !conflicting.length &&
        expectedImports.every((name) => project.cssImports?.includes(name))
      ) {
        add("pass", "CSS_READY", "Required public CSS imports are present.");
      }
    }
  }
  return checks;
}
