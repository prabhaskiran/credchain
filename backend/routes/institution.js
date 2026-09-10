const express = require("express");
const QRCode = require("qrcode");
const db = require("../db");
const { issueOnChain, revokeOnChain } = require("../blockchain");

const router = express.Router();

function generateCredentialId() {
  return "CRED-" + Math.random().toString(36).slice(2, 10).toUpperCase();
}

// POST /api/institution/issue
// body: { studentName, studentId, degree, branch, cgpa, year, institution }
router.post("/issue", async (req, res) => {
  try {
    const { studentName, studentId, degree, branch, cgpa, year, dob, institution } = req.body;

    if (!studentName || !studentId || !degree || !year) {
      return res.status(400).json({ error: "Missing required credential fields." });
    }

    const id = generateCredentialId();
    const data = { studentName, studentId, degree, branch, cgpa, year, dob, institution };

    const { txHash, dataHash, blockNumber } = await issueOnChain(id, data);

    const record = {
      id,
      ...data,
      status: "VALID",
      dataHash,
      issueTxHash: txHash,
      blockNumber,
      createdAt: new Date().toISOString(),
    };

    db.get("credentials").push(record).write();
    db.get("activities")
      .push({
        icon: "🏫",
        title: "Credential issued",
        text: `${degree} issued to ${studentName}`,
        time: new Date().toLocaleString(),
      })
      .write();

    const verifyUrl = `http://localhost:5500/index.html#verify=${id}`;
    const qrDataUrl = await QRCode.toDataURL(verifyUrl);

    res.json({ credential: record, verifyUrl, qrDataUrl });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

// POST /api/institution/revoke/:id
router.post("/revoke/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const credential = db.get("credentials").find({ id }).value();

    if (!credential) {
      return res.status(404).json({ error: "Credential not found." });
    }

    await revokeOnChain(id);

    db.get("credentials").find({ id }).assign({ status: "REVOKED" }).write();
    db.get("activities")
      .push({
        icon: "⚠️",
        title: "Credential revoked",
        text: `${credential.degree} for ${credential.studentName} was revoked`,
        time: new Date().toLocaleString(),
      })
      .write();

    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

// GET /api/institution/credentials
router.get("/credentials", (req, res) => {
  res.json(db.get("credentials").value());
});

router.get("/activities", (req, res) => {
  const activities = db.get("activities").value().slice().reverse();
  res.json(activities);
});


module.exports = router;
