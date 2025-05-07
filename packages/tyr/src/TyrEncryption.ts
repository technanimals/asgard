export abstract class TyrEncryption {
  /** Generate a new X25519 key pair */
  abstract generateKeyPair(): KeyPair;

  /** Compute shared secret from peer public key */
  abstract computeSharedSecret(
    privateKey: Uint8Array,
    peerPublicKey: Uint8Array,
  ): Uint8Array;

  /** Derive symmetric key using HKDF from shared secret */
  async deriveSymmetricKey(
    privateKey: Uint8Array,
    peerPublicKey: Uint8Array,
  ): Promise<Uint8Array> {
    const sharedSecret = await this.computeSharedSecret(
      privateKey,
      peerPublicKey,
    );
    return this.hkdf(sharedSecret, 32, "SecureMessenger");
  }

  /** Encrypt a message using derived shared key */
  async encryptMessageFor(
    privateKey: Uint8Array,
    peerPublicKey: Uint8Array,
    message: string,
  ): Promise<{ nonce: Uint8Array; ciphertext: Uint8Array }> {
    const key = await this.deriveSymmetricKey(privateKey, peerPublicKey);
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

  // /** Export public key */
  // getPublicKey(): Uint8Array {
  //   return this.publicKey;
  // }

  // /** Export private key */
  // getPrivateKey(): Uint8Array {
  //   return this.privateKey;
  // }

  // --- Abstracted crypto primitives ---
  protected abstract generateRandomBytes(length: number): Uint8Array;
  protected abstract createSecretbox(
    message: Uint8Array,
    nonce: Uint8Array,
    key: Uint8Array,
  ): Uint8Array;
  protected abstract openSecretBox(
    ciphertext: Uint8Array,
    nonce: Uint8Array,
    key: Uint8Array,
  ): Uint8Array | null;
  protected abstract hkdf(
    input: Uint8Array,
    length: number,
    info: string,
  ): Uint8Array;
}
// export

export type KeyPair = {
  public: Uint8Array;
  private: Uint8Array;
};
