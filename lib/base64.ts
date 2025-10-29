export function decodeBase64ToArrayBuffer(base64: string) {
  const cleaned = base64.replace(/\s/g, '')
  const padding = cleaned.endsWith('==') ? 2 : cleaned.endsWith('=') ? 1 : 0
  const byteLength = (cleaned.length * 3) / 4 - padding
  const array = new Uint8Array(byteLength)

  let buffer = 0
  let bits = 0
  let index = 0

  for (let i = 0; i < cleaned.length; i += 1) {
    const char = cleaned[i]
    if (char === '=') {
      break
    }

    const value = BASE64_ALPHABET.indexOf(char)
    if (value === -1) {
      continue
    }

    buffer = (buffer << 6) | value
    bits += 6

    if (bits >= 8) {
      bits -= 8
      array[index] = (buffer >> bits) & 0xff
      index += 1
    }
  }

  return array.buffer.slice(0, index)
}

const BASE64_ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/'
