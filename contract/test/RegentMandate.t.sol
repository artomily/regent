// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {RegentMandate} from "../src/RegentMandate.sol";

/// Minimal cheatcode surface so the suite runs without vendoring forge-std.
interface Vm {
    function prank(address) external;
    function warp(uint256) external;
    function expectRevert(bytes calldata) external;
    function expectRevert(bytes4) external;
}

contract RegentMandateTest {
    Vm constant vm = Vm(address(uint160(uint256(keccak256("hevm cheat code")))));

    address constant OWNER = address(0xA11CE);
    address constant AGENT = address(0xB0B);
    address constant USDC = address(0xCC01);
    address constant WETH = address(0xCC02);

    RegentMandate reg;

    function setUp() public {
        reg = new RegentMandate();
        vm.warp(1_750_000_000);
    }

    function _create() internal returns (bytes32) {
        vm.prank(OWNER);
        return reg.createMandate(AGENT, USDC, WETH, 100e6, 200, uint64(block.timestamp + 1 days), "Acquire ETH");
    }

    function test_CreateMandate() public {
        bytes32 id = _create();
        (address owner, address agent,,, uint256 budget, uint256 spent, uint16 slip,, bool revoked,) =
            reg.mandates(id);
        require(owner == OWNER, "owner");
        require(agent == AGENT, "agent");
        require(budget == 100e6, "budget");
        require(spent == 0, "spent");
        require(slip == 200, "slippage");
        require(!revoked, "revoked");
        require(reg.isActive(id), "active");
        require(reg.ownerMandateCount(OWNER) == 1, "indexed");
    }

    function test_RevertWhen_BudgetZero() public {
        vm.prank(OWNER);
        vm.expectRevert(RegentMandate.InvalidParams.selector);
        reg.createMandate(AGENT, USDC, WETH, 0, 200, uint64(block.timestamp + 1 days), "x");
    }

    function test_RecordExecution_WithinBounds() public {
        bytes32 id = _create();
        vm.prank(AGENT);
        reg.recordExecution(id, 18e6, 12e15, 80, bytes32("uniswap-v3"));
        require(reg.remainingBudget(id) == 82e6, "remaining");
        require(reg.executionCount(id) == 1, "count");
    }

    function test_RevertWhen_NotAgent() public {
        bytes32 id = _create();
        vm.prank(OWNER);
        vm.expectRevert(RegentMandate.NotAgent.selector);
        reg.recordExecution(id, 1e6, 1, 10, 0);
    }

    function test_RevertWhen_OverBudget() public {
        bytes32 id = _create();
        vm.prank(AGENT);
        vm.expectRevert(abi.encodeWithSelector(RegentMandate.BudgetExceeded.selector, 100e6, 101e6));
        reg.recordExecution(id, 101e6, 1, 10, 0);
    }

    function test_RevertWhen_CumulativeOverBudget() public {
        bytes32 id = _create();
        vm.prank(AGENT);
        reg.recordExecution(id, 60e6, 1, 10, 0);
        vm.prank(AGENT);
        vm.expectRevert(abi.encodeWithSelector(RegentMandate.BudgetExceeded.selector, 40e6, 41e6));
        reg.recordExecution(id, 41e6, 1, 10, 0);
    }

    function test_RevertWhen_SlippageTooHigh() public {
        bytes32 id = _create();
        vm.prank(AGENT);
        vm.expectRevert(abi.encodeWithSelector(RegentMandate.SlippageExceeded.selector, uint16(200), uint16(201)));
        reg.recordExecution(id, 1e6, 1, 201, 0);
    }

    function test_RevertWhen_Expired() public {
        bytes32 id = _create();
        vm.warp(block.timestamp + 2 days);
        vm.prank(AGENT);
        vm.expectRevert(RegentMandate.Expired.selector);
        reg.recordExecution(id, 1e6, 1, 10, 0);
        require(!reg.isActive(id), "inactive after expiry");
    }

    function test_Revoke_StopsAgent() public {
        bytes32 id = _create();
        vm.prank(OWNER);
        reg.revokeMandate(id);
        vm.prank(AGENT);
        vm.expectRevert(RegentMandate.AlreadyRevoked.selector);
        reg.recordExecution(id, 1e6, 1, 10, 0);
        require(!reg.isActive(id), "inactive after revoke");
    }

    function test_RevertWhen_RevokeNotOwner() public {
        bytes32 id = _create();
        vm.prank(AGENT);
        vm.expectRevert(RegentMandate.NotOwner.selector);
        reg.revokeMandate(id);
    }

    function test_ExhaustedAfterFullSpend() public {
        bytes32 id = _create();
        vm.prank(AGENT);
        reg.recordExecution(id, 100e6, 1, 10, 0);
        require(reg.remainingBudget(id) == 0, "remaining zero");
        require(!reg.isActive(id), "inactive when exhausted");
    }
}
