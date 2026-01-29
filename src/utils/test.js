import CryptoJS from 'crypto-js';

const generateRandomBytes = (length = 16) => CryptoJS.lib.WordArray.random(length);

// Encrypt JSON securely
export const handleEncrypt = (data, password) => {
  const salt = generateRandomBytes(16);
  const iv = generateRandomBytes(16);
  const key = CryptoJS.PBKDF2(password, salt, { keySize: 256 / 32, iterations: 1000 });

  const jsonString = JSON.stringify(data);
  const encrypted = CryptoJS.AES.encrypt(jsonString, key, { iv });

  // Combine salt + iv + ciphertext (all base64 encoded)
  const payload = {
    salt: salt.toString(CryptoJS.enc.Hex),
    iv: iv.toString(CryptoJS.enc.Hex),
    ciphertext: encrypted.toString(),
  };

  return JSON.stringify(payload);
};

// Decrypt JSON securely
export const handleDecrypt = (encryptedPayload, password) => {
  try {
    const payload = JSON.parse(encryptedPayload);
    const salt = CryptoJS.enc.Hex.parse(payload.salt);
    const iv = CryptoJS.enc.Hex.parse(payload.iv);
    const ciphertext = payload.ciphertext;

    const key = CryptoJS.PBKDF2(password, salt, { keySize: 256 / 32, iterations: 1000 });
    const decrypted = CryptoJS.AES.decrypt(ciphertext, key, { iv });

    const decryptedString = decrypted.toString(CryptoJS.enc.Utf8);
    return JSON.parse(decryptedString);
  } catch (err) {
    console.error('Secure decryption failed:', err.message);
    return null;
  }
};


const jsonData = { message: "Hello, world!", timestamp: new Date().toISOString() };
const password = "strongPassword123";

const encrypted = handleEncrypt(jsonData, password);

const decrypted = handleDecrypt(encrypted, password);
