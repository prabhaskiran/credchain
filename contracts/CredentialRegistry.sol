// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/// @title CredentialRegistry
/// @notice Stores a tamper-evident hash + status for each academic credential.
/// The actual student data (name, CGPA, degree, etc.) is NEVER stored on-chain —
/// only a hash of it, plus issuance/revocation status. This keeps personal data
/// private while making tampering or silent edits detectable.
contract CredentialRegistry {
    enum Status {
        None,     // 0 - credential does not exist
        Valid,    // 1 - issued and active
        Revoked   // 2 - issued, later revoked by the institution
    }

    struct Credential {
        bytes32 dataHash;   // keccak256 hash of the off-chain credential JSON
        address issuer;     // wallet address of the issuing institution
        Status status;
        uint256 issuedAt;
        uint256 revokedAt;
    }

    // credentialId (bytes32) => Credential record
    mapping(bytes32 => Credential) private credentials;

    event CredentialIssued(bytes32 indexed id, address indexed issuer, bytes32 dataHash, uint256 timestamp);
    event CredentialRevoked(bytes32 indexed id, address indexed issuer, uint256 timestamp);

    /// @notice Issue a new credential. Reverts if the id already exists.
    function issueCredential(bytes32 id, bytes32 dataHash) external {
        require(credentials[id].status == Status.None, "Credential already exists");

        credentials[id] = Credential({
            dataHash: dataHash,
            issuer: msg.sender,
            status: Status.Valid,
            issuedAt: block.timestamp,
            revokedAt: 0
        });

        emit CredentialIssued(id, msg.sender, dataHash, block.timestamp);
    }

    /// @notice Revoke an existing credential. Only the original issuer can revoke it.
    function revokeCredential(bytes32 id) external {
        Credential storage cred = credentials[id];
        require(cred.status == Status.Valid, "Credential not active");
        require(cred.issuer == msg.sender, "Only the issuing institution can revoke this");

        cred.status = Status.Revoked;
        cred.revokedAt = block.timestamp;

        emit CredentialRevoked(id, msg.sender, block.timestamp);
    }

    /// @notice Read-only lookup used by the verification page.
    function getCredential(bytes32 id)
        external
        view
        returns (bytes32 dataHash, address issuer, Status status, uint256 issuedAt, uint256 revokedAt)
    {
        Credential memory cred = credentials[id];
        return (cred.dataHash, cred.issuer, cred.status, cred.issuedAt, cred.revokedAt);
    }
}
