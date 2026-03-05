import express from "express";
import { createServer as createViteServer } from "vite";
import Database from "better-sqlite3";
import path from "path";
import { fileURLToPath } from "url";
import { WebSocketServer, WebSocket } from "ws";
import { createServer } from "http";

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
    avatar TEXT,
    bio TEXT,
    phone TEXT
  );

  CREATE TABLE IF NOT EXISTS posts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    image TEXT,
    author_id INTEGER,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (author_id) REFERENCES users(id)
  );

  CREATE TABLE IF NOT EXISTS comments (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    post_id INTEGER,
    user_id INTEGER,
    content TEXT NOT NULL,
    image TEXT,
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

  CREATE TABLE IF NOT EXISTS notifications (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER,
    type TEXT NOT NULL,
    content TEXT NOT NULL,
    link TEXT,
    is_read INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id)
  );

  CREATE TABLE IF NOT EXISTS password_resets (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    email TEXT NOT NULL,
    token TEXT NOT NULL,
    expires_at DATETIME NOT NULL
  );

  CREATE TABLE IF NOT EXISTS user_settings (
    user_id INTEGER PRIMARY KEY,
    notify_messages INTEGER DEFAULT 1,
    notify_events INTEGER DEFAULT 1,
    notify_blog INTEGER DEFAULT 1,
    FOREIGN KEY (user_id) REFERENCES users(id)
  );
`);

// Migration: Add image columns if they don't exist
try { db.exec("ALTER TABLE posts ADD COLUMN image TEXT"); } catch (e) {}
try { db.exec("ALTER TABLE comments ADD COLUMN image TEXT"); } catch (e) {}
try { db.exec("ALTER TABLE users ADD COLUMN bio TEXT"); } catch (e) {}
try { db.exec("ALTER TABLE users ADD COLUMN phone TEXT"); } catch (e) {}

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

  // Initialize settings for admin
  db.prepare("INSERT INTO user_settings (user_id) VALUES (?)").run(1);
}

const clients = new Map<number, WebSocket>();

function createNotification(db: any, userId: number, type: string, content: string, link: string) {
  const settings = db.prepare("SELECT * FROM user_settings WHERE user_id = ?").get(userId);
  if (!settings) return;

  let shouldNotify = false;
  if (type === 'message' && settings.notify_messages) shouldNotify = true;
  if (type === 'event' && settings.notify_events) shouldNotify = true;
  if (type === 'comment' && settings.notify_blog) shouldNotify = true;

  if (shouldNotify) {
    db.prepare("INSERT INTO notifications (user_id, type, content, link) VALUES (?, ?, ?, ?)").run(userId, type, content, link);
    
    // Real-time WebSocket notification
    const client = clients.get(userId);
    if (client && client.readyState === WebSocket.OPEN) {
      client.send(JSON.stringify({
        type: 'notification',
        data: { type, content, link, created_at: new Date().toISOString() }
      }));
    }
  }
}

async function startServer() {
  const app = express();
  const server = createServer(app);
  const wss = new WebSocketServer({ server });
  const PORT = 3000;

  wss.on('connection', (ws) => {
    let currentUserId: number | null = null;

    ws.on('message', (message) => {
      try {
        const data = JSON.parse(message.toString());
        if (data.type === 'auth' && data.userId) {
          currentUserId = data.userId;
          clients.set(currentUserId!, ws);
        }
      } catch (e) {}
    });

    ws.on('close', () => {
      if (currentUserId) clients.delete(currentUserId);
    });
  });

  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ limit: '10mb', extended: true }));

  // Auth Routes
  app.post("/api/auth/signup", (req, res) => {
    const { name, email, password, role } = req.body;
    try {
      const result = db.prepare("INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, ?)").run(name, email, password, role || 'student');
      const userId = result.lastInsertRowid;
      // Initialize settings
      db.prepare("INSERT INTO user_settings (user_id) VALUES (?)").run(userId);
      const user = db.prepare("SELECT id, name, email, role, avatar, bio, phone FROM users WHERE id = ?").get(userId);
      res.json(user);
    } catch (e) {
      res.status(400).json({ error: "Email already exists" });
    }
  });

  app.post("/api/auth/login", (req, res) => {
    const { email, password } = req.body;
    const user = db.prepare("SELECT id, name, email, role, avatar, bio, phone FROM users WHERE email = ? AND password = ?").get(email, password);
    if (user) {
      res.json(user);
    } else {
      res.status(401).json({ error: "Invalid credentials" });
    }
  });

  app.post("/api/auth/forgot-password", (req, res) => {
    const { email } = req.body;
    const user = db.prepare("SELECT id FROM users WHERE email = ?").get(email);
    if (!user) return res.status(404).json({ error: "User not found" });

    const token = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
    const expiresAt = new Date(Date.now() + 3600000).toISOString(); // 1 hour

    db.prepare("INSERT INTO password_resets (email, token, expires_at) VALUES (?, ?, ?)").run(email, token, expiresAt);

    // In a real app, send email. Here we just return the token for the demo.
    console.log(`Password reset token for ${email}: ${token}`);
    res.json({ message: "Reset link sent to your email", token }); // Token returned for demo purposes
  });

  app.post("/api/auth/reset-password", (req, res) => {
    const { token, password } = req.body;
    const reset = db.prepare("SELECT email FROM password_resets WHERE token = ? AND expires_at > ?").get(token, new Date().toISOString());
    
    if (!reset) return res.status(400).json({ error: "Invalid or expired token" });

    db.prepare("UPDATE users SET password = ? WHERE email = ?").run(password, reset.email);
    db.prepare("DELETE FROM password_resets WHERE email = ?").run(reset.email);

    res.json({ success: true, message: "Password updated successfully" });
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
    const { title, content, image, author_id } = req.body;
    const user = db.prepare("SELECT role FROM users WHERE id = ?").get(author_id);
    if (user?.role !== 'admin' && user?.role !== 'teacher') return res.status(403).json({ error: "Only admins and teachers can post" });
    
    const result = db.prepare("INSERT INTO posts (title, content, image, author_id) VALUES (?, ?, ?, ?)").run(title, content, image, author_id);
    res.json({ id: result.lastInsertRowid });
  });

  app.put("/api/posts/:id", (req, res) => {
    const { title, content, image, author_id } = req.body;
    const user = db.prepare("SELECT role FROM users WHERE id = ?").get(author_id);
    if (user?.role !== 'admin' && user?.role !== 'teacher') return res.status(403).json({ error: "Only admins and teachers can edit posts" });
    
    db.prepare("UPDATE posts SET title = ?, content = ?, image = ? WHERE id = ?").run(title, content, image, req.params.id);
    res.json({ success: true });
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
    const { user_id, content, image } = req.body;
    db.prepare("INSERT INTO comments (post_id, user_id, content, image) VALUES (?, ?, ?, ?)").run(req.params.id, user_id, content, image);
    
    // Notify post author
    const post = db.prepare("SELECT author_id, title FROM posts WHERE id = ?").get(req.params.id);
    const user = db.prepare("SELECT name FROM users WHERE id = ?").get(user_id);
    if (post && post.author_id !== user_id) {
      createNotification(db, post.author_id, 'comment', `${user.name} commented on your post: ${post.title}`, `blog?post_id=${req.params.id}`);
    }
    
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

  app.delete("/api/users/:id", (req, res) => {
    const { admin_id } = req.query;
    const admin = db.prepare("SELECT role FROM users WHERE id = ?").get(admin_id);
    if (admin?.role !== 'admin') return res.status(403).json({ error: "Unauthorized" });

    db.prepare("DELETE FROM users WHERE id = ?").run(req.params.id);
    res.json({ success: true });
  });

  app.patch("/api/users/:id/role", (req, res) => {
    const { admin_id, role } = req.body;
    const admin = db.prepare("SELECT role FROM users WHERE id = ?").get(admin_id);
    if (admin?.role !== 'admin') return res.status(403).json({ error: "Unauthorized" });

    db.prepare("UPDATE users SET role = ? WHERE id = ?").run(role, req.params.id);
    res.json({ success: true });
  });

  app.put("/api/users/:id/profile", (req, res) => {
    const { name, avatar, bio, phone } = req.body;
    db.prepare("UPDATE users SET name = ?, avatar = ?, bio = ?, phone = ? WHERE id = ?").run(name, avatar, bio, phone, req.params.id);
    const user = db.prepare("SELECT id, name, email, role, avatar, bio, phone FROM users WHERE id = ?").get(req.params.id);
    res.json(user);
  });

  app.delete("/api/posts/:id", (req, res) => {
    const { admin_id } = req.query;
    const admin = db.prepare("SELECT role FROM users WHERE id = ?").get(admin_id);
    if (admin?.role !== 'admin' && admin?.role !== 'teacher') return res.status(403).json({ error: "Unauthorized" });

    db.prepare("DELETE FROM posts WHERE id = ?").run(req.params.id);
    db.prepare("DELETE FROM comments WHERE post_id = ?").run(req.params.id);
    db.prepare("DELETE FROM likes WHERE post_id = ?").run(req.params.id);
    res.json({ success: true });
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
    
    // Notify receiver
    const sender = db.prepare("SELECT name FROM users WHERE id = ?").get(sender_id);
    createNotification(db, receiver_id, 'message', `New message from ${sender.name}`, `messages?user_id=${sender_id}`);
    
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
    
    // Notify all users about new event
    const users = db.prepare("SELECT id FROM users WHERE id != ?").all(user_id);
    users.forEach(u => {
      createNotification(db, u.id, 'event', `New school event: ${title}`, `events?event_id=${result.lastInsertRowid}`);
    });

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

  // Notifications Routes
  app.get("/api/notifications/:userId", (req, res) => {
    const notifications = db.prepare("SELECT * FROM notifications WHERE user_id = ? ORDER BY created_at DESC LIMIT 50").all(req.params.userId);
    res.json(notifications);
  });

  app.get("/api/settings/:userId", (req, res) => {
    let settings = db.prepare("SELECT * FROM user_settings WHERE user_id = ?").get(req.params.userId);
    if (!settings) {
      db.prepare("INSERT INTO user_settings (user_id) VALUES (?)").run(req.params.userId);
      settings = db.prepare("SELECT * FROM user_settings WHERE user_id = ?").get(req.params.userId);
    }
    res.json(settings);
  });

  app.put("/api/settings/:userId", (req, res) => {
    const { notify_messages, notify_events, notify_blog } = req.body;
    db.prepare(`
      UPDATE user_settings 
      SET notify_messages = ?, notify_events = ?, notify_blog = ? 
      WHERE user_id = ?
    `).run(notify_messages ? 1 : 0, notify_events ? 1 : 0, notify_blog ? 1 : 0, req.params.userId);
    res.json({ success: true });
  });

  app.post("/api/notifications/:id/read", (req, res) => {
    db.prepare("UPDATE notifications SET is_read = 1 WHERE id = ?").run(req.params.id);
    res.json({ success: true });
  });

  app.post("/api/notifications/read-all/:userId", (req, res) => {
    db.prepare("UPDATE notifications SET is_read = 1 WHERE user_id = ?").run(req.params.userId);
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

  server.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
