const express = require("express");
const cors = require("cors");

const app = express();

app.use(cors());

app.get("/", (req, res) => {
  res.send("Backend actif");
});

app.get("/api/structures", (req, res) => {
  res.json([
    {
      id: "test-1",
      title: "Structure Test",
      category: "Landing",
      html: `
        <html>
          <body style="background:#111;color:white;font-family:sans-serif;padding:40px;">
            <h1>Hello Structure</h1>

            <div style="
              padding:20px;
              border:1px solid #444;
              border-radius:12px;
              margin-top:20px;
            ">
              Ceci est une structure test.
            </div>

          </body>
        </html>
      `
    }
  ]);
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log("Serveur lancé sur port " + PORT);
});
