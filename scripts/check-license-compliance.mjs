import { execSync } from "node:child_process";

const deniedPatterns = [/AGPL/i, /GPL/i, /LGPL/i, /SSPL/i];
const allowListedPackages = new Set([
  "next",
  "react",
  "react-dom",
  "@img/sharp-libvips-darwin-arm64",
  "@img/sharp-libvips-darwin-x64",
]);
const safeDualLicensePatterns = [/MIT/i, /Apache/i, /BSD/i, /ISC/i];

function extractJson(output) {
  const start = output.search(/[\[{]/);
  if (start === -1) {
    throw new Error("Could not find JSON payload in pnpm licenses output.");
  }
  return output.slice(start);
}

function flattenEntries(node) {
  if (!node) return [];
  if (Array.isArray(node)) {
    return node.flatMap(flattenEntries);
  }
  const results = [];
  if (node.name || node.license || node.licenses) {
    results.push(node);
  }
  for (const value of Object.values(node)) {
    if (value && typeof value === "object") {
      results.push(...flattenEntries(value));
    }
  }
  return results;
}

const raw = execSync("pnpm licenses list --json", {
  encoding: "utf8",
  stdio: ["ignore", "pipe", "pipe"],
});

const parsed = JSON.parse(extractJson(raw));
const entries = flattenEntries(parsed);

const violations = entries.filter((entry) => {
  const pkg = entry.name || "";
  const license = entry.license || entry.licenses || "";
  if (!license || allowListedPackages.has(pkg)) return false;
  if (safeDualLicensePatterns.some((pattern) => pattern.test(String(license)))) {
    return false;
  }
  return deniedPatterns.some((pattern) => pattern.test(String(license)));
});

if (violations.length > 0) {
  console.error("License compliance check failed. Disallowed licenses found:");
  for (const violation of violations) {
    console.error(
      `- ${violation.name || "unknown-package"}@${
        violation.version || "unknown-version"
      }: ${violation.license || violation.licenses || "unknown-license"}`,
    );
  }
  process.exit(1);
}

console.log(`License compliance check passed for ${entries.length} dependency entries.`);
