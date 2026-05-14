const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");

const app = express();

// =====================
// CONFIG
// =====================
app.use(cors());
app.use(express.json({ limit: "10mb" }));

const PORT = process.env.PORT || 3000;

// ENV
const API_KEY = process.env.STUFFONE_API_KEY;
const MONGO_URI = process.env.MONGO_URI;

// =====================
// MONGODB CONNECT
// =====================
mongoose.connect(MONGO_URI)
  .then(() => console.log("🟢 MongoDB connecté"))
  .catch(err => console.error("🔴 MongoDB error:", err));

mongoose.connection.on("error", err => {
  console.error("Mongo runtime error:", err);
});

// =====================
// MODEL
// =====================
const StructureSchema = new mongoose.Schema({
  title: String,
  category: String,
  html: String,
  css: String,
  url: String,
  hash: String,
  depth: Number
}, { timestamps: true });

const Structure = mongoose.model("Structure", StructureSchema);

// =====================
// SECURITY MIDDLEWARE
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

// HEALTH
app.get("/", (req, res) => {
  res.send("🚀 StuffOne API OK (MongoDB)");
});

// GET ALL
app.get("/api/structures", async (req, res) => {
  const data = await Structure.find().sort({ createdAt: -1 });
  res.json(data);
});

// GET ONE
app.get("/api/structures/:id", async (req, res) => {
  const item = await Structure.findById(req.params.id);

  if (!item) {
    return res.status(404).json({ error: "Introuvable" });
  }

  res.json(item);
});

// =====================
// UPLOAD (BOT)
// =====================
app.post("/upload", checkApiKey, async (req, res) => {

  const {
    title,
    category,
    html,
    css,
    url,
    hash,
    depth
  } = req.body;

  if (!title || !html) {
    return res.status(400).json({ error: "Données invalides" });
  }

  // DUPLICATE CHECK
  if (hash) {
    const exists = await Structure.findOne({ hash });

    if (exists) {
      return res.json({
        message: "Déjà existant",
        duplicate: true,
        id: exists._id
      });
    }
  }

  const newStructure = await Structure.create({
    title,
    category: category || "unknown",
    html,
    css: css || "",
    url: url || "",
    hash: hash || "",
    depth: depth || 0
  });

  console.log(`[UPLOAD] ${title}`);

  res.status(201).json({
    message: "Structure enregistrée",
    data: newStructure
  });
});

// =====================
// UPDATE
// =====================
app.put("/api/structures/:id", async (req, res) => {

  const updated = await Structure.findByIdAndUpdate(
    req.params.id,
    { ...req.body },
    { new: true }
  );

  if (!updated) {
    return res.status(404).json({ error: "Introuvable" });
  }

  res.json({
    message: "Mis à jour",
    data: updated
  });
});

// =====================
// DELETE ONE
// =====================
app.delete("/api/structures/:id", async (req, res) => {

  const deleted = await Structure.findByIdAndDelete(req.params.id);

  if (!deleted) {
    return res.status(404).json({ error: "Introuvable" });
  }

  res.json({
    message: "Supprimé",
    data: deleted
  });
});

// =====================
// DELETE ALL (ADMIN)
// =====================
app.delete("/api/admin/reset", async (req, res) => {

  const count = await Structure.countDocuments();
  await Structure.deleteMany({});

  res.json({
    message: "RESET COMPLET",
    deletedCount: count
  });
});

// =====================
// SEARCH
// =====================
app.get("/api/search", async (req, res) => {

  const q = req.query.q || "";

  const results = await Structure.find({
    $or: [
      { title: { $regex: q, $options: "i" } },
      { category: { $regex: q, $options: "i" } }
    ]
  });

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
  console.log("🚀 StuffOne Backend Live");
  console.log("================================");
  console.log("MongoDB + API KEY + Bot Ready");
  console.log("================================");
});