// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

interface IERC20 {
    function transfer(address to, uint256 amount) external returns (bool);
    function transferFrom(address from, address to, uint256 amount) external returns (bool);
    function balanceOf(address account) external view returns (uint256);
}

contract TribeBlockUsdtPayments {
    struct Payment {
        address payer;
        uint256 amount;
        uint256 paidAt;
        string paymentReference;
    }

    IERC20 public immutable usdt;
    address public owner;
    address public treasury;
    uint256 public totalPaid;

    mapping(bytes32 => Payment) public payments;

    event SubscriptionPaid(address indexed payer, uint256 amount, string paymentReference);
    event TreasuryChanged(address indexed oldTreasury, address indexed newTreasury);
    event OwnershipTransferred(address indexed oldOwner, address indexed newOwner);
    event UsdtWithdrawn(address indexed to, uint256 amount);

    modifier onlyOwner() {
        require(msg.sender == owner, "NOT_OWNER");
        _;
    }

    constructor(address usdtToken, address treasuryWallet) {
        require(usdtToken != address(0), "USDT_REQUIRED");
        require(treasuryWallet != address(0), "TREASURY_REQUIRED");

        usdt = IERC20(usdtToken);
        owner = msg.sender;
        treasury = treasuryWallet;
    }

    function paySubscription(uint256 amount, string calldata paymentReference) external {
        require(amount > 0, "AMOUNT_REQUIRED");
        require(bytes(paymentReference).length > 0, "REFERENCE_REQUIRED");

        bytes32 referenceHash = keccak256(bytes(paymentReference));
        require(payments[referenceHash].paidAt == 0, "REFERENCE_PAID");

        bool received = usdt.transferFrom(msg.sender, address(this), amount);
        require(received, "USDT_TRANSFER_FAILED");

        payments[referenceHash] = Payment({
            payer: msg.sender,
            amount: amount,
            paidAt: block.timestamp,
            paymentReference: paymentReference
        });
        totalPaid += amount;

        emit SubscriptionPaid(msg.sender, amount, paymentReference);
    }

    function withdrawUsdt(uint256 amount) external onlyOwner {
        require(amount > 0, "AMOUNT_REQUIRED");

        bool sent = usdt.transfer(treasury, amount);
        require(sent, "USDT_WITHDRAW_FAILED");

        emit UsdtWithdrawn(treasury, amount);
    }

    function withdrawAllUsdt() external onlyOwner {
        uint256 balance = usdt.balanceOf(address(this));
        require(balance > 0, "NO_USDT");

        bool sent = usdt.transfer(treasury, balance);
        require(sent, "USDT_WITHDRAW_FAILED");

        emit UsdtWithdrawn(treasury, balance);
    }

    function setTreasury(address newTreasury) external onlyOwner {
        require(newTreasury != address(0), "TREASURY_REQUIRED");

        address oldTreasury = treasury;
        treasury = newTreasury;

        emit TreasuryChanged(oldTreasury, newTreasury);
    }

    function transferOwnership(address newOwner) external onlyOwner {
        require(newOwner != address(0), "OWNER_REQUIRED");

        address oldOwner = owner;
        owner = newOwner;

        emit OwnershipTransferred(oldOwner, newOwner);
    }
}
