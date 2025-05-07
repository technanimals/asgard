import { type KeyPair, TyrEncryption } from "./TyrEncryption.ts";
import { sha256 } from "@noble/hashes/sha2";
import { hkdf } from "@noble/hashes/hkdf";
import nacl from "tweetnacl";

export class TyrEncryptionNode extends TyrEncryption {
  /** Generate X25519 key pair */
  generateKeyPair(): KeyPair {
    const keyPair = nacl.box.keyPair();
    return {
      public: keyPair.publicKey,
      private: keyPair.secretKey,
    };
  }

  /** Compute shared secret using X25519 (scalarMult) */

  computeSharedSecret(
    privateKey: Uint8Array,
    peerPublicKey: Uint8Array,
  ): Uint8Array {
    return nacl.scalarMult(privateKey.subarray(0, 32), peerPublicKey);
  }

  /** Generate secure random bytes */
  protected generateRandomBytes(length: number): Uint8Array {
    return nacl.randomBytes(length);
  }

  /** Symmetric encryption using NaCl's secretbox (XSalsa20 + Poly1305) */
  protected createSecretbox(
    msg: Uint8Array,
    nonce: Uint8Array,
    key: Uint8Array,
  ): Uint8Array {
    return nacl.secretbox(msg, nonce, key);
  }

  /** Symmetric decryption */
  protected openSecretBox(
    ciphertext: Uint8Array,
    nonce: Uint8Array,
    key: Uint8Array,
  ): Uint8Array | null {
    return nacl.secretbox.open(ciphertext, nonce, key);
  }

  /** HKDF-SHA256 to derive a 32-byte symmetric key from shared secret */
  protected hkdf(input: Uint8Array, length: number, info: string): Uint8Array {
    return hkdf(
      sha256,
      input,
      new Uint8Array(0), // optional
      new TextEncoder().encode(info),
      length,
    );
  }
}
