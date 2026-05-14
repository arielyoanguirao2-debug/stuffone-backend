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

// API KEY (Render env recommandé)
const API_KEY = process.env.STUFFONE_API_KEY;

// =====================
// DB FILE
// =====================
const DB_FILE = "./db.json";
const DB_BACKUP = "./db.backup.json";

// =====================
// LOAD DB
// =====================
function loadDB() {
  try {
    const data = fs.readFileSync(DB_FILE, "utf-8");
    return JSON.parse(data);
  } catch (err) {
    console.log("⚠️ DB vide ou corrompue, reset automatique");
    return [];
  }
}

// =====================
// SAFE SAVE DB (anti corruption)
// =====================
function saveDB(data) {
  try {
    // backup avant écriture
    fs.writeFileSync(DB_BACKUP, JSON.stringify(data, null, 2));

    // write final
    fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2));

  } catch (err) {
    console.error("❌ Erreur sauvegarde DB:", err);
  }
}

// memory cache
let structures = loadDB();

// =====================
// UTILS
// =====================
function generateId() {
  return `id-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
}

function normalize(str) {
  return (str || "").toLowerCase();
}

// =====================
// AUTH MIDDLEWARE
// =====================
function checkApiKey(req, res, next) {
  const key = req.headers["x-api-key"];

  if (!key || key !== API_KEY) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  next();
}

// =====================
// VALIDATION
// =====================
function validate(data) {
  if (!data.title || typeof data.title !== "string") return "title invalide";
  if (!data.html || typeof data.html !== "string") return "html invalide";
  return null;
}

// =====================
// ROUTES
// =====================

// HEALTH
app.get("/", (req, res) => {
  res.send("🚀 StuffOne JSON Backend OK");
});

// GET ALL
app.get("/api/structures", (req, res) => {
  res.json(structures);
});

// GET ONE
app.get("/api/structures/:id", (req, res) => {
  const item = structures.find(s => s.id === req.params.id);

  if (!item) {
    return res.status(404).json({ error: "Introuvable" });
  }

  res.json(item);
});

// =====================
// CREATE (BOT)
// =====================
app.post("/upload", checkApiKey, (req, res) => {

  const error = validate(req.body);
  if (error) return res.status(400).json({ error });

  const { title, category, html, css, url, hash, depth } = req.body;

  // duplicate check
  if (hash) {
    const exists = structures.find(s => s.hash === hash);
    if (exists) {
      return res.json({
        message: "Déjà existant",
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
  saveDB(structures);

  console.log(`[UPLOAD] ${title}`);

  res.status(201).json({
    message: "Structure ajoutée",
    data: newStructure
  });
});

// =====================
// UPDATE
// =====================
app.put("/api/structures/:id", (req, res) => {

  const index = structures.findIndex(s => s.id === req.params.id);

  if (index === -1) {
    return res.status(404).json({ error: "Introuvable" });
  }

  structures[index] = {
    ...structures[index],
    ...req.body,
    updatedAt: new Date().toISOString()
  };

  saveDB(structures);

  res.json({
    message: "Mis à jour",
    data: structures[index]
  });
});

// =====================
// DELETE ONE
// =====================
app.delete("/api/structures/:id", (req, res) => {

  const index = structures.findIndex(s => s.id === req.params.id);

  if (index === -1) {
    return res.status(404).json({ error: "Introuvable" });
  }

  const deleted = structures.splice(index, 1);

  saveDB(structures);

  res.json({
    message: "Supprimé",
    data: deleted[0]
  });
});

// =====================
// RESET ALL
// =====================
app.delete("/api/admin/reset", (req, res) => {

  const count = structures.length;

  structures = [];
  saveDB(structures);

  res.json({
    message: "RESET OK",
    deletedCount: count
  });
});

// =====================
// SEARCH
// =====================
app.get("/api/search", (req, res) => {

  const q = normalize(req.query.q);

  const results = structures.filter(s =>
    normalize(s.title).includes(q) ||
    normalize(s.category).includes(q)
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
// START
// =====================
app.listen(PORT, () => {
  console.log("================================");
  console.log("🚀 StuffOne JSON Backend");
  console.log("================================");
  console.log("POST   /upload (API KEY)");
  console.log("GET    /api/structures");
  console.log("GET    /api/structures/:id");
  console.log("PUT    /api/structures/:id");
  console.log("DELETE /api/structures/:id");
  console.log("DELETE /api/admin/reset");
  console.log("GET    /api/search?q=");
  console.log("================================");
});