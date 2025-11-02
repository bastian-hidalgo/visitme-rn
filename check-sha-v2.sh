#!/bin/bash

APK_PATH="$1"
EXPECTED_SHA1="24:22:7A:7B:71:CE:85:82:17:AC:CB:FF:2B:23:46:80:6D:C1:D5:2C"

if [ -z "$APK_PATH" ]; then
  echo "❌ Uso: ./check-sha-v2.sh <ruta-del-apk>"
  exit 1
fi

echo "VISITME::SHA 🔍 Verificando firma de $APK_PATH"
echo "-----------------------------------------------"

# Ejecuta apksigner y filtra la línea SHA-1
SIGNER_INFO=$($ANDROID_HOME/build-tools/36.1.0/apksigner verify --print-certs "$APK_PATH" 2>/dev/null)
ACTUAL_SHA1=$(echo "$SIGNER_INFO" | grep 'SHA-1 digest:' | sed 's/.*SHA-1 digest: //')

if [ -z "$ACTUAL_SHA1" ]; then
  echo "⚠️  No se pudo obtener el SHA1 (¿APK firmado?)."
  echo "$SIGNER_INFO"
  exit 1
fi

echo "🔑 SHA1 actual del APK: $ACTUAL_SHA1"
echo "🔐 SHA1 esperado:       $EXPECTED_SHA1"

# Comparación
if [[ "$ACTUAL_SHA1" == "$EXPECTED_SHA1" ]]; then
  echo -e "\033[0;32m✅ Coincide con tu debug.keystore\033[0m"
else
  echo -e "\033[0;31m❌ NO coincide con tu debug.keystore\033[0m"
fi
