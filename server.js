const express = require("express");
const cors = require("cors");

const app = express();

// =====================
// CONFIGURATION
// =====================
app.use(cors());
app.use(express.json({ limit: "10mb" }));

// =====================
// "BASE DE DONNÉES" MÉMOIRE
// =====================
let structures = [
  {
    id: "test-1",
    title: "Structure Test",
    category: "Landing",
    html: "<html><body><h1>Structure par défaut</h1></body></html>",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  }
];

// =====================
// UTILITAIRES
// =====================
function generateId() {
  return `id-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
}

function findIndexById(id) {
  return structures.findIndex(s => s.id === id);
}

// =====================
// VALIDATION
// =====================
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
// ROUTES - CORE
// =====================

// Health check
app.get("/", (req, res) => {
  res.status(200).send("🚀 WebVault API opérationnel");
});

// GET all
app.get("/api/structures", (req, res) => {
  res.json(structures);
});

// GET by ID
app.get("/api/structures/:id", (req, res) => {
  const item = structures.find(s => s.id === req.params.id);

  if (!item) {
    return res.status(404).json({ error: "Structure introuvable" });
  }

  res.json(item);
});

// CREATE
app.post("/upload", (req, res) => {
  const error = validateStructure(req.body);
  if (error) {
    return res.status(400).json({ error });
  }

  const { title, category, html } = req.body;

  const newStructure = {
    id: generateId(),
    title,
    category: category || "Non classé",
    html,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

  structures.unshift(newStructure);

  console.log(`[UPLOAD] ${title}`);

  res.status(201).json({
    message: "Structure créée avec succès",
    data: newStructure
  });
});

// UPDATE
app.put("/api/structures/:id", (req, res) => {
  const index = findIndexById(req.params.id);

  if (index === -1) {
    return res.status(404).json({ error: "Structure introuvable" });
  }

  const error = validateStructure(req.body);
  if (error) {
    return res.status(400).json({ error });
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

// DELETE
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

// SEARCH (utile pour ton bot scraping)
app.get("/api/search", (req, res) => {
  const q = (req.query.q || "").toLowerCase();

  const results = structures.filter(s =>
    s.title.toLowerCase().includes(q) ||
    s.category.toLowerCase().includes(q)
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
const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log("----------------------------------");
  console.log("🚀 WebVault Backend lancé");
  console.log("➡ GET    /api/structures");
  console.log("➡ GET    /api/structures/:id");
  console.log("➡ POST   /upload");
  console.log("➡ PUT    /api/structures/:id");
  console.log("➡ DELETE /api/structures/:id");
  console.log("➡ GET    /api/search?q=");
  console.log("----------------------------------");
});
app.delete("/clear", (req, res) => {

    structures = [];

    res.json({

        message: "Toutes les structures ont été supprimées"

    });

});