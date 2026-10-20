import assert from "node:assert/strict"
import { test } from "node:test"
import { server, validateMandate } from "./index.ts"

test("validateMandate validates spent and boundaries", () => {
  assert.equal(validateMandate(undefined), null)
  assert.equal(
    validateMandate({
      id: "m",
      goal: "g",
      budget: 100,
      spent: -5,
      maxSlippage: 1,
      sourceAsset: "USDC",
      targetAsset: "WETH",
      expiry: "2026-12-31",
    }),
    null,
  )
  assert.ok(
    validateMandate({
      id: "m",
      goal: "g",
      budget: 100,
      spent: 20,
      maxSlippage: 1,
      sourceAsset: "USDC",
      targetAsset: "WETH",
      expiry: "2026-12-31",
    }),
  )
})

test("server handles CORS and preflight OPTIONS request", async () => {
  await new Promise<void>((resolve) => server.listen(0, resolve))
  const address = server.address()
  if (!address || typeof address === "string") throw new Error("Invalid address")
  const port = address.port

  try {
    const res = await fetch(`http://127.0.0.1:${port}/health`, {
      method: "OPTIONS",
      headers: { Origin: "http://localhost:3000" },
    })
    assert.equal(res.status, 204)
    assert.equal(res.headers.get("access-control-allow-origin"), "http://localhost:3000")
    assert.match(res.headers.get("access-control-allow-headers") ?? "", /X-Venice-Api-Key/i)

    const healthRes = await fetch(`http://127.0.0.1:${port}/health`, {
      headers: { Origin: "http://localhost:3000" },
    })
    assert.equal(healthRes.status, 200)
    const body = (await healthRes.json()) as { ok: boolean; mode: { execution: string } }
    assert.equal(body.ok, true)
    assert.ok(body.mode.execution)
  } finally {
    await new Promise((resolve) => server.close(resolve))
  }
})
