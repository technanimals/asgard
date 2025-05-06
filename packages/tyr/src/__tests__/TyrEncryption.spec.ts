import { assertInstanceOf } from "@std/assert";
import { TyrEncryption } from "../index.ts";
import { KeyPair } from "../TyrEncryption.ts";

class TestTyrEncryption extends TyrEncryption {
  generateKeyPair(): KeyPair {
    throw new Error("Method not implemented.");
  }
  computeSharedSecret(
    _privateKey: Uint8Array,
    _peerPublicKey: Uint8Array,
  ): Uint8Array {
    throw new Error("Method not implemented.");
  }
  generateRandomBytes(_length: number): Uint8Array {
    throw new Error("Method not implemented.");
  }
  createSecretbox(
    _message: Uint8Array,
    _nonce: Uint8Array,
    _key: Uint8Array,
  ): Uint8Array {
    throw new Error("Method not implemented.");
  }
  openSecretBox(
    _ciphertext: Uint8Array,
    _nonce: Uint8Array,
    _key: Uint8Array,
  ): Uint8Array | null {
    throw new Error("Method not implemented.");
  }
  hkdf(_input: Uint8Array, _length: number, _info: string): Uint8Array {
    throw new Error("Method not implemented.");
  }
}

Deno.test({
  name: "Should extend TyrEncryption class",
  fn: () => {
    const tyrEncryption = new TestTyrEncryption();

    assertInstanceOf(tyrEncryption, TyrEncryption);
  },
});
