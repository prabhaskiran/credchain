// Seed script — populates CredChain with a handful of REAL demo credentials
// by calling your actual backend API (not fake/mock data). Each one is
// genuinely issued on the smart contract, so it will verify correctly,
// can be revoked for real, and shows up correctly in every portal.
//
// PREREQUISITES before running this:
//   1. `npx hardhat node` is running (in credchain root)
//   2. Contract is deployed (`npm run deploy:local`) and backend/.env is set
//   3. Backend is running: `npm start` inside backend/ (must be up on :4000)
//
// Run with:  node seed.js   (from inside the backend/ folder)

const API_BASE = "http://localhost:4000/api";

const demoCredentials = [
  {
    studentName: "Rahul Sharma",
    studentId: "22CSE1045",
    degree: "B.Tech Computer Science",
    branch: "CSE",
    cgpa: "8.7",
    year: "2026",
    dob: "2004-05-14",
    institution: "ABC Institute of Technology",
  },
  {
    studentName: "Priya Nair",
    studentId: "21DS1021",
    degree: "B.Sc Data Science",
    branch: "Data Science",
    cgpa: "9.1",
    year: "2025",
    dob: "2003-11-21",
    institution: "ABC Institute of Technology",
  },
  {
    studentName: "Arjun Mehta",
    studentId: "20AIML114",
    degree: "B.Tech Artificial Intelligence",
    branch: "AI/ML",
    cgpa: "8.4",
    year: "2024",
    dob: "2002-08-17",
    institution: "ABC Institute of Technology",
  },
  {
    studentName: "Ananya Rao",
    studentId: "23ECE0092",
    degree: "B.Tech Electronics & Communication",
    branch: "ECE",
    cgpa: "9.3",
    year: "2026",
    dob: "2004-02-09",
    institution: "ABC Institute of Technology",
  },
];

// This one gets revoked right after issuing, so you have a live REVOKED
// example ready to demo without having to click through it yourself.
const REVOKE_INDEX = 2; // Arjun Mehta

async function main() {
  console.log("Seeding CredChain with real demo credentials...\n");
  const issuedIds = [];

  for (const student of demoCredentials) {
    const res = await fetch(`${API_BASE}/institution/issue`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(student),
    });
    const data = await res.json();

    if (data.error) {
      console.error(`✗ Failed to issue for ${student.studentName}: ${data.error}`);
      continue;
    }

    console.log(`✓ Issued ${data.credential.id} for ${student.studentName} (roll: ${student.studentId})`);
    issuedIds.push({ id: data.credential.id, studentId: student.studentId, name: student.studentName });
  }

  const toRevoke = issuedIds[REVOKE_INDEX];
  if (toRevoke) {
    const res = await fetch(`${API_BASE}/institution/revoke/${toRevoke.id}`, { method: "POST" });
    const data = await res.json();
    if (data.error) {
      console.error(`✗ Failed to revoke ${toRevoke.id}: ${data.error}`);
    } else {
      console.log(`✓ Revoked ${toRevoke.id} (${toRevoke.name}) — now demoable as a REVOKED result`);
    }
  }

  console.log("\nDone. Login roll numbers you can use to test the Student portal:");
  issuedIds.forEach((c) => console.log(`  ${c.name} → roll: ${c.studentId}`));
  console.log("\nCredential IDs you can paste into Employer verification:");
  issuedIds.forEach((c) => console.log(`  ${c.id} (${c.name})`));
}

main().catch((err) => {
  console.error("Seed script failed:", err.message);
  console.error("Make sure the backend is running on http://localhost:4000 first.");
});
