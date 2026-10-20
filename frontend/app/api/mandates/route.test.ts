import { describe, expect, it } from "vitest"
import { GET, PATCH, POST } from "./route"

describe("mandates API route fallback (DATABASE_URL unset)", () => {
  it("GET returns configured: false and empty mandates list", async () => {
    delete process.env.DATABASE_URL
    const req = new Request("http://localhost:3000/api/mandates?owner=0x1111111111111111111111111111111111111111")
    const res = await GET(req)
    expect(res.status).toBe(200)
    const data = await res.json()
    expect(data.configured).toBe(false)
    expect(data.mandates).toEqual([])
  })

  it("POST returns configured: false with mandate echoed back", async () => {
    delete process.env.DATABASE_URL
    const dummyMandate = {
      id: "mandate-123",
      goal: "Acquire ETH",
      budget: 50,
      spent: 0,
      maxSlippage: 1,
      sourceAsset: "USDC",
      targetAsset: "ETH",
      expiry: new Date(Date.now() + 86400000).toISOString(),
      status: "pending",
      createdAt: Date.now(),
      delegatorAddress: "0x1111111111111111111111111111111111111111",
    }
    const req = new Request("http://localhost:3000/api/mandates", {
      method: "POST",
      body: JSON.stringify({
        mandate: dummyMandate,
        ownerAddress: "0x1111111111111111111111111111111111111111",
      }),
    })
    const res = await POST(req)
    expect(res.status).toBe(200)
    const data = await res.json()
    expect(data.configured).toBe(false)
    expect(data.mandate.id).toBe("mandate-123")
  })

  it("PATCH returns configured: false and updated: false", async () => {
    delete process.env.DATABASE_URL
    const req = new Request("http://localhost:3000/api/mandates", {
      method: "PATCH",
      body: JSON.stringify({
        id: "mandate-123",
        status: "revoked",
      }),
    })
    const res = await PATCH(req)
    expect(res.status).toBe(200)
    const data = await res.json()
    expect(data.configured).toBe(false)
    expect(data.updated).toBe(false)
  })

  it("GET returns 400 if owner is missing when configured", async () => {
    process.env.DATABASE_URL = "postgres://dummy@localhost:5432/db"
    const req = new Request("http://localhost:3000/api/mandates")
    const res = await GET(req)
    expect(res.status).toBe(400)
    delete process.env.DATABASE_URL
  })
})
