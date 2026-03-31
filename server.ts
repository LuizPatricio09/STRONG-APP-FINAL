import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import { fileURLToPath } from "url";
import Database from "better-sqlite3";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const db = new Database("workout.db");

// Initialize Database Schema
db.exec(`
  CREATE TABLE IF NOT EXISTS exercicios_catalogo (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    nome TEXT NOT NULL UNIQUE,
    musculo_principal TEXT NOT NULL,
    musculos_secundarios TEXT, -- JSON array
    equipamento TEXT,
    tipo TEXT CHECK (tipo IN ('Composto', 'Isolado'))
  );

  CREATE TABLE IF NOT EXISTS workouts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    date TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS exercises (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    workout_id INTEGER NOT NULL,
    name TEXT NOT NULL,
    muscle_group TEXT NOT NULL,
    FOREIGN KEY (workout_id) REFERENCES workouts (id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS series (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    exercise_id INTEGER NOT NULL,
    reps INTEGER NOT NULL,
    weight REAL NOT NULL,
    tipo_serie TEXT NOT NULL DEFAULT 'valida' CHECK (tipo_serie IN ('valida', 'ajuste', 'aquecimento')),
    FOREIGN KEY (exercise_id) REFERENCES exercises (id) ON DELETE CASCADE
  );
`);

// Populate exercicios_catalogo if empty
const count = db.prepare("SELECT COUNT(*) as count FROM exercicios_catalogo").get() as any;
if (count.count === 0) {
  const insert = db.prepare("INSERT INTO exercicios_catalogo (nome, musculo_principal, musculos_secundarios, equipamento, tipo) VALUES (?, ?, ?, ?, ?)");
  
  const catalog = [
    // Bíceps
    ["Rosca Direta", "Bíceps", "[]", "Barra", "Isolado"],
    ["Rosca Scott", "Bíceps", "[]", "Máquina", "Isolado"],
    ["Rosca Scott com Halter", "Bíceps", "[\"Antebraço\"]", "Halter", "Isolado"],
    ["Bayesian Curl", "Bíceps", "[\"Antebraço\"]", "Cabo", "Isolado"],
    ["Rosca Martelo Sentado", "Bíceps", "[\"Antebraço\"]", "Halter", "Isolado"],
    ["Rosca Spider", "Bíceps", "[]", "Halter", "Isolado"],
    ["Rosca Scott com Barra", "Bíceps", "[\"Antebraço\"]", "Barra", "Isolado"],
    ["Rosca Inclinada Simultânea", "Bíceps", "[]", "Halter", "Isolado"],
    ["Rosca na Polia", "Bíceps", "[]", "Cabo", "Isolado"],
    ["Rosca Concentrada", "Bíceps", "[]", "Halter", "Isolado"],
    ["Rosca Inclinada", "Bíceps", "[]", "Halter", "Isolado"],
    // Tríceps
    ["Tríceps Testa", "Tríceps", "[]", "Barra", "Isolado"],
    ["Tríceps Pulley", "Tríceps", "[]", "Cabo", "Isolado"],
    ["Tríceps Francês na Polia", "Tríceps", "[]", "Cabo", "Isolado"],
    ["Mergulho", "Tríceps", "[]", "Peso Corporal", "Composto"],
    // Peito
    ["Supino Reto Barra", "Peito", "[\"Tríceps\", \"Ombro\"]", "Barra", "Composto"],
    ["Supino Reto Halter", "Peito", "[\"Tríceps\", \"Ombro\"]", "Halter", "Composto"],
    ["Supino Inclinado", "Peito", "[\"Tríceps\", \"Ombro\"]", "Barra", "Composto"],
    ["Supino Máquina", "Peito", "[\"Tríceps\"]", "Máquina", "Composto"],
    ["Supino Inclinado com Halter", "Peito", "[\"Tríceps\", \"Ombro\"]", "Halter", "Composto"],
    ["Supino no Smith", "Peito", "[\"Tríceps\"]", "Barra", "Composto"],
    ["Paralela para Peito", "Peito", "[\"Tríceps\"]", "Peso Corporal", "Composto"],
    ["Crucifixo", "Peito", "[]", "Halter", "Isolado"],
    ["Crucifixo na Máquina", "Peito", "[]", "Máquina", "Isolado"],
    ["Crossover", "Peito", "[]", "Cabo", "Isolado"],
    ["Crossover Polia Baixa no Banco", "Peito", "[]", "Cabo", "Isolado"],
    // Costas
    ["Puxada Frontal", "Costas", "[\"Bíceps\"]", "Cabo", "Composto"],
    ["Puxada Frontal Pegada Neutra", "Costas", "[\"Bíceps\"]", "Cabo", "Composto"],
    ["Remada Unilateral no Cabo", "Costas", "[\"Bíceps\", \"Ombro\"]", "Cabo", "Composto"],
    ["T-Bar Row", "Costas", "[\"Bíceps\", \"Ombro\"]", "Barra", "Composto"],
    ["Remada Baixa Unilateral Polia Neutra", "Costas", "[\"Bíceps\"]", "Cabo", "Composto"],
    ["Remada Alta Pegada Supinada", "Costas", "[\"Bíceps\"]", "Cabo", "Composto"],
    ["Pullup Barra Fixa", "Costas", "[\"Bíceps\"]", "Peso Corporal", "Composto"],
    ["Puxada Aberta", "Costas", "[\"Bíceps\"]", "Cabo", "Composto"],
    ["Remada Curvada com Barra", "Costas", "[\"Bíceps\", \"Ombro\"]", "Barra", "Composto"],
    ["Remada Unilateral com Halter", "Costas", "[\"Bíceps\"]", "Halter", "Composto"],
    ["Pullover na Polia", "Costas", "[\"Peito\"]", "Cabo", "Isolado"],
    ["Remada Curvada", "Costas", "[\"Bíceps\"]", "Barra", "Composto"],
    ["Remada Unilateral", "Costas", "[\"Bíceps\"]", "Halter", "Composto"],
    ["Pullover", "Costas", "[]", "Halter", "Composto"],
    // Ombros
    ["Desenvolvimento com Barra", "Ombros", "[\"Tríceps\"]", "Barra", "Composto"],
    ["Elevação Lateral", "Ombros", "[]", "Halter", "Isolado"],
    ["Elevação Lateral na Máquina", "Ombros", "[]", "Máquina", "Isolado"],
    ["Elevação Lateral na Polia", "Ombros", "[]", "Cabo", "Isolado"],
    ["Elevação Lateral com Halter", "Ombros", "[]", "Halter", "Isolado"],
    ["Elevação Frontal", "Ombros", "[]", "Halter", "Isolado"],
    ["Crucifixo Inverso na Polia Alta", "Ombros", "[\"Costas\"]", "Cabo", "Isolado"]
  ];

  for (const item of catalog) {
    insert.run(...item);
  }
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // API Routes
  app.get("/api/catalog", (req, res) => {
    const catalog = db.prepare("SELECT * FROM exercicios_catalogo").all();
    res.json(catalog.map((item: any) => ({
      ...item,
      musculos_secundarios: JSON.parse(item.musculos_secundarios || "[]")
    })));
  });

  app.get("/api/workouts", (req, res) => {
    const workouts = db.prepare("SELECT * FROM workouts ORDER BY date DESC").all();
    const workoutsWithExercises = workouts.map((workout: any) => {
      const exercises = db.prepare("SELECT * FROM exercises WHERE workout_id = ?").all(workout.id);
      const exercisesWithSeries = exercises.map((ex: any) => {
        const series = db.prepare("SELECT * FROM series WHERE exercise_id = ?").all(ex.id);
        return { ...ex, series };
      });
      return { ...workout, exercises: exercisesWithSeries };
    });
    res.json(workoutsWithExercises);
  });

  app.post("/api/workouts", (req, res) => {
    const { name, date, exercises } = req.body;
    
    const insertWorkout = db.prepare("INSERT INTO workouts (name, date) VALUES (?, ?)");
    const insertExercise = db.prepare("INSERT INTO exercises (workout_id, name, muscle_group) VALUES (?, ?, ?)");
    const insertSerie = db.prepare("INSERT INTO series (exercise_id, reps, weight, tipo_serie) VALUES (?, ?, ?, ?)");

    const transaction = db.transaction((workoutData: any) => {
      const info = insertWorkout.run(workoutData.name, workoutData.date);
      const workoutId = info.lastInsertRowid;
      
      for (const ex of workoutData.exercises) {
        const exInfo = insertExercise.run(workoutId, ex.name, ex.muscle_group);
        const exerciseId = exInfo.lastInsertRowid;
        
        for (const s of ex.series) {
          insertSerie.run(exerciseId, s.reps, s.weight, s.tipo_serie || 'valida');
        }
      }
      return workoutId;
    });

    try {
      const id = transaction({ name, date, exercises });
      res.status(201).json({ id, name, date, exercises });
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: "Failed to save workout" });
    }
  });

  app.delete("/api/workouts/:id", (req, res) => {
    const { id } = req.params;
    try {
      db.prepare("DELETE FROM workouts WHERE id = ?").run(id);
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ error: "Failed to delete workout" });
    }
  });

  app.get("/api/analytics/progression/:exerciseName", (req, res) => {
    const { exerciseName } = req.params;
    const data = db.prepare(`
      SELECT w.date, s.weight, s.reps, s.tipo_serie
      FROM series s
      JOIN exercises e ON s.exercise_id = e.id
      JOIN workouts w ON e.workout_id = w.id
      WHERE e.name = ? AND s.tipo_serie = 'valida'
      ORDER BY w.date ASC
    `).all(exerciseName);
    res.json(data);
  });

  app.get("/api/analytics/muscle-volume", (req, res) => {
    const data = db.prepare(`
      SELECT e.muscle_group, COUNT(s.id) as total_sets
      FROM series s
      JOIN exercises e ON s.exercise_id = e.id
      WHERE s.tipo_serie = 'valida'
      GROUP BY e.muscle_group
    `).all();
    res.json(data);
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
