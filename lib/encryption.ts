// lib/encryption.ts
const ALGORITHM = "AES-GCM"
const ITERATIONS = 100000
const KEY_LENGTH = 256
const HASH_ALGORITHM = "SHA-256"

async function getKeyMaterial(password: string): Promise<CryptoKey> {
  const encoder = new TextEncoder()
  return crypto.subtle.importKey(
    "raw",
    encoder.encode(password),
    { name: "PBKDF2" },
    false,
    ["deriveBits", "deriveKey"],
  )
}

async function getDerivedKey(keyMaterial: CryptoKey, salt: Uint8Array): Promise<CryptoKey> {
  return crypto.subtle.deriveKey(
    {
      name: "PBKDF2",
      salt: salt,
      iterations: ITERATIONS,
      hash: HASH_ALGORITHM,
    },
    keyMaterial,
    { name: ALGORITHM, length: KEY_LENGTH },
    true,
    ["encrypt", "decrypt"],
  );
}


export async function encryptData(data: string, password: string): Promise<string> {
  const salt = crypto.getRandomValues(new Uint8Array(16))
  const iv = crypto.getRandomValues(new Uint8Array(12)) // GCM recommended IV length is 12 bytes

  const keyMaterial = await getKeyMaterial(password)
  const key = await getDerivedKey(keyMaterial, salt)

  const encoder = new TextEncoder()
  const encrypted = await crypto.subtle.encrypt({ name: ALGORITHM, iv: iv }, key, encoder.encode(data))

  const encryptedArray = new Uint8Array(encrypted)
  const result = new Uint8Array(salt.length + iv.length + encryptedArray.length)
  result.set(salt, 0)
  result.set(iv, salt.length)
  result.set(encryptedArray, salt.length + iv.length)

  return btoa(String.fromCharCode(...result))
}

export async function decryptData(encryptedData: string, password: string): Promise<string | null> {
  try {
    const decoded = Uint8Array.from(atob(encryptedData), (c) => c.charCodeAt(0))

    const salt = decoded.slice(0, 16)
    const iv = decoded.slice(16, 16 + 12)
    const ciphertext = decoded.slice(16 + 12)

    const keyMaterial = await getKeyMaterial(password)
    const key = await getDerivedKey(keyMaterial, salt)

    const decrypted = await crypto.subtle.decrypt({ name: ALGORITHM, iv: iv }, key, ciphertext)

    const decoder = new TextDecoder()
    return decoder.decode(decrypted)
  } catch (error) {
    console.error("Decryption failed:", error)
    return null
  }
}
