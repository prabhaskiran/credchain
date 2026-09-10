const express = require("express");
const cors = require("cors");
require("dotenv").config();

const institutionRoutes = require("./routes/institution");
const studentRoutes = require("./routes/student");
const employerRoutes = require("./routes/employer");

const app = express();
app.use(cors());
app.use(express.json());

app.use("/api/institution", institutionRoutes);
app.use("/api/student", studentRoutes);
app.use("/api/employer", employerRoutes);

app.get("/", (req, res) => {
  res.send("CredChain backend is running.");
});

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`CredChain backend listening on http://localhost:${PORT}`);
});
