const express = require("express");
const db = require("../db");
const { getOnChainRecord, hashCredentialData } = require("../blockchain");

const router = express.Router();

// Fields an employer is allowed to see. Deliberately excludes dob and
// studentId (roll number) — those are private and never needed just to
// confirm a degree is real. This is what actually enforces "selective
// disclosure" on the verification side — the student's disclosure choice
// controls what THEY proactively share, but this list is the hard privacy
// floor for anyone verifying by ID directly.
function toEmployerView(credential) {
  const { studentName, degree, institution, year, cgpa, status, id, createdAt } = credential;
  return { id, studentName, degree, institution, year, cgpa, status, createdAt };
}

// POST /api/employer/verify
// body: { id }
router.post("/verify", async (req, res) => {
  try {
    const { id } = req.body;
    console.log("\n[VERIFY] Looking up:", id);
    const credential = db.get("credentials").find({ id }).value();
    console.log("[VERIFY] Found in db.json?", !!credential);

    if (!credential) {
      return res.json({ result: "INVALID", reason: "No matching credential was found." });
    }

    const onChain = await getOnChainRecord(id);
    console.log("[VERIFY] On-chain record:", onChain);

    if (onChain.status === "None") {
      return res.json({ result: "INVALID", reason: "No blockchain record for this ID." });
    }

    // Recompute the hash from the off-chain data and compare to what's on-chain.
    // (This still uses the FULL original data internally — hiding fields from
    // the employer must never change what gets hashed/verified.)
    const { id: _id, status: _status, dataHash: _hash, issueTxHash: _tx, blockNumber: _block, createdAt: _created, ...originalData } = credential;
    const recomputedHash = hashCredentialData(originalData);
    console.log("[VERIFY] Stored dataHash:  ", credential.dataHash);
    console.log("[VERIFY] On-chain dataHash:", onChain.dataHash);
    console.log("[VERIFY] Recomputed hash:  ", recomputedHash);
    console.log("[VERIFY] originalData used for hash:", originalData);

    if (recomputedHash !== onChain.dataHash) {
      return res.json({ result: "INVALID", reason: "Data does not match the blockchain record — possible tampering." });
    }

    const safeCredential = toEmployerView(credential);

    if (onChain.status === "Revoked") {
      return res.json({ result: "REVOKED", credential: safeCredential });
    }

    res.json({ result: "VALID", credential: safeCredential, onChain });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;