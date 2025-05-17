import { sha256 } from "@noble/hashes/sha2";
import { hkdf } from "@noble/hashes/hkdf";
import nacl from "tweetnacl";
export class TyrEncryption {
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

  /** Derive symmetric key using HKDF from shared secret */
  deriveSymmetricKey(
    privateKey: Uint8Array,
    peerPublicKey: Uint8Array,
  ): Uint8Array {
    const sharedSecret = this.computeSharedSecret(
      privateKey,
      peerPublicKey,
    );
    return this.hkdf(sharedSecret, 32, "SecureMessenger");
  }

  /** Encrypt a message using derived shared key */
  encryptMessageFor(
    privateKey: Uint8Array,
    peerPublicKey: Uint8Array,
    message: string,
  ): { nonce: Uint8Array; ciphertext: Uint8Array } {
    const key = this.deriveSymmetricKey(privateKey, peerPublicKey);
    const nonce = this.generateRandomBytes(24); // NaCl's secretbox nonce size
    const msgBytes = new TextEncoder().encode(message);
    const ciphertext = this.createSecretbox(msgBytes, nonce, key);
    return { nonce, ciphertext };
  }

  /** Decrypt a received message using derived key */
  async decryptMessageFrom(
    privateKey: Uint8Array,
    peerPublicKey: Uint8Array,
    ciphertext: Uint8Array,
    nonce: Uint8Array,
  ): Promise<string | null> {
    const key = await this.deriveSymmetricKey(privateKey, peerPublicKey);
    const decrypted = this.openSecretBox(ciphertext, nonce, key);
    if (!decrypted) return null;
    return new TextDecoder().decode(decrypted);
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
// export

export type KeyPair = {
  public: Uint8Array;
  private: Uint8Array;
};
