// Simulated ProofArtifact signing/verification.
// In production this would be a hardware-attested signature from the Rust kernel.

export async function sha256Hex(input: string): Promise<string> {
  const data = new TextEncoder().encode(input);
  const buf = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(buf))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

export interface ProofArtifact {
  payload_hash: string;
  signature: string;
  signed_at: string;
  kernel: "MALEKA-Ω-sim-v1";
}

export async function signProof(payload: unknown): Promise<ProofArtifact> {
  const serialized = JSON.stringify(payload);
  const payload_hash = await sha256Hex(serialized);
  const signature = await sha256Hex(`MALEKA-Ω-sim::${payload_hash}::${Date.now()}`);
  return {
    payload_hash,
    signature,
    signed_at: new Date().toISOString(),
    kernel: "MALEKA-Ω-sim-v1",
  };
}

export async function verifyProof(
  payload: unknown,
  artifact: ProofArtifact,
): Promise<boolean> {
  const serialized = JSON.stringify(payload);
  const payload_hash = await sha256Hex(serialized);
  return payload_hash === artifact.payload_hash;
}

export async function chainHash(prev: string | null, payload: unknown): Promise<string> {
  return sha256Hex(`${prev ?? "GENESIS"}::${JSON.stringify(payload)}`);
}
