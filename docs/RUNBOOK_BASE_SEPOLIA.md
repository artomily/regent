# Base Sepolia Deployment and Live Runbook

This runbook guides you through deploying the `RegentMandate` contract on **Base Sepolia (Chain ID 84532)**, configuring live credentials for Venice AI and execution relayers, and running an end-to-end live mandate execution using dual ERC-7710 delegations.

---

## 1. Prerequisites

Before beginning live testing, ensure you have:

1. **Foundry (`forge`)**: Installed and in your PATH.
2. **Base Sepolia ETH**: Required for deploying the contract and funding the agent EOA (if running in direct execution mode). Obtain testnet ETH from [Base Sepolia Faucet](https://www.coinbase.com/faucets/base-sepolia-faucet) or [Alchemy Faucet](https://www.alchemy.com/faucets/base-sepolia).
3. **Base Sepolia USDC**: Required for funding the user's MetaMask Smart Account.
   - Base Sepolia USDC contract: `0x036CbD53842c5426634e7929541eC2318f3dCF7e`
   - Uniswap SwapRouter02: `0x94cC0AaC535CCDB3C01d6787D6413C739ae12bc4`
   - Uniswap QuoterV2: `0xC5290058841028F1614F3A6F0F5816cAd0df5E27`
4. **Venice AI API Key**: Get an API key from [Venice AI](https://venice.ai).
5. **(Optional) Neon PostgreSQL**: Connection string for persistent mandate storage.
6. **(Optional) 1Shot Relayer URL**: If executing via permissionless relayer (`https://relayer.1shotapi.com/relayers`).

---

## 2. Step 1: Deploy `RegentMandate.sol`

Navigate to the `contract/` directory and deploy using the deployment script:

```bash
cd contract
PRIVATE_KEY="0x<YOUR_DEPLOYER_PRIVATE_KEY>" ./script/deploy.sh
```

Or deploy directly via `forge create`:

```bash
forge create src/RegentMandate.sol:RegentMandate \
  --rpc-url https://sepolia.base.org \
  --private-key 0x<YOUR_DEPLOYER_PRIVATE_KEY>
```

**Note the deployed contract address** from the command output (e.g., `Deployed to: 0x1234...`).

Verify the contract test suite passes:

```bash
forge test
```

---

## 3. Step 2: Configure Environment Variables

### Frontend Configuration (`frontend/.env.local`)

Create or update `frontend/.env.local`:

```bash
# Agent service connection
AGENT_URL=http://localhost:4801

# Base Sepolia contract configuration
NEXT_PUBLIC_CHAIN_ID=84532
NEXT_PUBLIC_MANDATE_CONTRACT=0x<YOUR_DEPLOYED_REGENT_MANDATE_ADDRESS>
NEXT_PUBLIC_AGENT_ADDRESS=0x<YOUR_AGENT_SIGNER_ADDRESS>

# Optional ERC-4337 Bundler (e.g. Pimlico / Alchemy on Base Sepolia)
NEXT_PUBLIC_BUNDLER_URL=

# Optional Neon PostgreSQL database URL
DATABASE_URL=
```

### AI Agent Configuration (`ai-agent/.env`)

Create or update `ai-agent/.env`:

```bash
PORT=4801
RPC_URL=https://sepolia.base.org
MANDATE_CONTRACT=0x<YOUR_DEPLOYED_REGENT_MANDATE_ADDRESS>

# Live execution mode: "live" (or "simulated")
EXECUTION_MODE=live

# For direct on-chain execution by the agent EOA:
AGENT_PRIVATE_KEY=0x<YOUR_AGENT_SIGNER_PRIVATE_KEY>

# For 1Shot permissionless relayer execution (optional):
ONE_SHOT_RELAYER_URL=https://relayer.1shotapi.com/relayers

# Venice AI evaluation
VENICE_API_KEY=<YOUR_VENICE_API_KEY>
VENICE_MODEL=kimi-k2-6
VENICE_API_URL=https://api.venice.ai/api/v1

# Security and CORS
ALLOWED_ORIGIN=http://localhost:3000
DATABASE_URL=
```

---

## 4. Step 3: Run the Services

Start both workspaces concurrently or in separate terminals:

```bash
# Terminal 1: AI Agent Service (:4801)
npm run agent

# Terminal 2: Next.js Frontend (:3000)
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser with MetaMask installed.

---

## 5. Step 4: End-to-End Walkthrough

### 1. Connect & Initialize Smart Account
1. Open [http://localhost:3000/dashboard](http://localhost:3000/dashboard) or `/mandate`.
2. Click **Connect Wallet** and select your MetaMask account on **Base Sepolia**.
3. Regent automatically initializes your **MetaMask Smart Account (ERC-4337)**.
4. If your Smart Account is not yet deployed, the interface prompts a zero-cost initialization or deploys it upon first UserOp.

### 2. Fund Smart Account with USDC
1. Transfer a small amount of testnet USDC (e.g. 10–50 USDC) to your Smart Account address displayed on the card.
2. Click **Refresh** to verify the balance appears in the UI.

### 3. Create & Authorize Mandate
1. Navigate to `/mandate`.
2. Set your mandate parameters:
   - **Goal**: e.g., "Acquire ETH with 20 USDC"
   - **Budget**: 20 USDC
   - **Max Slippage**: 1.5%
   - **Expiry**: 24 Hours
3. Click **Review & Create**.
4. In the authorization step, click **Authorize Regent**:
   - **Dual ERC-7710 Delegations**: MetaMask prompts you to sign two delegations:
     1. `approveDelegation`: Allows Uniswap `SwapRouter02` to spend up to the budget in USDC.
     2. `swapDelegation`: Allows SwapRouter02 to execute `exactInputSingle` for USDC -> WETH back into your Smart Account.
   - **On-chain Mandate**: A transaction is submitted to register the mandate on `RegentMandate.sol`.
5. The mandate status changes to `active` (or `authorized`).

### 4. Run Agent Execution
1. On `/dashboard`, click **Run Agent**.
2. **Quotes**: The agent calls Uniswap V3 QuoterV2 on Base Sepolia to fetch real prices and slippage.
3. **Venice AI**: Venice AI evaluates the quotes against the signed mandate clauses and returns a signed JSON verdict.
4. **Execution**:
   - `RegentMandate.recordExecution` is called first to check cumulative spend, slippage, and expiry on-chain.
   - `DelegationManager.redeemDelegations` is executed in a single transaction with `SingleDefault` mode for both delegations.
5. The execution result card displays the transaction hash on Basescan, the received WETH amount, and the updated cumulative spend.

### 5. Test Revocation
1. At any point, click **Revoke Mandate**.
2. Revocation executes:
   - An on-chain call to `RegentMandate.revokeMandate(onChainId)`, permanently disabling authority.
   - A Smart Account UserOp disabling both delegations in `DelegationManager`.
3. Verify that the agent can no longer execute against the mandate (`AlreadyRevoked` revert).

---

## 6. Troubleshooting

- **`BudgetExceeded` Revert**: The spend exceeds the remaining budget on `RegentMandate`. Ensure the input amount is within `mandate.budget - mandate.spent`.
- **`SlippageExceeded` Revert**: Market moved or route slippage exceeded `maxSlippage`. Adjust slippage ceiling or retry with smaller trade size.
- **`Expired` Revert**: Mandate timestamp has passed `expiry`. Create a new mandate with a future expiry date.
- **`CaveatEnforcer failed`**: Calldata offset mismatch. Ensure `tokenIn`, `tokenOut`, and `recipient` match the exact addresses configured in the delegations.
