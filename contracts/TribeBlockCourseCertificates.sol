// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

contract TribeBlockCourseCertificates {
    struct Credential {
        string certificateNumber;
        string metadataUri;
        uint256 issuedAt;
        bool revoked;
    }

    string public constant name = "Tribe Block University Certificates";
    string public constant symbol = "TBUCERT";

    address public owner;
    uint256 public nextTokenId = 1;

    mapping(address => bool) public minters;
    mapping(uint256 => address) private owners;
    mapping(address => uint256) private balances;
    mapping(uint256 => Credential) public credentials;
    mapping(bytes32 => uint256) public tokenByCertificateHash;

    event Transfer(address indexed from, address indexed to, uint256 indexed tokenId);
    event Approval(address indexed owner, address indexed approved, uint256 indexed tokenId);
    event ApprovalForAll(address indexed owner, address indexed operator, bool approved);
    event CertificateMinted(address indexed student, uint256 indexed tokenId, string certificateNumber, string metadataUri);
    event CertificateRevoked(uint256 indexed tokenId, string certificateNumber);
    event MinterChanged(address indexed minter, bool allowed);
    event OwnershipTransferred(address indexed oldOwner, address indexed newOwner);

    modifier onlyOwner() {
        require(msg.sender == owner, "NOT_OWNER");
        _;
    }

    modifier onlyMinter() {
        require(msg.sender == owner || minters[msg.sender], "NOT_MINTER");
        _;
    }

    constructor(address initialOwner) {
        require(initialOwner != address(0), "OWNER_REQUIRED");
        owner = initialOwner;
        minters[initialOwner] = true;
    }

    function supportsInterface(bytes4 interfaceId) external pure returns (bool) {
        return interfaceId == 0x01ffc9a7 || interfaceId == 0x80ac58cd || interfaceId == 0x5b5e139f;
    }

    function balanceOf(address account) external view returns (uint256) {
        require(account != address(0), "ZERO_ADDRESS");
        return balances[account];
    }

    function ownerOf(uint256 tokenId) public view returns (address) {
        address tokenOwner = owners[tokenId];
        require(tokenOwner != address(0), "TOKEN_NOT_FOUND");
        return tokenOwner;
    }

    function tokenURI(uint256 tokenId) external view returns (string memory) {
        require(owners[tokenId] != address(0), "TOKEN_NOT_FOUND");
        return credentials[tokenId].metadataUri;
    }

    function getApproved(uint256 tokenId) external view returns (address) {
        require(owners[tokenId] != address(0), "TOKEN_NOT_FOUND");
        return address(0);
    }

    function isApprovedForAll(address, address) external pure returns (bool) {
        return false;
    }

    function approve(address, uint256) external pure {
        revert("NON_TRANSFERABLE");
    }

    function setApprovalForAll(address, bool) external pure {
        revert("NON_TRANSFERABLE");
    }

    function transferFrom(address, address, uint256) external pure {
        revert("NON_TRANSFERABLE");
    }

    function safeTransferFrom(address, address, uint256) external pure {
        revert("NON_TRANSFERABLE");
    }

    function safeTransferFrom(address, address, uint256, bytes calldata) external pure {
        revert("NON_TRANSFERABLE");
    }

    function mintCertificate(
        address student,
        string calldata certificateNumber,
        string calldata metadataUri
    ) external onlyMinter returns (uint256 tokenId) {
        require(student != address(0), "STUDENT_REQUIRED");
        require(bytes(certificateNumber).length > 0, "CERTIFICATE_REQUIRED");
        require(bytes(metadataUri).length > 0, "METADATA_REQUIRED");

        bytes32 certificateHash = keccak256(bytes(certificateNumber));
        require(tokenByCertificateHash[certificateHash] == 0, "CERTIFICATE_EXISTS");

        tokenId = nextTokenId;
        nextTokenId += 1;

        owners[tokenId] = student;
        balances[student] += 1;
        credentials[tokenId] = Credential({
            certificateNumber: certificateNumber,
            metadataUri: metadataUri,
            issuedAt: block.timestamp,
            revoked: false
        });
        tokenByCertificateHash[certificateHash] = tokenId;

        emit Transfer(address(0), student, tokenId);
        emit CertificateMinted(student, tokenId, certificateNumber, metadataUri);
    }

    function revokeCertificate(uint256 tokenId) external onlyOwner {
        require(owners[tokenId] != address(0), "TOKEN_NOT_FOUND");
        require(!credentials[tokenId].revoked, "ALREADY_REVOKED");

        credentials[tokenId].revoked = true;

        emit CertificateRevoked(tokenId, credentials[tokenId].certificateNumber);
    }

    function setMinter(address minter, bool allowed) external onlyOwner {
        require(minter != address(0), "MINTER_REQUIRED");
        minters[minter] = allowed;

        emit MinterChanged(minter, allowed);
    }

    function transferOwnership(address newOwner) external onlyOwner {
        require(newOwner != address(0), "OWNER_REQUIRED");

        address oldOwner = owner;
        owner = newOwner;
        minters[newOwner] = true;

        emit OwnershipTransferred(oldOwner, newOwner);
    }

    function tokenIdForCertificate(string calldata certificateNumber) external view returns (uint256) {
        return tokenByCertificateHash[keccak256(bytes(certificateNumber))];
    }
}
