const fs = require('fs');
const path = require('path');

const packageJsonPath = path.join(__dirname, '..', 'package.json');
const appConfigPath = path.join(__dirname, '..', 'app.config.ts');

// Read current package.json
const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
const oldVersion = packageJson.version;

// Split version and increment minor (middle number) as requested (1.52.0 -> 1.53.0)
const parts = oldVersion.split('.');
if (parts.length === 3) {
  parts[1] = parseInt(parts[1], 10) + 1;
  parts[2] = 0; // Reset patch
} else {
  // Fallback if version format is unusual
  parts[parts.length - 1] = parseInt(parts[parts.length - 1], 10) + 1;
}
const newVersion = parts.join('.');

// Update package.json
packageJson.version = newVersion;
fs.writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2) + '\n');
console.log(`\x1b[32m✔\x1b[0m package.json version updated: ${oldVersion} -> ${newVersion}`);

// Update app.config.ts
let appConfigContent = fs.readFileSync(appConfigPath, 'utf8');

// Update version string
const versionRegex = /version:\s*'[^']*'/;
appConfigContent = appConfigContent.replace(versionRegex, `version: '${newVersion}'`);

// Also increment versionCode (recommended for Android builds)
const versionCodeRegex = /versionCode:\s*(\d+)/;
const versionCodeMatch = appConfigContent.match(versionCodeRegex);
if (versionCodeMatch) {
  const oldCode = parseInt(versionCodeMatch[1], 10);
  const newCode = oldCode + 1;
  appConfigContent = appConfigContent.replace(versionCodeRegex, `versionCode: ${newCode}`);
  console.log(`\x1b[32m✔\x1b[0m app.config.ts versionCode updated: ${oldCode} -> ${newCode}`);
}

fs.writeFileSync(appConfigPath, appConfigContent);
console.log(`\x1b[32m✔\x1b[0m app.config.ts version updated: ${newVersion}`);
