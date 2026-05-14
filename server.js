
const express = require("express");
const cors = require("cors");
const fs = require("fs");

const app = express();

// Configuration
app.use(cors());
app.use(express.json({ limit: "10mb" }));

const PORT = process.env.PORT || 3000;
const API_KEY = process.env.STUFFONE_API_KEY;

// Fichier de base de données JSON
const DB_FILE = "./db.json";

// Charger les données depuis le fichier
function loadDB() {
    try {
        const data = fs.readFileSync(DB_FILE, "utf-8");
        return JSON.parse(data);
    } catch (err) {
        console.error("Erreur de chargement de la DB :", err);
        return [];
    }
}

// Sauvegarder les données dans le fichier
function saveDB(data) {
    try {
        fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2));
    } catch (err) {
        console.error("Erreur de sauvegarde de la DB :", err);
    }
}

// Charger les données en mémoire
let structures = loadDB();

// Générateur d'ID unique
function generateId() {
    return `id-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
}

// Middleware pour vérifier la clé API
function checkApiKey(req, res, next) {
    const key = req.headers["x-api-key"];
    if (!key || key !== API_KEY) {
        return res.status(401).json({ error: "Unauthorized" });
    }
    next();
}

// Validation des données pour un nouvel upload
function validate(data) {
    if (!data.title || typeof data.title !== "string") return "title invalide";
    if (!data.html || typeof data.html !== "string") return "html invalide";
    return null;
}

// Routes

// Vérifier que le serveur est en ligne
app.get("/", (req, res) => {
    res.send("🚀 StuffOne JSON Backend opérationnel");
});

// Récupérer toutes les structures
app.get("/api/structures", (req, res) => {
    res.json(structures);
});

// Récupérer une structure par ID
app.get("/api/structures/:id", (req, res) => {
    const item = structures.find(s => s.id === req.params.id);
    if (!item) {
        return res.status(404).json({ error: "Introuvable" });
    }
    res.json(item);
});

// Créer une nouvelle structure (via le bot)
app.post("/upload", checkApiKey, (req, res) => {
    const error = validate(req.body);
    if (error) return res.status(400).json({ error });

    const { title, category, html, css, url, hash, depth } = req.body;

    // Vérifier les doublons via le hash
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
        id: `id-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
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

// Mettre à jour une structure
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

// Supprimer une structure
app.delete("/api/structures/:id", (req, res) => {
    const index = structures.findIndex(s => s.id === req.params.id);

    if (index === -1) {
        return res.status(404).json({ error: "Introuvable" });
    }

    const deleted = structures.splice(index, 1);
    saveDB(structures);

    res.json({
        message: