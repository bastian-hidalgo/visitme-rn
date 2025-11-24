const fs = require('fs');
const path = require('path');

const appleExceptionPath = path.join(
  process.cwd(),
  'node_modules',
  'expo-apple-authentication',
  'ios',
  'AppleAuthenticationExceptions.swift'
);

if (!fs.existsSync(appleExceptionPath)) {
  console.warn('[fix-apple-auth-switch] expo-apple-authentication is not installed; skipping patch.');
  process.exit(0);
}

const content = fs.readFileSync(appleExceptionPath, 'utf8');

const switchStart = content.indexOf('switch error.code');

if (switchStart === -1) {
  console.warn('[fix-apple-auth-switch] Could not locate switch(error.code) block; leaving file untouched.');
  process.exit(0);
}

const braceStart = content.indexOf('{', switchStart);

if (braceStart === -1) {
  console.warn('[fix-apple-auth-switch] Found switch but no opening brace; leaving file untouched.');
  process.exit(0);
}

let depth = 0;
let braceEnd = -1;

for (let i = braceStart; i < content.length; i += 1) {
  const char = content[i];
  if (char === '{') depth += 1;
  if (char === '}') depth -= 1;
  if (depth === 0) {
    braceEnd = i;
    break;
  }
}

if (braceEnd === -1) {
  console.warn('[fix-apple-auth-switch] Could not find closing brace for switch; leaving file untouched.');
  process.exit(0);
}

const switchBlock = content.slice(braceStart + 1, braceEnd);
const caseIndentMatch =
  switchBlock.match(/\n(\s*)case\s+\.failed:/) || switchBlock.match(/\n(\s*)case\s+\.unknown:/);
const indent = caseIndentMatch?.[1] ?? '  ';

const defaultIndex = switchBlock.indexOf('@unknown default:');

if (defaultIndex !== -1) {
  const lines = switchBlock.split('\n');
  const defaultLineIndex = lines.findIndex((line) => line.includes('@unknown default:'));

  if (defaultLineIndex === -1) {
    console.warn('[fix-apple-auth-switch] Could not re-locate @unknown default line; leaving file untouched.');
    process.exit(0);
  }

  let blockEnd = lines.length;
  for (let i = defaultLineIndex + 1; i < lines.length; i += 1) {
    if (/^\s*case\s+\.[^:\n]+:/.test(lines[i]) || /@unknown default:/.test(lines[i])) {
      blockEnd = i;
      break;
    }
  }

  const defaultBlock = lines.slice(defaultLineIndex, blockEnd);
  const withoutDefault = [...lines.slice(0, defaultLineIndex), ...lines.slice(blockEnd)];

  // If default is already last, exit.
  if (blockEnd === lines.length) {
    console.log('[fix-apple-auth-switch] Switch already exhaustive; no changes needed.');
    process.exit(0);
  }

  // Preserve a trailing blank line before reinserting to avoid tightening formatting.
  if (withoutDefault.length && withoutDefault[withoutDefault.length - 1].trim() !== '') {
    withoutDefault.push(indent);
  }

  const patchedBlock = [...withoutDefault, ...defaultBlock].join('\n');
  const updatedContent = `${content.slice(0, braceStart + 1)}${patchedBlock}\n${content.slice(braceEnd)}`;
  fs.writeFileSync(appleExceptionPath, updatedContent);
  console.log('[fix-apple-auth-switch] Moved existing @unknown default to the end of the switch.');
  process.exit(0);
}

const needsTrailingNewline = !switchBlock.endsWith('\n');
const insertion = `${needsTrailingNewline ? '\n' : ''}${indent}@unknown default:\n${indent}  return RequestUnknownException()\n`;
const patchedBlock = `${switchBlock.replace(/\s*$/, '')}${insertion}`;

const updatedContent = `${content.slice(0, braceStart + 1)}${patchedBlock}\n${content.slice(braceEnd)}`;
fs.writeFileSync(appleExceptionPath, updatedContent);
console.log('[fix-apple-auth-switch] Added @unknown default to ASAuthorizationError switch.');
