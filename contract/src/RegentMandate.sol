// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/// @title RegentMandate
/// @notice On-chain mandate registry and spending guard for the Regent agent.
///
/// A mandate is a bounded delegation: the owner authorizes an agent address to
/// spend up to `budget` of `sourceToken` acquiring `targetToken`, with a hard
/// slippage ceiling and an expiry. The agent must call `recordExecution` for
/// every action; the contract reverts anything outside the mandate boundaries,
/// so the agent's authority can never exceed what the owner signed.
///
/// In the full production flow the swap itself is routed through an ERC-7710
/// delegation from the owner's MetaMask Smart Account, and this contract acts
/// as the caveat enforcer + audit log. In demo mode the frontend and ai-agent
/// consume the same ABI against a simulated chain.
contract RegentMandate {
    struct Mandate {
        address owner; // delegator who funds and bounds the mandate
        address agent; // executor authorized to act within the bounds
        address sourceToken;
        address targetToken;
        uint256 budget; // max cumulative spend, in sourceToken base units
        uint256 spent; // cumulative spend so far
        uint16 maxSlippageBps; // slippage ceiling in basis points (100 = 1%)
        uint64 expiry; // unix timestamp after which the mandate is dead
        bool revoked;
        string goal; // human-readable intent, stored for the audit trail
    }

    struct Execution {
        uint256 spendAmount;
        uint256 receivedAmount;
        uint16 slippageBps;
        uint64 timestamp;
        bytes32 routeRef; // reference to the route/tx the agent executed
    }

    error InvalidParams();
    error NotOwner();
    error NotAgent();
    error AlreadyRevoked();
    error Expired();
    error BudgetExceeded(uint256 remaining, uint256 requested);
    error SlippageExceeded(uint16 maxBps, uint16 actualBps);

    event MandateCreated(
        bytes32 indexed id,
        address indexed owner,
        address indexed agent,
        address sourceToken,
        address targetToken,
        uint256 budget,
        uint16 maxSlippageBps,
        uint64 expiry,
        string goal
    );
    event MandateRevoked(bytes32 indexed id, address indexed owner);
    event ExecutionRecorded(
        bytes32 indexed id,
        address indexed agent,
        uint256 spendAmount,
        uint256 receivedAmount,
        uint16 slippageBps,
        bytes32 routeRef
    );
    event MandateExhausted(bytes32 indexed id, uint256 totalSpent);

    mapping(bytes32 => Mandate) public mandates;
    mapping(bytes32 => Execution[]) internal _executions;
    mapping(address => bytes32[]) public mandatesByOwner;
    uint256 public mandateCount;

    /// @notice Register a new mandate. The caller becomes the owner.
    function createMandate(
        address agent,
        address sourceToken,
        address targetToken,
        uint256 budget,
        uint16 maxSlippageBps,
        uint64 expiry,
        string calldata goal
    ) external returns (bytes32 id) {
        if (agent == address(0) || budget == 0) revert InvalidParams();
        if (maxSlippageBps > 10_000) revert InvalidParams();
        if (expiry <= block.timestamp) revert InvalidParams();

        id = keccak256(abi.encodePacked(msg.sender, agent, mandateCount++, block.chainid));

        mandates[id] = Mandate({
            owner: msg.sender,
            agent: agent,
            sourceToken: sourceToken,
            targetToken: targetToken,
            budget: budget,
            spent: 0,
            maxSlippageBps: maxSlippageBps,
            expiry: expiry,
            revoked: false,
            goal: goal
        });
        mandatesByOwner[msg.sender].push(id);

        emit MandateCreated(id, msg.sender, agent, sourceToken, targetToken, budget, maxSlippageBps, expiry, goal);
    }

    /// @notice Owner kills the mandate. The agent's authority ends immediately.
    function revokeMandate(bytes32 id) external {
        Mandate storage m = mandates[id];
        if (m.owner != msg.sender) revert NotOwner();
        if (m.revoked) revert AlreadyRevoked();
        m.revoked = true;
        emit MandateRevoked(id, msg.sender);
    }

    /// @notice Agent records an execution. Reverts unless every boundary holds.
    function recordExecution(
        bytes32 id,
        uint256 spendAmount,
        uint256 receivedAmount,
        uint16 slippageBps,
        bytes32 routeRef
    ) external {
        Mandate storage m = mandates[id];
        if (m.agent != msg.sender) revert NotAgent();
        if (m.revoked) revert AlreadyRevoked();
        if (block.timestamp >= m.expiry) revert Expired();
        if (slippageBps > m.maxSlippageBps) revert SlippageExceeded(m.maxSlippageBps, slippageBps);

        uint256 remaining = m.budget - m.spent;
        if (spendAmount > remaining) revert BudgetExceeded(remaining, spendAmount);

        m.spent += spendAmount;
        _executions[id].push(
            Execution({
                spendAmount: spendAmount,
                receivedAmount: receivedAmount,
                slippageBps: slippageBps,
                timestamp: uint64(block.timestamp),
                routeRef: routeRef
            })
        );

        emit ExecutionRecorded(id, msg.sender, spendAmount, receivedAmount, slippageBps, routeRef);
        if (m.spent == m.budget) emit MandateExhausted(id, m.spent);
    }

    /// @notice Budget the agent can still spend.
    function remainingBudget(bytes32 id) external view returns (uint256) {
        Mandate storage m = mandates[id];
        return m.budget - m.spent;
    }

    /// @notice True while the agent may still act under this mandate.
    function isActive(bytes32 id) public view returns (bool) {
        Mandate storage m = mandates[id];
        return m.owner != address(0) && !m.revoked && block.timestamp < m.expiry && m.spent < m.budget;
    }

    function executionCount(bytes32 id) external view returns (uint256) {
        return _executions[id].length;
    }

    function executionAt(bytes32 id, uint256 index) external view returns (Execution memory) {
        return _executions[id][index];
    }

    function ownerMandateCount(address owner) external view returns (uint256) {
        return mandatesByOwner[owner].length;
    }
}
