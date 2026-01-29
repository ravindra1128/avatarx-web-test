const encryptData = async (text, userKey) => {
    const encoder = new TextEncoder();
    const key = await window.crypto.subtle.importKey(
      "raw",
      encoder.encode(userKey),
      { name: "AES-GCM" },
      false,
      ["encrypt"]
    );
  
    const iv = window.crypto.getRandomValues(new Uint8Array(12));
    const encrypted = await window.crypto.subtle.encrypt(
      { name: "AES-GCM", iv },
      key,
      encoder.encode(text)
    );
  
    return {
      iv: Array.from(iv),
      encrypted: btoa(String.fromCharCode(...new Uint8Array(encrypted))),
    };
  };

  const decryptData = async (encryptedData, iv, userKey) => {
    const encoder = new TextEncoder();
    const key = await window.crypto.subtle.importKey(
      "raw",
      encoder.encode(userKey),
      { name: "AES-GCM" },
      false,
      ["decrypt"]
    );
  
    const decrypted = await window.crypto.subtle.decrypt(
      { name: "AES-GCM", iv: new Uint8Array(iv) },
      key,
      new Uint8Array(atob(encryptedData).split("").map(char => char.charCodeAt(0)))
    );
  
    return new TextDecoder().decode(decrypted);
  };

  async function deriveUserKey(password, salt) {
    const encoder = new TextEncoder();
    const keyMaterial = await window.crypto.subtle.importKey(
      "raw",
      encoder.encode(password),
      { name: "PBKDF2" },
      false,
      ["deriveKey"]
    );
  
    const key = await window.crypto.subtle.deriveKey(
      {
        name: "PBKDF2",
        salt: encoder.encode(salt),
        iterations: 100000,
        hash: "SHA-256",
      },
      keyMaterial,
      { name: "AES-GCM", length: 256 },
      true,
      ["encrypt", "decrypt"]
    );
  
    const exportedKey = await window.crypto.subtle.exportKey("raw", key);
    return btoa(String.fromCharCode(...new Uint8Array(exportedKey))); // Base64 encoding for storage
  }

  const storeUserKey = (userKey) => {
    localStorage.setItem("userKey", userKey);
  }

  const getUserKey = () => {
    return localStorage.getItem("userKey");
  }

  const deleteUserKey = () => {
    localStorage.removeItem("userKey");
  }
  
  export { encryptData, decryptData, deriveUserKey, storeUserKey, getUserKey, deleteUserKey };