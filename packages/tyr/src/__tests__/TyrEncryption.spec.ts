import { assertEquals, assertInstanceOf, assertNotEquals } from "@std/assert";
import { TyrEncryption } from "../index.ts";

Deno.test({
  name: "Should extend TyrEncryption class",
  fn: () => {
    const tyrEncryptionNode = new TyrEncryption();
    assertInstanceOf(tyrEncryptionNode, TyrEncryption);
  },
});

Deno.test({
  name: "Should generate a key pair",
  fn: () => {
    const tyrEncryptionNode = new TyrEncryption();
    const keyPair = tyrEncryptionNode.generateKeyPair();

    assertInstanceOf(keyPair, Object);
    assertInstanceOf(keyPair.public, Uint8Array);
    assertInstanceOf(keyPair.private, Uint8Array);
    assertEquals(keyPair.public.length, 32);
    assertEquals(keyPair.private.length, 32);
  },
});

Deno.test({
  name: "Should compute shared secret",
  fn: () => {
    const tyrEncryptionNodeA = new TyrEncryption();
    const tyrEncryptionNodeB = new TyrEncryption();
    const keyPairA = tyrEncryptionNodeA.generateKeyPair();
    const keyPairB = tyrEncryptionNodeB.generateKeyPair();
    const sharedSecretA = tyrEncryptionNodeA.computeSharedSecret(
      keyPairA.private,
      keyPairB.public,
    );
    const sharedSecretB = tyrEncryptionNodeB.computeSharedSecret(
      keyPairB.private,
      keyPairA.public,
    );
    assertInstanceOf(sharedSecretA, Uint8Array);
    assertInstanceOf(sharedSecretB, Uint8Array);
    assertEquals(sharedSecretA.length, 32);
    assertEquals(sharedSecretB.length, 32);
    assertEquals(sharedSecretA, sharedSecretB);
  },
});

Deno.test({
  name: "Should derive symmetric key",
  fn: async () => {
    const tyrEncryptionNodeA = new TyrEncryption();
    const tyrEncryptionNodeB = new TyrEncryption();
    const keyPairA = tyrEncryptionNodeA.generateKeyPair();
    const keyPairB = tyrEncryptionNodeB.generateKeyPair();
    const symmetricKeyA = tyrEncryptionNodeA.deriveSymmetricKey(
      keyPairA.private,
      keyPairB.public,
    );
    const symmetricKeyB = tyrEncryptionNodeB.deriveSymmetricKey(
      keyPairB.private,
      keyPairA.public,
    );
    assertInstanceOf(symmetricKeyA, Uint8Array);
    assertInstanceOf(symmetricKeyB, Uint8Array);
    assertEquals(symmetricKeyA.length, 32);
    assertEquals(symmetricKeyB.length, 32);
    assertEquals(symmetricKeyA, symmetricKeyB);
  },
});

Deno.test({
  name: "Should encrypt and decrypt a message",
  fn: async () => {
    const tyrEncryptionNodeA = new TyrEncryption();
    const tyrEncryptionNodeB = new TyrEncryption();
    const keyPairA = tyrEncryptionNodeA.generateKeyPair();
    const keyPairB = tyrEncryptionNodeB.generateKeyPair();
    const message = "Hello, world!";
    const { nonce, ciphertext } = tyrEncryptionNodeA.encryptMessageFor(
      keyPairA.private,
      keyPairB.public,
      message,
    );
    const decryptedMessage = await tyrEncryptionNodeB.decryptMessageFrom(
      keyPairB.private,
      keyPairA.public,
      ciphertext,
      nonce,
    );
    assertEquals(nonce.length, 24);
    assertEquals(decryptedMessage, message);
  },
});

Deno.test({
  name: "Should fail to decrypt with wrong key",
  fn: async () => {
    const tyrEncryptionNode = new TyrEncryption();
    const keyPair1 = tyrEncryptionNode.generateKeyPair();
    const keyPair2 = tyrEncryptionNode.generateKeyPair();
    const message = "Hello, world!";
    const { nonce, ciphertext } = tyrEncryptionNode.encryptMessageFor(
      keyPair1.private,
      keyPair1.public,
      message,
    );

    const decryptedMessage = await tyrEncryptionNode.decryptMessageFrom(
      keyPair2.private,
      keyPair2.public,
      ciphertext,
      nonce,
    );

    assertEquals(decryptedMessage, null);
  },
});

Deno.test({
  name: "Ciphertext should be different from plaintext",
  fn: async () => {
    const tyrEncryptionNode = new TyrEncryption();
    const keyPair = tyrEncryptionNode.generateKeyPair();
    const message = "Hello, world!";
    const { ciphertext } = tyrEncryptionNode.encryptMessageFor(
      keyPair.private,
      keyPair.public,
      message,
    );

    const decodedCipherText = new TextDecoder().decode(ciphertext);
    assertNotEquals(decodedCipherText, message);
  },
});

Deno.test({
  name: "Ciphertext should be different for the same message",
  fn: async () => {
    const tyrEncryptionNode = new TyrEncryption();
    const keyPair = tyrEncryptionNode.generateKeyPair();
    const message = "Hello, world!";
    const { nonce: nonce1, ciphertext: ciphertext1 } = tyrEncryptionNode
      .encryptMessageFor(
        keyPair.private,
        keyPair.public,
        message,
      );
    const { nonce: nonce2, ciphertext: ciphertext2 } = tyrEncryptionNode
      .encryptMessageFor(
        keyPair.private,
        keyPair.public,
        message,
      );

    assertNotEquals(nonce1, nonce2);
    assertNotEquals(ciphertext1, ciphertext2);
  },
});

Deno.test({
  name: "Should fail to decrypt with wrong nonce",
  fn: async () => {
    const tyrEncryptionNode = new TyrEncryption();
    const keyPair = tyrEncryptionNode.generateKeyPair();
    const message = "Hello, world!";
    const { nonce, ciphertext } = tyrEncryptionNode.encryptMessageFor(
      keyPair.private,
      keyPair.public,
      message,
    );

    // Modify the nonce
    nonce[0] += 1;

    const decryptedMessage = await tyrEncryptionNode.decryptMessageFrom(
      keyPair.private,
      keyPair.public,
      ciphertext,
      nonce,
    );

    assertEquals(decryptedMessage, null);
  },
});
