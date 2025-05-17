# @asgard/tyr

A comprehensive security and encryption package for JavaScript applications,
providing secure communication, authentication, and data protection across
Browser, Node.js, and React Native environments.

## Overview

Named after Tyr, the Norse god of law, justice, and oaths who sacrificed his
hand to bind the wolf Fenrir, `@asgard/tyr` provides robust security mechanisms
that protect your applications. Just as Tyr was willing to sacrifice for the
greater security of Asgard, this package makes the necessary trade-offs to
ensure your data remains secure across platforms.

## Features

- 🔐 **End-to-End Encryption** - Secure communication that only intended
  recipients can decrypt
- 🔄 **Cross-Platform Compatibility** - Works in browsers, Node.js, and React
  Native
- 🔑 **Key Management** - Handles key generation, exchange, and secure storage
- 🛡️ **Asymmetric & Symmetric Encryption** - Supports both public/private key
  and shared key encryption
- 📦 **Efficient Large Data Encryption** - Optimized for both small messages and
  large data
- 👥 **Group Encryption** - Secure communication for multiple participants
- 💾 **Secure Storage Adapters** - Platform-specific secure storage
  implementations

## Installation

```bash
# Using npm
npm install @asgard/tyr

# Using JSR
npx jsr add @asgard/tyr
```

## Usage

> **Note for React Native:**\
> To ensure secure random number generation, you **must** add the following
> import at the top of your entry file (e.g., `index.js` or `App.tsx`):
>
> ```js
> import "react-native-get-random-values";
> ```

```typescript
import { TyrEncryption } from "@asgard/tyr";

// Alice and Bob generate key pairs
const alice = new TyrEncryption();
const bob = new TyrEncryption();

const aliceKeys = alice.generateKeyPair();
const bobKeys = bob.generateKeyPair();

// Compute shared secret and derive symmetric key
const aliceSymKey = alice.deriveSymmetricKey(aliceKeys.private, bobKeys.public);
const bobSymKey = bob.deriveSymmetricKey(bobKeys.private, aliceKeys.public);

// Encrypt a message from Alice to Bob
const message = "Hello, Bob!";
const { nonce, ciphertext } = alice.encryptMessageFor(
  aliceKeys.private,
  bobKeys.public,
  message,
);

// Bob decrypts the message
const decrypted = await bob.decryptMessageFrom(
  bobKeys.private,
  aliceKeys.public,
  ciphertext,
  nonce,
);

console.log(decrypted); // "Hello, Bob!"
```

## API

### `TyrEncryption`

#### `generateKeyPair(): KeyPair`

Generates a new X25519 key pair.

#### `computeSharedSecret(privateKey, peerPublicKey): Uint8Array`

Computes a shared secret using ECDH (X25519).

#### `deriveSymmetricKey(privateKey, peerPublicKey): Uint8Array`

Derives a 32-byte symmetric key from the shared secret using HKDF-SHA256.

#### `encryptMessageFor(privateKey, peerPublicKey, message): { nonce, ciphertext }`

Encrypts a message for a peer using the derived symmetric key. Returns a random
nonce and ciphertext.

#### `decryptMessageFrom(privateKey, peerPublicKey, ciphertext, nonce): Promise<string | null>`

Decrypts a ciphertext using the derived symmetric key. Returns the plaintext
string or `null` if authentication fails.

#### Types

```typescript
type KeyPair = {
  public: Uint8Array;
  private: Uint8Array;
};
```

## Security Notes

- Always generate a new random nonce for each message.
- Never reuse a nonce with the same key.
- Keep private keys secret and never transmit them.
- This library is intended for secure messaging and key exchange, not for
  password storage or hashing.

## License

MIT
