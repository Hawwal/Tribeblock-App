// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

interface IGoodDollarToken {
    function transfer(address to, uint256 amount) external returns (bool);
    function balanceOf(address account) external view returns (uint256);
}

contract TribeBlockGoodDollarRewardsVault {
    struct Reward {
        address recipient;
        uint256 amount;
        bool claimed;
        bool canceled;
    }

    IGoodDollarToken public immutable goodDollar;
    address public owner;
    uint256 public totalClaimable;

    mapping(bytes32 => Reward) public rewards;

    event RewardPrepared(bytes32 indexed rewardHash, string rewardId, address indexed recipient, uint256 amount);
    event RewardClaimed(bytes32 indexed rewardHash, string rewardId, address indexed recipient, uint256 amount);
    event RewardCanceled(bytes32 indexed rewardHash, string rewardId, address indexed recipient, uint256 amount);
    event GoodDollarWithdrawn(address indexed to, uint256 amount);
    event OwnershipTransferred(address indexed oldOwner, address indexed newOwner);

    modifier onlyOwner() {
        require(msg.sender == owner, "NOT_OWNER");
        _;
    }

    constructor(address goodDollarToken, address initialOwner) {
        require(goodDollarToken != address(0), "GD_REQUIRED");
        require(initialOwner != address(0), "OWNER_REQUIRED");
        goodDollar = IGoodDollarToken(goodDollarToken);
        owner = initialOwner;
    }

    function setReward(string calldata rewardId, address recipient, uint256 amount) public onlyOwner {
        require(bytes(rewardId).length > 0, "REWARD_ID_REQUIRED");
        require(recipient != address(0), "RECIPIENT_REQUIRED");
        require(amount > 0, "AMOUNT_REQUIRED");

        bytes32 rewardHash = rewardKey(rewardId);
        Reward storage reward = rewards[rewardHash];
        require(!reward.claimed, "REWARD_CLAIMED");

        if (!reward.canceled && reward.amount > 0) {
            totalClaimable -= reward.amount;
        }

        reward.recipient = recipient;
        reward.amount = amount;
        reward.claimed = false;
        reward.canceled = false;
        totalClaimable += amount;

        require(goodDollar.balanceOf(address(this)) >= totalClaimable, "VAULT_UNDERFUNDED");
        emit RewardPrepared(rewardHash, rewardId, recipient, amount);
    }

    function setRewards(string[] calldata rewardIds, address[] calldata recipients, uint256[] calldata amounts) external onlyOwner {
        require(rewardIds.length == recipients.length && recipients.length == amounts.length, "LENGTH_MISMATCH");

        for (uint256 index = 0; index < rewardIds.length; index += 1) {
            setReward(rewardIds[index], recipients[index], amounts[index]);
        }
    }

    function cancelReward(string calldata rewardId) external onlyOwner {
        bytes32 rewardHash = rewardKey(rewardId);
        Reward storage reward = rewards[rewardHash];
        require(reward.amount > 0, "REWARD_NOT_FOUND");
        require(!reward.claimed, "REWARD_CLAIMED");
        require(!reward.canceled, "REWARD_CANCELED");

        reward.canceled = true;
        totalClaimable -= reward.amount;
        emit RewardCanceled(rewardHash, rewardId, reward.recipient, reward.amount);
    }

    function claimReward(string calldata rewardId) external {
        bytes32 rewardHash = rewardKey(rewardId);
        Reward storage reward = rewards[rewardHash];
        require(reward.amount > 0, "REWARD_NOT_FOUND");
        require(!reward.canceled, "REWARD_CANCELED");
        require(!reward.claimed, "REWARD_CLAIMED");
        require(msg.sender == reward.recipient, "NOT_RECIPIENT");

        reward.claimed = true;
        totalClaimable -= reward.amount;

        bool sent = goodDollar.transfer(reward.recipient, reward.amount);
        require(sent, "GD_TRANSFER_FAILED");
        emit RewardClaimed(rewardHash, rewardId, reward.recipient, reward.amount);
    }

    function withdrawAvailable(address to, uint256 amount) external onlyOwner {
        require(to != address(0), "TO_REQUIRED");
        require(amount > 0, "AMOUNT_REQUIRED");
        uint256 available = goodDollar.balanceOf(address(this)) - totalClaimable;
        require(amount <= available, "AMOUNT_RESERVED");

        bool sent = goodDollar.transfer(to, amount);
        require(sent, "GD_WITHDRAW_FAILED");
        emit GoodDollarWithdrawn(to, amount);
    }

    function rewardKey(string memory rewardId) public pure returns (bytes32) {
        return keccak256(bytes(rewardId));
    }

    function availableBalance() external view returns (uint256) {
        return goodDollar.balanceOf(address(this)) - totalClaimable;
    }

    function transferOwnership(address newOwner) external onlyOwner {
        require(newOwner != address(0), "OWNER_REQUIRED");
        address oldOwner = owner;
        owner = newOwner;
        emit OwnershipTransferred(oldOwner, newOwner);
    }
}
