import { recoverMessageAddress, type Address, type Hex } from "viem"
import { getWalletClient } from "@/lib/wallet"

export interface MandateAuthPayload {
  action: "create" | "update"
  mandateId: string
  owner: string
  timestamp: number
}

export interface MandateAuthSignature {
  signature: Hex
  timestamp: number
  owner: Hex
}

export function formatMandateAuthMessage(payload: MandateAuthPayload): string {
  return JSON.stringify({
    action: payload.action,
    mandateId: payload.mandateId,
    owner: payload.owner.toLowerCase(),
    timestamp: payload.timestamp,
  })
}

export async function signMandateAuth(params: {
  action: "create" | "update"
  mandateId: string
  owner: Hex
}): Promise<MandateAuthSignature> {
  const timestamp = Date.now()
  const message = formatMandateAuthMessage({
    action: params.action,
    mandateId: params.mandateId,
    owner: params.owner,
    timestamp,
  })

  const client = getWalletClient(params.owner)
  const signature = await client.signMessage({
    account: params.owner,
    message,
  })

  return {
    signature,
    timestamp,
    owner: params.owner,
  }
}

export async function verifyMandateAuth(params: {
  action: "create" | "update"
  mandateId: string
  expectedOwner: string
  signature?: string | null
  timestamp?: number | null
  now?: number
}): Promise<{ ok: true; owner: Address } | { ok: false; status: 401 | 403; error: string }> {
  const { action, mandateId, expectedOwner, signature, timestamp, now = Date.now() } = params

  if (!signature || typeof signature !== "string" || !signature.startsWith("0x")) {
    return { ok: false, status: 401, error: "Missing or invalid signature" }
  }

  if (typeof timestamp !== "number" || isNaN(timestamp)) {
    return { ok: false, status: 401, error: "Missing or invalid timestamp" }
  }

  if (Math.abs(now - timestamp) > 300_000) {
    return {
      ok: false,
      status: 401,
      error: "Signature expired (timestamp outside 5-minute replay window)",
    }
  }

  if (!expectedOwner || typeof expectedOwner !== "string" || !expectedOwner.startsWith("0x")) {
    return { ok: false, status: 401, error: "Missing or invalid expected owner" }
  }

  const message = formatMandateAuthMessage({
    action,
    mandateId,
    owner: expectedOwner,
    timestamp,
  })

  let recovered: Address
  try {
    recovered = await recoverMessageAddress({
      message,
      signature: signature as Hex,
    })
  } catch {
    return { ok: false, status: 401, error: "Invalid signature" }
  }

  if (recovered.toLowerCase() !== expectedOwner.toLowerCase()) {
    return { ok: false, status: 403, error: "Signer does not match owner" }
  }

  return { ok: true, owner: recovered }
}
