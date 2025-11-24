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

const pattern = /case \.failed:\n\s*return RequestFailedException\(\)\n\s*}\n/;

if (!pattern.test(content)) {
  console.warn('[fix-apple-auth-switch] Could not find switch tail; manual review needed.');
  process.exit(1);
}

const replacement =
  'case .failed:\n    return RequestFailedException()\n' +
  '  @unknown default:\n    return RequestUnknownException()\n' +
  '  }\n';

content = content.replace(pattern, replacement);
fs.writeFileSync(appleExceptionPath, content);
console.log('[fix-apple-auth-switch] Added @unknown default to ASAuthorizationError switch.');
