import nacl from 'tweetnacl'
import { encodeBase64, decodeBase64, encodeUTF8, decodeUTF8 } from 'tweetnacl-util'

// Generate a new keypair
export function generateKeypair() {
  const keypair = nacl.box.keyPair()
  return {
    publicKey: encodeBase64(keypair.publicKey),
    secretKey: encodeBase64(keypair.secretKey)
  }
}

// Save keypair to localStorage
export function saveKeypair(publicKey, secretKey) {
  localStorage.setItem('publicKey', publicKey)
  localStorage.setItem('secretKey', secretKey)
}

// Get keypair from localStorage
export function getKeypair() {
  const publicKey = localStorage.getItem('publicKey')
  const secretKey = localStorage.getItem('secretKey')
  if (!publicKey || !secretKey) return null
  return { publicKey, secretKey }
}

// Encrypt a message for a recipient
export function encryptMessage(message, recipientPublicKeyB64, senderSecretKeyB64) {
  const recipientPublicKey = decodeBase64(recipientPublicKeyB64)
  const senderSecretKey = decodeBase64(senderSecretKeyB64)
  const nonce = nacl.randomBytes(nacl.box.nonceLength)
  const messageUint8 = encodeUTF8(message)
  const encrypted = nacl.box(messageUint8, nonce, recipientPublicKey, senderSecretKey)
  return {
    encrypted: encodeBase64(encrypted),
    nonce: encodeBase64(nonce)
  }
}

// Decrypt a message
export function decryptMessage(encryptedB64, nonceB64, senderPublicKeyB64, recipientSecretKeyB64) {
  try {
    const encrypted = decodeBase64(encryptedB64)
    const nonce = decodeBase64(nonceB64)
    const senderPublicKey = decodeBase64(senderPublicKeyB64)
    const recipientSecretKey = decodeBase64(recipientSecretKeyB64)
    const decrypted = nacl.box.open(encrypted, nonce, senderPublicKey, recipientSecretKey)
    if (!decrypted) return null
    return decodeUTF8(decrypted)
  } catch {
    return null
  }
}
