import express from "express";
import path from "path";
import fs from "fs/promises";
import { fileURLToPath } from "url";
import { createServer as createViteServer } from "vite";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const HISTORY_FILE = path.join(process.cwd(), "history.json");

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Body parser
  app.use(express.json());

  // API - History Persistence
  app.get("/api/history", async (req, res) => {
    try {
      const data = await fs.readFile(HISTORY_FILE, "utf-8");
      res.json(JSON.parse(data));
    } catch (error) {
      res.json([]);
    }
  });

  app.post("/api/history", async (req, res) => {
    try {
      let history = [];
      try {
        const data = await fs.readFile(HISTORY_FILE, "utf-8");
        history = JSON.parse(data);
      } catch (e) {}
      
      const newEntry = req.body;
      history.push({ 
        ...newEntry, 
        id: Math.random().toString(36).substring(7),
        timestamp: new Date().toISOString(),
        timeOfDay: new Date().getHours().toString()
      });
      
      await fs.writeFile(HISTORY_FILE, JSON.stringify(history, null, 2));
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Failed to save history" });
    }
  });

  // API Check
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok", timestamp: new Date().toISOString() });
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    // Production: serve static files
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running at http://localhost:${PORT}`);
  });
}

startServer();
