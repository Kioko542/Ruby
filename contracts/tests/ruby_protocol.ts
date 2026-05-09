import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { assert } from "chai";

describe("ruby_protocol", () => {
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);

  const program = anchor.workspace.RubyProtocol as Program;

  it("loads workspace and provider", async () => {
    assert.ok(program.programId);
    assert.ok(provider.wallet.publicKey);
  });
});
