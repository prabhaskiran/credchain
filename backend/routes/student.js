const express = require("express");
const QRCode = require("qrcode");
const db = require("../db");

const router = express.Router();

// GET /api/student/:studentId/credentials
router.get("/:studentId/credentials", (req, res) => {
  const { studentId } = req.params;
  const credentials = db.get("credentials").filter({ studentId }).value();
  res.json(credentials);
});

// POST /api/student/share
// body: { id, fields: ["degree", "branch", "institution", "year"] }
// Returns only the chosen fields — this is the "selective disclosure" step.
router.post("/share", async (req, res) => {
  try {
    const { id, fields } = req.body;
    const credential = db.get("credentials").find({ id }).value();

    if (!credential) {
      return res.status(404).json({ error: "Credential not found." });
    }

    const disclosed = { id: credential.id, status: credential.status };
    (fields || []).forEach((field) => {
      if (credential[field] !== undefined) disclosed[field] = credential[field];
    });

    const verifyUrl = `http://localhost:5500/index.html#verify=${id}`;
    const qrDataUrl = await QRCode.toDataURL(verifyUrl);

    res.json({ disclosed, verifyUrl, qrDataUrl });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
