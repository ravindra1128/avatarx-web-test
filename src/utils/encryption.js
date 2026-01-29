import CryptoJS from 'crypto-js';

const generateRandomBytes = (length = 16) => CryptoJS.lib.WordArray.random(length);

const generateKeyPair = async () => {
    return await window.crypto.subtle.generateKey(
      {
        name: "RSA-OAEP",
        modulusLength: 4096,
        publicExponent: new Uint8Array([1, 0, 1]),
        hash: "SHA-256",
      },
      true,
      ["encrypt", "decrypt"]
    );
};


  const deriveAESKeyFromPassword = async (password, salt) => {
    const enc = new TextEncoder();
    const keyMaterial = await window.crypto.subtle.importKey(
      "raw",
      enc.encode(password),
      "PBKDF2",
      false,
      ["deriveKey"]
    );
  
    return await window.crypto.subtle.deriveKey(
      {
        name: "PBKDF2",
        salt,
        iterations: 100000,
        hash: "SHA-256",
      },
      keyMaterial,
      {
        name: "AES-GCM",
        length: 256,
      },
      true,
      ["encrypt", "decrypt"]
    );
  };


  const encryptPrivateKey = async (privateKey, aesKey) => {
    const exported = await window.crypto.subtle.exportKey("pkcs8", privateKey);
    const iv = window.crypto.getRandomValues(new Uint8Array(12));
  
    const encrypted = await window.crypto.subtle.encrypt(
      {
        name: "AES-GCM",
        iv,
      },
      aesKey,
      exported
    );
  
    return {
      iv: Array.from(iv),
      encryptedPrivateKey: Array.from(new Uint8Array(encrypted)),
    };
  };

  const exportPublicKey = async (publicKey) => {
    const spki = await window.crypto.subtle.exportKey("spki", publicKey);
    return btoa(String.fromCharCode(...new Uint8Array(spki))); // base64
  };

  
  export const setupEncryption = async (userPassword) => {
    // 1. Generate key pair
    const { publicKey, privateKey } = await generateKeyPair();
  
    // 2. Derive AES key from user password
    const salt = window.crypto.getRandomValues(new Uint8Array(16));
    const aesKey = await deriveAESKeyFromPassword(userPassword, salt);
  
    // 3. Encrypt private key
    const { iv, encryptedPrivateKey } = await encryptPrivateKey(privateKey, aesKey);
  
    // 4. Export public key
    const publicKeyBase64 = await exportPublicKey(publicKey);

    // 5. Store encrypted private key locally
    localStorage.setItem("privateKey", JSON.stringify(encryptedPrivateKey));
    localStorage.setItem("privateKeySalt", btoa(String.fromCharCode(...salt)));
    localStorage.setItem("privateKeyIV", JSON.stringify(iv));

    // await savePublicKey({
    //   public_key: publicKeyBase64,
    // });

    // 6. Return public key
    return publicKeyBase64

  };
  
  
  const getEncryptedPrivateKeyFromStorage = () => {
    const encrypted = JSON.parse(localStorage.getItem("privateKey"));
    const iv = new Uint8Array(JSON.parse(localStorage.getItem("privateKeyIV")));
    const salt = Uint8Array.from(atob(localStorage.getItem("privateKeySalt")), c => c.charCodeAt(0));
  
    return { encrypted, iv, salt };
  };

  const decryptPrivateKey = async (encryptedData, iv, aesKey) => {
    const decrypted = await window.crypto.subtle.decrypt(
      {
        name: "AES-GCM",
        iv,
      },
      aesKey,
      new Uint8Array(encryptedData)
    );
  
    return await window.crypto.subtle.importKey(
      "pkcs8",
      decrypted,
      {
        name: "RSA-OAEP",
        hash: "SHA-256",
      },
      true,
      ["decrypt"]
    );
  };
  
  const decryptVitals = async (encryptedBuffer, privateKey) => {
    const decrypted = await window.crypto.subtle.decrypt(
      {
        name: "RSA-OAEP"
      },
      privateKey,
      encryptedBuffer
    );
  
    const decoded = new TextDecoder().decode(decrypted);
    return JSON.parse(decoded);
  };
  

  export const setupDecryption = async (userPassword) => {
    // 1. Load encrypted private key
    const { encrypted, iv, salt } = getEncryptedPrivateKeyFromStorage();
  
    // 2. Derive AES key
    const aesKey = await deriveAESKeyFromPassword(userPassword, salt);
  
    // 3. Decrypt private key
    const privateKey = await decryptPrivateKey(encrypted, iv, aesKey);
  
    // 4. Get encrypted vitals
    const encryptedVitals = await fetchEncryptedVitals();
  
    // 5. Decrypt
    const decryptedVitals = await decryptVitals(encryptedVitals, privateKey);
  };
  
  export const encryptWithPublicKey = async (dataObj, publicKeyPemBase64) => {
      // Convert base64 PEM to binary
      const publicKeyBinary = Uint8Array.from(atob(publicKeyPemBase64), c => c.charCodeAt(0));

      // Import the public key
      const publicKey = await window.crypto.subtle.importKey(
        "spki",
        publicKeyBinary.buffer,
        {
          name: "RSA-OAEP",
          hash: "SHA-256",
        },
        false,
        ["encrypt"]
      );

      // Encode data as UTF-8
      const encoded = new TextEncoder().encode(JSON.stringify(dataObj));

      // Split data into chunks of 178 bytes (RSA-2048 limit)
      const chunkSize = 178;
      const chunks = [];
      for (let i = 0; i < encoded.length; i += chunkSize) {
        chunks.push(encoded.slice(i, i + chunkSize));
      }

      // Encrypt each chunk
      const encryptedChunks = await Promise.all(
        chunks.map(chunk =>
          window.crypto.subtle.encrypt(
            { name: "RSA-OAEP" },
            publicKey,
            chunk
          )
        )
      );

      // Combine encrypted chunks
      const combinedLength = encryptedChunks.reduce((sum, chunk) => sum + chunk.byteLength, 0);
      const combined = new Uint8Array(combinedLength);
      let offset = 0;
      encryptedChunks.forEach(chunk => {
        combined.set(new Uint8Array(chunk), offset);
        offset += chunk.byteLength;
      });


      // Convert to base64
      const encryptedBase64 = btoa(String.fromCharCode(...combined));
      return encryptedBase64;
  };
  
export const getUserPublicKey = async () => {
  const public_key = localStorage.getItem("public_key");
  return public_key;
};

export const getUserPassword = async () => {
  const password = localStorage.getItem("ciphertext");
  const salt = localStorage.getItem("salt");
  const iv = localStorage.getItem("iv");
  const decryptedData = await decryptData({ciphertext:password, salt:salt, iv:iv});
  return decryptedData;
};

export const setUserPublicKey = async (public_key) => {
  localStorage.setItem("public_key", public_key);
};


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
    return null;
  }
};

export const getKey = async (secret, salt) => {
  const enc = new TextEncoder();

  // Import the key material from the secret
  const keyMaterial = await crypto.subtle.importKey(
    "raw",
    enc.encode(secret),
    "PBKDF2",
    false,
    ["deriveKey"]
  );

  // Derive the AES key from the secret and salt using PBKDF2
  return crypto.subtle.deriveKey(
    {
      name: "PBKDF2",
      salt,
      iterations: 100000,
      hash: "SHA-256"
    },
    keyMaterial,
    { name: "AES-GCM", length: 256 },
    false,
    ["encrypt", "decrypt"]
  );
};

// Encrypt the password securely using AES with CryptoJS
export const encryptData = (password) => {
  try {
    // Generate random salt and iv
    const salt = generateRandomBytes(16);  // Salt length of 16 bytes
    const iv = generateRandomBytes(16);    // IV length of 16 bytes

    // Combine salt and iv as the password
    const combinedPassword = salt.toString(CryptoJS.enc.Base64) + iv.toString(CryptoJS.enc.Base64);

    // Derive the encryption key from the combined password using PBKDF2
    const key = CryptoJS.PBKDF2(combinedPassword, salt, { keySize: 256 / 32, iterations: 1000 });

    // Encrypt the password (which is a string in this case)
    const encrypted = CryptoJS.AES.encrypt(password, key, { iv });

    // Prepare the payload containing salt, iv, and ciphertext
    const payload = {
      salt: salt.toString(CryptoJS.enc.Base64),
      iv: iv.toString(CryptoJS.enc.Base64),
      ciphertext: encrypted.toString(),
    };

    return payload;  // Return the payload as a string
  } catch (err) {
    return null;
  }
};

// Decrypt the encrypted password securely using AES with CryptoJS
export const decryptData = (encryptedPayload) => {
  try {
    const payload = encryptedPayload;

    // Decode the salt and iv from base64
    const salt = CryptoJS.enc.Base64.parse(payload.salt);
    const iv = CryptoJS.enc.Base64.parse(payload.iv);
    const ciphertext = payload.ciphertext;

    // Combine salt and iv as the password for decryption
    const combinedPassword = salt.toString(CryptoJS.enc.Base64) + iv.toString(CryptoJS.enc.Base64);

    // Derive the key from the combined password
    const key = CryptoJS.PBKDF2(combinedPassword, salt, { keySize: 256 / 32, iterations: 1000 });

    // Decrypt the ciphertext using the derived key and iv
    const decrypted = CryptoJS.AES.decrypt(ciphertext, key, { iv });

    // Convert the decrypted string back to text
    const decryptedPassword = decrypted.toString(CryptoJS.enc.Utf8);

    return decryptedPassword;  // Return the decrypted password
  } catch (err) {
    return null;
  }
};

export const jwtDecode = (token) => {
  try {
    // Split the token into parts
    const parts = token.split('.');
    if (parts.length !== 3) {
      return null;
    }

    // Get the payload (second part)
    const payload = parts[1];
    
    // Decode base64
    const base64 = payload.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );

    // Parse the JSON payload
    return JSON.parse(jsonPayload);
  } catch (error) {
    console.error('Error decoding JWT:', error);
    return null;
  }
};