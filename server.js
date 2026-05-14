const express = require("express");
const cors = require("cors");
const fs = require("fs");

const app = express();

// =====================
// CONFIG
// =====================
app.use(cors());
app.use(express.json({ limit: "10mb" }));

const PORT = process.env.PORT || 3000;
const API_KEY = process.env.STUFFONE_API_KEY;

// =====================
// DB FILE
// =====================
const DB_FILE = "./db.json";

// =====================
// LOAD DB
// =====================
function loadDB() {
  try {
    const data = fs.readFileSync(DB_FILE, "utf-8");
    return JSON.parse(data);
  } catch (err) {
    return [];
  }
}

// =====================
// SAVE DB
// =====================
function saveDB(data) {
  fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2));
}

// memory
let structures = loadDB();

// =====================
// UTILS
// =====================
function generateId() {
  return `id-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
}

// =====================
// API KEY (UPLOAD ONLY)
// =====================
function checkApiKey(req, res, next) {
  const key = req.headers["x-api-key"];

  if (!key || key !== API_KEY) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  next();
}

// =====================
// ROUTES
// =====================

// HEALTH CHECK
app.get("/", (req, res) => {
  res.send("🚀 Backend OK - StuffOne JSON");
});

// GET ALL
app.get("/api/structures", (req, res) => {
  res.json(structures);
});

// GET ONE
app.get("/api/structures/:id", (req, res) => {
  const item = structures.find(s => s.id === req.params.id);

  if (!item) {
    return res.status(404).json({ error: "Not found" });
  }

  res.json(item);
});

// CREATE (BOT UPLOAD)
app.post("/upload", checkApiKey, (req, res) => {

  const { title, category, html, css, url, hash } = req.body;

  if (!title || !html) {
    return res.status(400).json({ error: "Invalid data" });
  }

  // anti duplicate
  if (hash) {
    const exists = structures.find(s => s.hash === hash);

    if (exists) {
      return res.json({
        message: "Already exists",
        duplicate: true,
        id: exists.id
      });
    }
  }

  const newItem = {
    id: generateId(),
    title,
    category: category || "unknown",
    html,
    css: css || "",
    url: url || "",
    hash: hash || "",
    createdAt: new Date().toISOString()
  };

  structures.unshift(newItem);
  saveDB(structures);

  console.log("[UPLOAD]", title);

  res.status(201).json({
    message: "Saved",
    data: newItem
  });
});

// UPDATE
app.put("/api/structures/:id", (req, res) => {

  const index = structures.findIndex(s => s.id === req.params.id);

  if (index === -1) {
    return res.status(404).json({ error: "Not found" });
  }

  structures[index] = {
    ...structures[index],
    ...req.body
  };

  saveDB(structures);

  res.json({
    message: "Updated",
    data: structures[index]
  });
});

// DELETE ONE
app.delete("/api/structures/:id", (req, res) => {

  const index = structures.findIndex(s => s.id === req.params.id);

  if (index === -1) {
    return res.status(404).json({ error: "Not found" });
  }

  const deleted = structures.splice(index, 1);

  saveDB(structures);

  res.json({
    message: "Deleted",
    data: deleted[0]
  });
});

// RESET ALL
app.delete("/api/admin/reset", (req, res) => {

  const count = structures.length;
  structures = [];

  saveDB(structures);

  res.json({
    message: "Reset done",
    deletedCount: count
  });
});

// SEARCH
app.get("/api/search", (req, res) => {

  const q = (req.query.q || "").toLowerCase();

  const results = structures.filter(s =>
    (s.title || "").toLowerCase().includes(q) ||
    (s.category || "").toLowerCase().includes(q)
  );

  res.json({
    query: q,
    count: results.length,
    results
  });
});

// 404
app.use((req, res) => {
  res.status(404).json({ error: "Route not found" });
});

// START SERVER
app.listen(PORT, () => {
  console.log("================================");
  console.log("🚀 StuffOne Backend RUNNING");
  console.log("================================");
  console.log("GET    /api/structures");
  console.log("POST   /upload (API KEY)");
  console.log("PUT    /api/structures/:id");
  console.log("DELETE /api/structures/:id");
  console.log("GET    /api/search?q=");
  console.log("================================");
});