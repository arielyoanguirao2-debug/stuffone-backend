const express = require("express");
const cors = require("cors");

const app = express();

// =====================
// CONFIG
// =====================
app.use(cors());
app.use(express.json({ limit: "10mb" }));

// =====================
// "DB" EN MÉMOIRE
// =====================
let structures = [
  {
    id: "test-1",
    title: "Structure Test",
    category: "Landing",
    html: "<html><body><h1>Structure par défaut</h1></body></html>",
    css: "",
    url: "",
    hash: "default",
    depth: 0,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  }
];

// =====================
// UTILS
// =====================
function generateId() {
  return `id-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
}

function findIndexById(id) {
  return structures.findIndex(s => s.id === id);
}

function normalizeString(str) {
  return (str || "").toString().toLowerCase();
}

function validateStructure(data) {
  if (!data.title || typeof data.title !== "string") {
    return "title invalide";
  }

  if (!data.html || typeof data.html !== "string") {
    return "html invalide";
  }

  return null;
}

// =====================
// ROUTES CORE
// =====================

// HEALTH CHECK
app.get("/", (req, res) => {
  res.status(200).send("🚀 StuffOne Backend API OK");
});

// =====================
// GET ALL STRUCTURES
// =====================
app.get("/api/structures", (req, res) => {
  res.json(structures);
});

// =====================
// GET ONE STRUCTURE
// =====================
app.get("/api/structures/:id", (req, res) => {
  const item = structures.find(s => s.id === req.params.id);

  if (!item) {
    return res.status(404).json({ error: "Structure introuvable" });
  }

  res.json(item);
});

// =====================
// CREATE (UPLOAD BOT)
// =====================
app.post("/upload", (req, res) => {

  const error = validateStructure(req.body);
  if (error) {
    return res.status(400).json({ error });
  }

  const { title, category, html, css, url, hash, depth } = req.body;

  // DEDUPLICATION
  if (hash) {
    const exists = structures.find(s => s.hash === hash);

    if (exists) {
      return res.json({
        message: "Structure déjà existante",
        duplicate: true,
        id: exists.id
      });
    }
  }

  const newStructure = {
    id: generateId(),
    title,
    category: category || "unknown",
    html,
    css: css || "",
    url: url || "",
    hash: hash || "",
    depth: depth || 0,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

  structures.unshift(newStructure);

  console.log(`[UPLOAD] ${title} | ${category || "unknown"}`);

  res.status(201).json({
    message: "Structure enregistrée",
    data: newStructure
  });
});

// =====================
// UPDATE STRUCTURE
// =====================
app.put("/api/structures/:id", (req, res) => {

  const index = findIndexById(req.params.id);

  if (index === -1) {
    return res.status(404).json({ error: "Structure introuvable" });
  }

  structures[index] = {
    ...structures[index],
    ...req.body,
    updatedAt: new Date().toISOString()
  };

  res.json({
    message: "Structure mise à jour",
    data: structures[index]
  });
});

// =====================
// DELETE ONE
// =====================
app.delete("/api/structures/:id", (req, res) => {

  const index = findIndexById(req.params.id);

  if (index === -1) {
    return res.status(404).json({ error: "Structure introuvable" });
  }

  const deleted = structures.splice(index, 1);

  res.json({
    message: "Structure supprimée",
    data: deleted[0]
  });
});

// =====================
// DELETE ALL
// =====================
app.delete("/api/structures", (req, res) => {

  const count = structures.length;
  structures = [];

  res.json({
    message: "Toutes les structures supprimées",
    deletedCount: count
  });
});

// =====================
// ADMIN RESET
// =====================
app.delete("/api/admin/reset", (req, res) => {

  const backup = [...structures];
  structures = [];

  res.json({
    message: "RESET COMPLET",
    deletedCount: backup.length
  });
});

// =====================
// SEARCH
// =====================
app.get("/api/search", (req, res) => {

  const q = normalizeString(req.query.q);

  const results = structures.filter(s =>
    normalizeString(s.title).includes(q) ||
    normalizeString(s.category).includes(q)
  );

  res.json({
    query: q,
    count: results.length,
    results
  });
});

// =====================
// 404
// =====================
app.use((req, res) => {
  res.status(404).json({ error: "Route non trouvée" });
});

// =====================
// START SERVER
// =====================
const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log("=================================");
  console.log("🚀 StuffOne Backend Started");
  console.log("=================================");
  console.log("POST   /upload");
  console.log("GET    /api/structures");
  console.log("GET    /api/structures/:id");
  console.log("PUT    /api/structures/:id");
  console.log("DELETE /api/structures/:id");
  console.log("DELETE /api/structures");
  console.log("DELETE /api/admin/reset");
  console.log("GET    /api/search?q=");
  console.log("=================================");
});