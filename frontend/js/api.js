// CredChain API client — replaces the mock `credentials` / `activities`
// arrays in your original index.html with real calls to the Express backend.

const API_BASE = "http://localhost:4000/api";

const CredChainAPI = {
  // Institution
  async issueCredential(payload) {
    const res = await fetch(`${API_BASE}/institution/issue`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    return res.json();
  },

  async revokeCredential(id) {
    const res = await fetch(`${API_BASE}/institution/revoke/${id}`, { method: "POST" });
    return res.json();
  },

  async listAllCredentials() {
    const res = await fetch(`${API_BASE}/institution/credentials`);
    return res.json();
  },
  async listActivities() {
  const res = await fetch(`${API_BASE}/institution/activities`);
  return res.json();
},

  // Student
  async listStudentCredentials(studentId) {
    const res = await fetch(`${API_BASE}/student/${studentId}/credentials`);
    return res.json();
  },

  async shareCredential(id, fields) {
    const res = await fetch(`${API_BASE}/student/share`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, fields }),
    });
    return res.json();
  },

  // Employer
  async verifyCredential(id) {
    const res = await fetch(`${API_BASE}/employer/verify`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
    return res.json();
  },
};
