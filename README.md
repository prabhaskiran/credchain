# CredChain — Setup Guide

A working blockchain-backed academic credential system: Solidity smart contract +
Express backend + your existing frontend UI.

## 1. Install contract dependencies and start the local blockchain

```bash
cd credchain
npm install
npx hardhat compile
npx hardhat node          # keep this terminal open — it's your free local blockchain
```

`hardhat node` prints 20 test accounts with private keys, each funded with 10,000
fake ETH. Copy **any one** of those private keys — you'll use it as the institution's
signing key.

## 2. Deploy the contract

In a **second terminal**:

```bash
cd credchain
npm run deploy:local
```

Copy the printed contract address.

## 3. Configure and start the backend

```bash
cd credchain/backend
npm install
cp .env.example .env
```

Edit `.env`:
- `CONTRACT_ADDRESS` = the address from step 2
- `ISSUER_PRIVATE_KEY` = the private key you copied in step 1

```bash
npm start
```

You should see `CredChain backend listening on http://localhost:4000`.

## 4. Serve the frontend

Copy your uploaded `innoventure.html` into `frontend/index.html`, then add this
line just before `</head>` (or before your existing `<script>` tag):

```html
<script src="js/api.js"></script>
```

Open it with the VS Code **Live Server** extension (right-click → "Open with Live
Server") so it runs on `http://localhost:5500` — this matches the QR/verify URLs
the backend generates. If Live Server uses a different port, update the
`verifyUrl` lines in `backend/routes/institution.js` and `student.js` to match.

## 5. Wire the existing UI functions to the real backend

Your original `index.html` uses in-memory arrays. Here are the three functions to
change — same field names, just swapped to hit the real API.

**`issueCredential()`** — replace the body with:
```javascript
async function issueCredential() {
    const student = document.getElementById("newStudent").value.trim();
    const roll = document.getElementById("newRoll").value.trim();
    const degree = document.getElementById("newDegree").value.trim();
    const year = document.getElementById("newYear").value;
    const cgpa = document.getElementById("newCgpa").value.trim();

    if (!student || !roll || !degree || !cgpa) {
        showToast("Please complete all required fields.");
        return;
    }

    const result = await CredChainAPI.issueCredential({
        studentName: student,
        studentId: roll,
        degree,
        branch: "",
        cgpa,
        year,
        institution: "ABC Institute of Technology"
    });

    if (result.error) {
        showToast(result.error);
        return;
    }

    closeModal("issueModal");
    clearIssueForm();
    await refreshCredentialsFromServer(); // see helper below
    showToast(`Credential ${result.credential.id} successfully issued on blockchain.`);
}
```

**`revokeCredential(id)`** — replace the body with:
```javascript
async function revokeCredential(id) {
    const result = await CredChainAPI.revokeCredential(id);
    if (result.error) { showToast(result.error); return; }
    await refreshCredentialsFromServer();
    showToast(`Credential ${id} revoked on blockchain.`);
}
```

**`verifyCredential()`** — replace the `setTimeout(...)` block with:
```javascript
async function verifyCredential() {
    const input = document.getElementById("verifyInput").value.trim().toUpperCase();
    if (!input) { showToast("Enter a Credential ID."); return; }

    const outcome = await CredChainAPI.verifyCredential(input);

    if (outcome.result === "VALID") showValidResult(outcome.credential);
    else if (outcome.result === "REVOKED") showRevokedResult(outcome.credential);
    else showInvalidResult(input);
}
```

**Add this helper** near the top of your script, and call it once on page load
instead of relying on the hardcoded `credentials` array:
```javascript
async function refreshCredentialsFromServer() {
    credentials.length = 0;
    const fresh = await CredChainAPI.listAllCredentials();
    fresh.forEach(c => credentials.push(c));
    renderDashboard();
    renderInstitutionCredentials();
}
```

## 6. Demo it

1. Open the site → log in as **Institution** → issue a credential. This calls
   `issueCredential()` on the smart contract on your local chain.
2. Log in as **Student** → see the credential in the wallet, generate a share/QR
   with only selected fields.
3. Log in as **Employer** → paste the credential ID → the backend fetches the
   on-chain record, recomputes the hash, and returns VALID / INVALID / REVOKED.
4. Go back to Institution and revoke the credential → verify again as Employer →
   status flips to REVOKED, proving the on-chain history can't be silently edited.

## Optional: deploy to a public testnet (Polygon Amoy)

For extra credibility with judges, get free test MATIC from
https://faucet.polygon.technology/, set `AMOY_RPC_URL` and `DEPLOYER_PRIVATE_KEY`
in the root `.env`, then run `npm run deploy:amoy` instead of `deploy:local`. You
can then show the transaction on https://amoy.polygonscan.com/.
