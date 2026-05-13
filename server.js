const express = require("express");
const cors = require("cors");

const app = express();

// --- CONFIGURATION ---
app.use(cors());
// CRUCIAL : Permet au serveur de lire le JSON envoyé dans le corps (body) des requêtes
app.use(express.json({ limit: '10mb' })); 

// Simulation d'une base de données en mémoire
let structures = [
  {
    id: "test-1",
    title: "Structure Test",
    category: "Landing",
    html: "<html><body><h1>Structure par défaut</h1></body></html>"
  }
];

// --- ROUTES ---

// 1. Route de santé (Health Check)
app.get("/", (req, res) => {
  res.status(200).send("Serveur WebVault Backend opérationnel.");
});

// 2. Récupérer toutes les structures (GET)
app.get("/api/structures", (req, res) => {
  try {
    res.json(structures);
  } catch (error) {
    res.status(500).json({ error: "Erreur lors de la récupération des structures" });
  }
});

// 3. LA ROUTE MANQUANTE : Recevoir et ajouter une structure (POST)
app.post("/upload", (req, res) => {
  try {
    const { title, category, html } = req.body;

    // Validation minimaliste
    if (!title || !html) {
      return res.status(400).json({ 
        error: "Données incomplètes. 'title' et 'html' sont requis." 
      });
    }

    // Création d'un nouvel objet structure
    const newStructure = {
      id: `id-${Date.now()}`, // Génère un ID unique basé sur le temps
      title,
      category: category || "Non classé",
      html
    };

    // Ajout à notre "base de données" (en haut de la liste)
    structures.unshift(newStructure);

    console.log(`[LOG] Nouvelle structure reçue : ${title}`);

    res.status(201).json({
      message: "Structure ajoutée avec succès !",
      data: newStructure
    });

  } catch (error) {
    console.error("Erreur Upload:", error);
    res.status(500).json({ error: "Erreur interne du serveur lors de l'upload" });
  }
});

// Gestion des routes non trouvées (404)
app.use((req, res) => {
  res.status(404).json({ error: "Route non trouvée sur ce backend" });
});

// --- LANCEMENT ---
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`-----------------------------------------`);
  console.log(`🚀 Serveur WebVault lancé sur le port ${PORT}`);
  console.log(`➡️  Route GET : /api/structures`);
  console.log(`➡️  Route POST : /upload`);
  console.log(`-----------------------------------------`);
});
