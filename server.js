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
const DB_FILE = "./db.json";

// =====================
// DB LOAD
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
// DB SAVE
// =====================
function saveDB(data) {
  fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2));
}

// mémoire
let structures = loadDB();

// =====================
// UTIL
// =====================
function generateId() {
  return `id-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
}

// =====================
// ROUTES
// =====================

// TEST SERVER
app.get("/", (req, res) => {
  res.send("Backend OK");
});

// GET ALL (frontend call)
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

// CREATE (frontend or bot)
app.post("/api/structures", (req, res) => {
  const { title, category, html, css, url } = req.body;

  if (!title || !html) {
    return res.status(400).json({ error: "Missing data" });
  }

  const newItem = {
    id: generateId(),
    title,
    category: category || "unknown",
    html,
    css: css || "",
    url: url || "",
    createdAt: new Date().toISOString()
  };

  structures.unshift(newItem);
  saveDB(structures);

  res.status(201).json(newItem);
});

// UPDATE
app.put("/api/structures/:id", (req, res) => {
  const index = structures.findIndex(s => s.id === req.params.id);

  if (index === -1) {
    return res.status(404).json({ error: "Not found" });
  }

  structures[index] = {
    ...structures[index],
    ...req.body,
    updatedAt: new Date().toISOString()
  };

  saveDB(structures);

  res.json(structures[index]);
});

// DELETE
app.delete("/api/structures/:id", (req, res) => {
  const index = structures.findIndex(s => s.id === req.params.id);

  if (index === -1) {
    return res.status(404).json({ error: "Not found" });
  }

  const deleted = structures.splice(index, 1);

  saveDB(structures);

  res.json(deleted[0]);
});

// SEARCH
app.get("/api/search", (req, res) => {
  const q = (req.query.q || "").toLowerCase();

  const results = structures.filter(s =>
    (s.title || "").toLowerCase().includes(q) ||
    (s.category || "").toLowerCase().includes(q)
  );

  res.json(results);
});

// 404
app.use((req, res) => {
  res.status(404).json({ error: "Route not found" });
});

// START
app.listen(PORT, () => {
  console.log("🚀 Backend running on port", PORT);
});