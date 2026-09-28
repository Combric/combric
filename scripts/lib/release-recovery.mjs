export const RECOVERY_APPROVAL = "RECOVERY APPROVED";

export function parseApprovedPackageList(value) {
  if (value == null || value.trim() === "") return [];
  const names = value.split(",").map((name) => name.trim());
  if (names.some((name) => !name))
    throw new Error("Recovery package list contains an empty package name");
  if (new Set(names).size !== names.length)
    throw new Error("Recovery package list contains duplicate package names");
  return names;
}

export function assertPackagesInContract(names, contract) {
  const known = new Set(contract.packages.map(({ name }) => name));
  const unknown = names.filter((name) => !known.has(name));
  if (unknown.length)
    throw new Error(
      `Recovery package list contains packages outside the release contract: ${unknown.join(", ")}`,
    );
  return new Set(names);
}

export function parseApprovedPackages(value, contract) {
  return assertPackagesInContract(parseApprovedPackageList(value), contract);
}
