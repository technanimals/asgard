import { TyrEncryption } from "../TyrEncryption.ts";
import { assertInstanceOf } from "@std/assert";

class TestTyrEncryption extends TyrEncryption {}

Deno.test({
  name: "Should extend TyrEncryption class",
  fn: () => {
    const tyrEncryption = new TestTyrEncryption();

    assertInstanceOf(tyrEncryption, TyrEncryption);
  },
});
