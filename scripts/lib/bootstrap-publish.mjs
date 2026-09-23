export function bootstrapPublishArguments(artifactPath, distTag) {
  return [
    "publish",
    artifactPath,
    "--access",
    "public",
    "--provenance=false",
    "--tag",
    distTag,
  ];
}
