import express from "express";
import { createServer as createViteServer } from "vite";
import Database from "better-sqlite3";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const db = new Database("school.db");

// Initialize Database
db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    role TEXT DEFAULT 'user',
    avatar TEXT
  );

  CREATE TABLE IF NOT EXISTS posts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    author_id INTEGER,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (author_id) REFERENCES users(id)
  );

  CREATE TABLE IF NOT EXISTS comments (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    post_id INTEGER,
    user_id INTEGER,
    content TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (post_id) REFERENCES posts(id),
    FOREIGN KEY (user_id) REFERENCES users(id)
  );

  CREATE TABLE IF NOT EXISTS likes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    post_id INTEGER,
    user_id INTEGER,
    UNIQUE(post_id, user_id),
    FOREIGN KEY (post_id) REFERENCES posts(id),
    FOREIGN KEY (user_id) REFERENCES users(id)
  );

  CREATE TABLE IF NOT EXISTS events (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    date TEXT NOT NULL,
    time TEXT,
    location TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS messages (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    sender_id INTEGER,
    receiver_id INTEGER,
    content TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (sender_id) REFERENCES users(id),
    FOREIGN KEY (receiver_id) REFERENCES users(id)
  );
`);

// Seed Admin if not exists
const adminExists = db.prepare("SELECT * FROM users WHERE role = 'admin'").get();
if (!adminExists) {
  db.prepare("INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, ?)").run(
    "School Admin",
    "admin@school.edu",
    "admin123",
    "admin"
  );
  
  // Seed some initial data
  db.prepare("INSERT INTO posts (title, content, author_id) VALUES (?, ?, ?)").run(
    "Welcome to EduConnect",
    "We are excited to launch our new school portal! Stay tuned for updates.",
    1
  );

  db.prepare("INSERT INTO events (title, description, date, location) VALUES (?, ?, ?, ?)").run(
    "Annual Sports Day",
    "Join us for a day of athletic excellence and fun!",
    "2026-03-15",
    "School Main Field"
  );
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // Auth Routes
  app.post("/api/auth/signup", (req, res) => {
    const { name, email, password, role } = req.body;
    try {
      const result = db.prepare("INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, ?)").run(name, email, password, role || 'student');
      const user = db.prepare("SELECT id, name, email, role FROM users WHERE id = ?").get(result.lastInsertRowid);
      res.json(user);
    } catch (e) {
      res.status(400).json({ error: "Email already exists" });
    }
  });

  app.post("/api/auth/login", (req, res) => {
    const { email, password } = req.body;
    const user = db.prepare("SELECT id, name, email, role FROM users WHERE email = ? AND password = ?").get(email, password);
    if (user) {
      res.json(user);
    } else {
      res.status(401).json({ error: "Invalid credentials" });
    }
  });

  // Blog Routes
  app.get("/api/posts", (req, res) => {
    const posts = db.prepare(`
      SELECT p.*, u.name as author_name, 
      (SELECT COUNT(*) FROM likes WHERE post_id = p.id) as likes_count,
      (SELECT COUNT(*) FROM comments WHERE post_id = p.id) as comments_count
      FROM posts p 
      JOIN users u ON p.author_id = u.id 
      ORDER BY created_at DESC
    `).all();
    res.json(posts);
  });

  app.post("/api/posts", (req, res) => {
    const { title, content, author_id } = req.body;
    const user = db.prepare("SELECT role FROM users WHERE id = ?").get(author_id);
    if (user?.role !== 'admin' && user?.role !== 'teacher') return res.status(403).json({ error: "Only admins and teachers can post" });
    
    const result = db.prepare("INSERT INTO posts (title, content, author_id) VALUES (?, ?, ?)").run(title, content, author_id);
    res.json({ id: result.lastInsertRowid });
  });

  app.get("/api/posts/:id/comments", (req, res) => {
    const comments = db.prepare(`
      SELECT c.*, u.name as user_name 
      FROM comments c 
      JOIN users u ON c.user_id = u.id 
      WHERE c.post_id = ? 
      ORDER BY created_at ASC
    `).all(req.params.id);
    res.json(comments);
  });

  app.post("/api/posts/:id/comments", (req, res) => {
    const { user_id, content } = req.body;
    db.prepare("INSERT INTO comments (post_id, user_id, content) VALUES (?, ?, ?)").run(req.params.id, user_id, content);
    res.json({ success: true });
  });

  app.post("/api/posts/:id/like", (req, res) => {
    const { user_id } = req.body;
    try {
      db.prepare("INSERT INTO likes (post_id, user_id) VALUES (?, ?)").run(req.params.id, user_id);
      res.json({ liked: true });
    } catch (e) {
      db.prepare("DELETE FROM likes WHERE post_id = ? AND user_id = ?").run(req.params.id, user_id);
      res.json({ liked: false });
    }
  });

  // Users Routes
  app.get("/api/users", (req, res) => {
    const users = db.prepare("SELECT id, name, email, role FROM users").all();
    res.json(users);
  });

  // Messaging Routes
  app.get("/api/messages/conversations/:userId", (req, res) => {
    const userId = req.params.userId;
    const conversations = db.prepare(`
      SELECT 
        u.id as other_user_id,
        u.name as other_user_name,
        u.role as other_user_role,
        m.content as last_message,
        m.created_at as last_message_at
      FROM users u
      JOIN messages m ON (m.sender_id = u.id AND m.receiver_id = ?) OR (m.sender_id = ? AND m.receiver_id = u.id)
      WHERE u.id != ?
      GROUP BY u.id
      ORDER BY m.created_at DESC
    `).all(userId, userId, userId);
    res.json(conversations);
  });

  app.get("/api/messages/:userId/:otherId", (req, res) => {
    const { userId, otherId } = req.params;
    const messages = db.prepare(`
      SELECT * FROM messages 
      WHERE (sender_id = ? AND receiver_id = ?) OR (sender_id = ? AND receiver_id = ?)
      ORDER BY created_at ASC
    `).all(userId, otherId, otherId, userId);
    res.json(messages);
  });

  app.post("/api/messages", (req, res) => {
    const { sender_id, receiver_id, content } = req.body;
    const result = db.prepare("INSERT INTO messages (sender_id, receiver_id, content) VALUES (?, ?, ?)").run(sender_id, receiver_id, content);
    res.json({ id: result.lastInsertRowid });
  });

  // Events Routes
  app.get("/api/events", (req, res) => {
    const events = db.prepare("SELECT * FROM events ORDER BY date ASC, time ASC").all();
    res.json(events);
  });

  app.post("/api/events", (req, res) => {
    const { title, description, date, time, location, user_id } = req.body;
    const user = db.prepare("SELECT role FROM users WHERE id = ?").get(user_id);
    if (user?.role !== 'admin' && user?.role !== 'teacher') return res.status(403).json({ error: "Only admins and teachers can create events" });

    const result = db.prepare("INSERT INTO events (title, description, date, time, location) VALUES (?, ?, ?, ?, ?)").run(title, description, date, time, location);
    res.json({ id: result.lastInsertRowid });
  });

  app.put("/api/events/:id", (req, res) => {
    const { title, description, date, time, location, user_id } = req.body;
    const user = db.prepare("SELECT role FROM users WHERE id = ?").get(user_id);
    if (user?.role !== 'admin' && user?.role !== 'teacher') return res.status(403).json({ error: "Only admins and teachers can edit events" });

    db.prepare("UPDATE events SET title = ?, description = ?, date = ?, time = ?, location = ? WHERE id = ?").run(title, description, date, time, location, req.params.id);
    res.json({ success: true });
  });

  app.delete("/api/events/:id", (req, res) => {
    const { user_id } = req.query;
    const user = db.prepare("SELECT role FROM users WHERE id = ?").get(user_id);
    if (user?.role !== 'admin' && user?.role !== 'teacher') return res.status(403).json({ error: "Only admins and teachers can delete events" });

    db.prepare("DELETE FROM events WHERE id = ?").run(req.params.id);
    res.json({ success: true });
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.join(__dirname, "dist")));
    app.get("*", (req, res) => {
      res.sendFile(path.join(__dirname, "dist", "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
