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

let content = fs.readFileSync(appleExceptionPath, 'utf8');

if (content.includes('@unknown default')) {
  console.log('[fix-apple-auth-switch] Switch already exhaustive; no changes needed.');
  process.exit(0);
}

const switchMatch = content.match(/(switch\s+error\.code\s*\{\n)([\s\S]*?)(\n\s*\})/m);

if (!switchMatch) {
  console.warn('[fix-apple-auth-switch] Could not locate switch(error.code) block.');
  process.exit(1);
}

const [fullMatch, prefix, body, suffix] = switchMatch;
const failedCasePattern = /(case\s+\.failed:[\s\S]*?return\s+RequestFailedException\(\)\s*)/m;
const indentMatch = body.match(/\n(\s*)case\s+\.failed:/);
const indent = indentMatch?.[1] ?? '  ';

if (!failedCasePattern.test(body)) {
  console.warn('[fix-apple-auth-switch] Could not find .failed case to append @unknown default.');
  process.exit(1);
}

const patchedBody = body.replace(
  failedCasePattern,
  `$1\n${indent}@unknown default:\n${indent}  return RequestUnknownException()\n`
);

content = content.replace(fullMatch, `${prefix}${patchedBody}${suffix}`);
fs.writeFileSync(appleExceptionPath, content);
console.log('[fix-apple-auth-switch] Added @unknown default to ASAuthorizationError switch.');
