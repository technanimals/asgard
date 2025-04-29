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
# Using JSR
npx jsr add @asgard/tyr
```

## Getting Started

### Basic End-to-End Encryption

```typescript
import { TyrE2EFactory } from "@asgard/tyr";

// Initialize E2E encryption (works in browser, Node.js, or React Native)
const e2e = await TyrE2EFactory.createForBrowser();

// Generate or retrieve existing key pair
const keyPair = e2e.getKeyPair();
console.log("My public key:", keyPair.publicKey);

// Encrypt a message for someone (using their public key)
const recipientPublicKey = "..."; // Recipient's public key
const encryptedMessage = e2e.encryptMessage(
  "This is a secret message",
  recipientPublicKey,
);

// Send the encrypted message through any channel
sendMessage(encryptedMessage);

// Recipient can decrypt the message (with their own private key)
const decryptedMessage = recipientE2E.decryptMessage(encryptedMessage);
console.log(decryptedMessage); // "This is a secret message"
```

### Secure File or Large Data Sharing

```typescript
// Generate a symmetric key for efficient encryption of large data
const symmetricKey = e2e.generateSymmetricKey();

// Encrypt large data with the symmetric key
const largeData = "..."; // Could be a file, image, etc.
const encryptedData = e2e.encryptWithSymmetricKey(largeData, symmetricKey);

// Securely share the symmetric key with the recipient
const encryptedKey = e2e.shareSymmetricKey(symmetricKey, recipientPublicKey);

// Send both the encrypted data and encrypted key to the recipient
sendToRecipient({ encryptedData, encryptedKey });

// Recipient decrypts the symmetric key first
const decryptedKey = recipientE2E.receiveSymmetricKey(encryptedKey);

// Then uses it to decrypt the large data
const decryptedData = recipientE2E.decryptWithSymmetricKey(
  encryptedData.encrypted,
  encryptedData.nonce,
  decryptedKey,
);
```

## Platform-Specific Usage

### Browser

```typescript
import { TyrE2EFactory } from "@asgard/tyr";

async function secureChat() {
  // Keys will be stored in localStorage
  const e2e = await TyrE2EFactory.createForBrowser();

  // Rest of your code...
}
```

### React Native

```typescript
import { TyrE2EFactory } from "@asgard/tyr";
import * as SecureStore from "expo-secure-store";

async function secureMobileApp() {
  // Keys will be stored in SecureStore
  const e2e = await TyrE2EFactory.createForReactNative(SecureStore);

  // Rest of your code...
}
```

### Node.js

```typescript
import { TyrE2EFactory } from "@asgard/tyr";

async function secureServer() {
  // Keys will be stored in the file system
  const e2e = await TyrE2EFactory.createForNode("./secure-keys");

  // Rest of your code...
}
```

## API Reference

### TyrE2E Class

The main class providing encryption functionality.

```typescript
class TyrE2E {
  constructor(existingKeyPair?: KeyPair);

  // Key management
  generateKeyPair(): KeyPair;
  getKeyPair(): KeyPair;
  importKeyPair(keyPair: KeyPair): void;

  // Asymmetric encryption (public/private key)
  encryptMessage(message: string, recipientPublicKey: string): EncryptedMessage;
  decryptMessage(encryptedMessage: EncryptedMessage): string;

  // Symmetric encryption (shared key)
  generateSymmetricKey(): string;
  encryptWithSymmetricKey(
    data: string,
    symmetricKey: string,
  ): { encrypted: string; nonce: string };
  decryptWithSymmetricKey(
    encrypted: string,
    nonce: string,
    symmetricKey: string,
  ): string;

  // Sharing symmetric keys securely
  shareSymmetricKey(
    symmetricKey: string,
    recipientPublicKey: string,
  ): EncryptedMessage;
  receiveSymmetricKey(encryptedKey: EncryptedMessage): string;
}
```

### TyrE2EFactory

Factory for creating TyrE2E instances with appropriate storage adapters.

```typescript
class TyrE2EFactory {
  static async createForBrowser(): Promise<TyrE2E>;
  static async createForReactNative(secureStore: any): Promise<TyrE2E>;
  static async createForNode(keyPath?: string): Promise<TyrE2E>;
  static createInMemory(): TyrE2E; // For testing
}
```

## Advanced Usage

### Group Encryption

```typescript
// Admin generates a symmetric key for the group
const groupKey = e2e.generateSymmetricKey();

// Encrypt the group key for each member
const encryptedKeys = {};
for (const member of groupMembers) {
  encryptedKeys[member.id] = e2e.shareSymmetricKey(
    groupKey,
    member.publicKey,
  );
}

// Distribute the encrypted keys to members
distributeKeys(encryptedKeys);

// Any member can now encrypt messages using the group key
const encryptedGroupMessage = e2e.encryptWithSymmetricKey(
  "Hello group!",
  groupKey,
);

// And any member with the group key can decrypt messages
const decryptedGroupMessage = e2e.decryptWithSymmetricKey(
  encryptedGroupMessage.encrypted,
  encryptedGroupMessage.nonce,
  groupKey,
);
```

## Security Considerations

- Store private keys securely and never expose them
- Exchange public keys through secure channels when possible
- Implement additional authentication to verify message senders
- Consider implementing key rotation for long-term communications
- Remember that E2E encryption protects the content, but not metadata
- Follow platform-specific security best practices

## Integration with other @asgard packages

@asgard/tyr works seamlessly with other packages in the @asgard ecosystem:

### With @asgard/heimdall (API Framework)

```typescript
import { HeimdallEndpoint } from "@asgard/heimdall";
import { TyrE2EFactory } from "@asgard/tyr";

// Initialize encryption
const e2e = await TyrE2EFactory.createForNode();

// Create an encrypted API endpoint
const secureEndpoint = new HeimdallEndpoint({
  path: "/api/secure-data",
  method: "POST",
  handler: async ({ data }) => {
    try {
      // Decrypt the incoming data
      const decryptedData = e2e.decryptMessage(data.encryptedMessage);

      // Process the data
      const result = processSecureData(decryptedData);

      // Encrypt the response
      const encryptedResponse = e2e.encryptMessage(
        JSON.stringify(result),
        data.publicKey,
      );

      return {
        statusCode: 200,
        body: { encryptedResponse },
      };
    } catch (error) {
      return {
        statusCode: 400,
        body: { message: "Failed to process encrypted data" },
      };
    }
  },
});
```

### With @asgard/hermod (Service Discovery)

```typescript
import { HermodService } from "@asgard/hermod";
import { TyrE2EFactory } from "@asgard/tyr";

class EncryptionService extends HermodService<"encryption", TyrE2E> {
  serviceName = "encryption";

  async register() {
    // Create an E2E encryption instance
    const e2e = await TyrE2EFactory.createForNode("./service-keys");
    return e2e;
  }
}

// In your API handler
const endpoint = new HeimdallEndpoint({
  // ...
  services: [EncryptionService],
  handler: async ({ services }) => {
    const encryptionService = services.encryption;

    // Use the encryption service
    const encrypted = encryptionService.encryptMessage(
      "Secure data",
      recipientPublicKey,
    );

    return { statusCode: 200, body: { encrypted } };
  },
});
```

## License

MIT
