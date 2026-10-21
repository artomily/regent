import { describe, expect, it } from "vitest"
import { privateKeyToAccount } from "viem/accounts"
import { formatMandateAuthMessage } from "@/lib/auth"
import { GET, PATCH, POST } from "./route"

const ownerAccount = privateKeyToAccount("0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80")
const attackerAccount = privateKeyToAccount("0x59c6995e998f97a5a0044966f0945389dc9e86dae88c7a8412f4603b6b78690d")

const dummyMandate = {
  id: "mandate-123",
  goal: "Acquire ETH",
  budget: 50,
  spent: 0,
  maxSlippage: 1,
  sourceAsset: "USDC",
  targetAsset: "ETH",
  expiry: new Date(Date.now() + 86400000).toISOString(),
  status: "pending" as const,
  createdAt: Date.now(),
  delegatorAddress: ownerAccount.address,
}

describe("mandates API route authentication and fallback", () => {
  it("GET returns configured: false and empty mandates list", async () => {
    delete process.env.DATABASE_URL
    const req = new Request(`http://localhost:3000/api/mandates?owner=${ownerAccount.address}`)
    const res = await GET(req)
    expect(res.status).toBe(200)
    const data = await res.json()
    expect(data.configured).toBe(false)
    expect(data.mandates).toEqual([])
  })

  it("GET returns 400 if owner is missing when configured", async () => {
    process.env.DATABASE_URL = "postgres://dummy@localhost:5432/db"
    const req = new Request("http://localhost:3000/api/mandates")
    const res = await GET(req)
    expect(res.status).toBe(400)
    delete process.env.DATABASE_URL
  })

  it("POST rejects missing signature with 401", async () => {
    delete process.env.DATABASE_URL
    const req = new Request("http://localhost:3000/api/mandates", {
      method: "POST",
      body: JSON.stringify({
        mandate: dummyMandate,
        ownerAddress: ownerAccount.address,
      }),
    })
    const res = await POST(req)
    expect(res.status).toBe(401)
    const data = await res.json()
    expect(data.error).toMatch(/signature/i)
  })

  it("POST rejects invalid/malformed signature with 401", async () => {
    delete process.env.DATABASE_URL
    const req = new Request("http://localhost:3000/api/mandates", {
      method: "POST",
      body: JSON.stringify({
        mandate: dummyMandate,
        ownerAddress: ownerAccount.address,
        auth: {
          signature: "0x1234",
          timestamp: Date.now(),
        },
      }),
    })
    const res = await POST(req)
    expect(res.status).toBe(401)
    const data = await res.json()
    expect(data.error).toMatch(/invalid signature/i)
  })

  it("POST rejects expired timestamp (> 5 minutes old) with 401", async () => {
    delete process.env.DATABASE_URL
    const expiredTimestamp = Date.now() - 360_000 // 6 minutes ago
    const message = formatMandateAuthMessage({
      action: "create",
      mandateId: dummyMandate.id,
      owner: ownerAccount.address,
      timestamp: expiredTimestamp,
    })
    const signature = await ownerAccount.signMessage({ message })

    const req = new Request("http://localhost:3000/api/mandates", {
      method: "POST",
      body: JSON.stringify({
        mandate: dummyMandate,
        ownerAddress: ownerAccount.address,
        auth: {
          signature,
          timestamp: expiredTimestamp,
        },
      }),
    })
    const res = await POST(req)
    expect(res.status).toBe(401)
    const data = await res.json()
    expect(data.error).toMatch(/expired/i)
  })

  it("POST rejects wrong signer with 403", async () => {
    delete process.env.DATABASE_URL
    const timestamp = Date.now()
    // Attacker signs message claiming owner is ownerAccount.address
    const message = formatMandateAuthMessage({
      action: "create",
      mandateId: dummyMandate.id,
      owner: ownerAccount.address,
      timestamp,
    })
    const attackerSignature = await attackerAccount.signMessage({ message })

    const req = new Request("http://localhost:3000/api/mandates", {
      method: "POST",
      body: JSON.stringify({
        mandate: dummyMandate,
        ownerAddress: ownerAccount.address,
        auth: {
          signature: attackerSignature,
          timestamp,
        },
      }),
    })
    const res = await POST(req)
    expect(res.status).toBe(403)
    const data = await res.json()
    expect(data.error).toMatch(/signer does not match owner/i)
  })

  it("POST accepts valid signature and returns configured: false with echoed mandate", async () => {
    delete process.env.DATABASE_URL
    const timestamp = Date.now()
    const message = formatMandateAuthMessage({
      action: "create",
      mandateId: dummyMandate.id,
      owner: ownerAccount.address,
      timestamp,
    })
    const signature = await ownerAccount.signMessage({ message })

    const req = new Request("http://localhost:3000/api/mandates", {
      method: "POST",
      body: JSON.stringify({
        mandate: dummyMandate,
        ownerAddress: ownerAccount.address,
        auth: {
          signature,
          timestamp,
        },
      }),
    })
    const res = await POST(req)
    expect(res.status).toBe(200)
    const data = await res.json()
    expect(data.configured).toBe(false)
    expect(data.mandate.id).toBe(dummyMandate.id)
  })

  it("PATCH rejects missing signature with 401", async () => {
    delete process.env.DATABASE_URL
    const req = new Request("http://localhost:3000/api/mandates", {
      method: "PATCH",
      body: JSON.stringify({
        id: dummyMandate.id,
        status: "revoked",
        ownerAddress: ownerAccount.address,
      }),
    })
    const res = await PATCH(req)
    expect(res.status).toBe(401)
    const data = await res.json()
    expect(data.error).toMatch(/signature/i)
  })

  it("PATCH rejects expired timestamp with 401", async () => {
    delete process.env.DATABASE_URL
    const expiredTimestamp = Date.now() - 400_000
    const message = formatMandateAuthMessage({
      action: "update",
      mandateId: dummyMandate.id,
      owner: ownerAccount.address,
      timestamp: expiredTimestamp,
    })
    const signature = await ownerAccount.signMessage({ message })

    const req = new Request("http://localhost:3000/api/mandates", {
      method: "PATCH",
      body: JSON.stringify({
        id: dummyMandate.id,
        status: "revoked",
        ownerAddress: ownerAccount.address,
        auth: {
          signature,
          timestamp: expiredTimestamp,
        },
      }),
    })
    const res = await PATCH(req)
    expect(res.status).toBe(401)
  })

  it("PATCH rejects wrong signer with 403", async () => {
    delete process.env.DATABASE_URL
    const timestamp = Date.now()
    const message = formatMandateAuthMessage({
      action: "update",
      mandateId: dummyMandate.id,
      owner: ownerAccount.address,
      timestamp,
    })
    const attackerSignature = await attackerAccount.signMessage({ message })

    const req = new Request("http://localhost:3000/api/mandates", {
      method: "PATCH",
      body: JSON.stringify({
        id: dummyMandate.id,
        status: "revoked",
        ownerAddress: ownerAccount.address,
        auth: {
          signature: attackerSignature,
          timestamp,
        },
      }),
    })
    const res = await PATCH(req)
    expect(res.status).toBe(403)
  })

  it("PATCH accepts valid signature and returns updated: false (DATABASE_URL unset)", async () => {
    delete process.env.DATABASE_URL
    const timestamp = Date.now()
    const message = formatMandateAuthMessage({
      action: "update",
      mandateId: dummyMandate.id,
      owner: ownerAccount.address,
      timestamp,
    })
    const signature = await ownerAccount.signMessage({ message })

    const req = new Request("http://localhost:3000/api/mandates", {
      method: "PATCH",
      body: JSON.stringify({
        id: dummyMandate.id,
        status: "revoked",
        ownerAddress: ownerAccount.address,
        auth: {
          signature,
          timestamp,
        },
      }),
    })
    const res = await PATCH(req)
    expect(res.status).toBe(200)
    const data = await res.json()
    expect(data.configured).toBe(false)
    expect(data.updated).toBe(false)
  })
})
