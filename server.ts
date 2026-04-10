import express from "express";
import cors from "cors";
import "dotenv/config";
import { createServer as createViteServer } from "vite";
import path from "path";
import { fileURLToPath } from "url";
import { WebSocketServer, WebSocket } from "ws";
import { createServer } from "http";
import { createClient } from "@supabase/supabase-js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Supabase Configuration
const supabaseUrl = (process.env.SUPABASE_URL || "").trim();
const supabaseKey = (process.env.SUPABASE_KEY || "").trim();

if (!supabaseUrl || !supabaseKey) {
  console.error("CRITICAL: SUPABASE_URL or SUPABASE_KEY is missing in environment variables.");
}

console.log("Initializing Supabase with URL:", supabaseUrl);
const supabase = createClient(supabaseUrl, supabaseKey);

const clients = new Map<number, WebSocket>();

async function createNotification(userId: number, type: string, content: string, link: string) {
  const { data: settings } = await supabase
    .from("user_settings")
    .select("*")
    .eq("user_id", userId)
    .single();

  if (!settings) return;

  let shouldNotify = false;
  if (type === 'message' && settings.notify_messages) shouldNotify = true;
  if (type === 'event' && settings.notify_events) shouldNotify = true;
  if (type === 'comment' && settings.notify_blog) shouldNotify = true;
  if (type === 'announcement') shouldNotify = true;

  if (shouldNotify) {
    await supabase
      .from("notifications")
      .insert([{ user_id: userId, type, content, link }]);
    
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

async function seedDatabase() {
  try {
    const adminEmail = "admin@school.edu";
    const { data: existingAdmin } = await supabase
      .from("users")
      .select("*")
      .eq("email", adminEmail)
      .maybeSingle();

    if (!existingAdmin) {
      console.log("Seeding default admin user...");
      const { data: newUser, error: userError } = await supabase
        .from("users")
        .insert([{ 
          name: "School Administrator", 
          email: adminEmail, 
          password: "admin", 
          role: "admin",
          avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=admin"
        }])
        .select()
        .single();

      if (userError) {
        console.error("Error seeding admin user:", userError);
        return;
      }

      if (newUser) {
        await supabase.from("user_settings").insert([{ user_id: newUser.id }]);
        console.log("Admin user seeded successfully with password: 'admin'");
      }
    }
  } catch (e) {
    console.error("Database seeding failed:", e);
  }
}

async function startServer() {
  await seedDatabase();
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

  app.use(cors());
  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ limit: '10mb', extended: true }));

  // Health Check
  app.get("/api/health", async (req, res) => {
    try {
      const { data, error } = await supabase.from("users").select("count").single();
      res.json({ 
        status: "ok", 
        database: error ? "error" : "connected",
        db_error: error ? error.message : null
      });
    } catch (e: any) {
      res.json({ status: "error", message: e.message });
    }
  });

  // Auth Routes
  app.post("/api/auth/signup", async (req, res) => {
    const { name, email, password, role } = req.body;
    try {
      const { data: newUser, error } = await supabase
        .from("users")
        .insert([{ name, email, password, role: role || 'student' }])
        .select()
        .single();

      if (error) throw error;

      // Initialize settings
      await supabase.from("user_settings").insert([{ user_id: newUser.id }]);
      
      res.json(newUser);
    } catch (e: any) {
      res.status(400).json({ error: e.message || "Email already exists" });
    }
  });

  app.post("/api/auth/login", async (req, res) => {
    try {
      const { email, password } = req.body;
      console.log(`Login attempt for: ${email}`);
      
      const { data: user, error } = await supabase
        .from("users")
        .select("id, name, email, role, avatar, bio, phone")
        .eq("email", email)
        .eq("password", password)
        .maybeSingle();

      if (error) {
        console.error("Login database error:", JSON.stringify(error, null, 2));
        return res.status(500).json({ 
          error: "Database error occurred",
          details: error.message 
        });
      }

      if (user) {
        console.log(`Login successful for: ${email}`);
        res.json(user);
      } else {
        console.log(`Login failed (invalid credentials) for: ${email}`);
        res.status(401).json({ error: "Invalid email or password" });
      }
    } catch (e: any) {
      console.error("Server error during login:", e);
      res.status(500).json({ error: "Internal server error", message: e.message });
    }
  });

  app.post("/api/auth/forgot-password", async (req, res) => {
    const { email } = req.body;
    const { data: user } = await supabase
      .from("users")
      .select("id")
      .eq("email", email)
      .single();

    if (!user) return res.status(404).json({ error: "User not found" });

    const token = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
    const expiresAt = new Date(Date.now() + 3600000).toISOString(); // 1 hour

    await supabase
      .from("password_resets")
      .insert([{ email, token, expires_at: expiresAt }]);

    console.log(`Password reset token for ${email}: ${token}`);
    res.json({ message: "Reset link sent to your email", token });
  });

  app.post("/api/auth/reset-password", async (req, res) => {
    const { token, password } = req.body;
    const { data: reset } = await supabase
      .from("password_resets")
      .select("email")
      .eq("token", token)
      .gt("expires_at", new Date().toISOString())
      .single();
    
    if (!reset) return res.status(400).json({ error: "Invalid or expired token" });

    await supabase.from("users").update({ password }).eq("email", reset.email);
    await supabase.from("password_resets").delete().eq("email", reset.email);

    res.json({ success: true, message: "Password updated successfully" });
  });

  // Blog Routes
  app.get("/api/posts", async (req, res) => {
    const { data: posts, error } = await supabase
      .from("posts")
      .select(`
        *,
        author:users!author_id(name),
        likes_count:likes(count),
        comments_count:comments(count)
      `)
      .order("created_at", { ascending: false });

    if (error) return res.status(500).json({ error: error.message });

    // Format for frontend
    const formattedPosts = posts.map(p => ({
      ...p,
      author_name: p.author?.name,
      likes_count: p.likes_count?.[0]?.count || 0,
      comments_count: p.comments_count?.[0]?.count || 0
    }));

    res.json(formattedPosts);
  });

  app.post("/api/posts", async (req, res) => {
    const { title, content, image, author_id } = req.body;
    const { data: user } = await supabase.from("users").select("role").eq("id", author_id).single();
    if (user?.role !== 'admin' && user?.role !== 'teacher') return res.status(403).json({ error: "Only admins and teachers can post" });
    
    const { data: post, error } = await supabase
      .from("posts")
      .insert([{ title, content, image, author_id }])
      .select()
      .single();

    if (error) return res.status(500).json({ error: error.message });
    res.json({ id: post.id });
  });

  app.put("/api/posts/:id", async (req, res) => {
    const { title, content, image, author_id } = req.body;
    const { data: user } = await supabase.from("users").select("role").eq("id", author_id).single();
    if (user?.role !== 'admin' && user?.role !== 'teacher') return res.status(403).json({ error: "Only admins and teachers can edit posts" });
    
    await supabase.from("posts").update({ title, content, image }).eq("id", req.params.id);
    res.json({ success: true });
  });

  app.get("/api/posts/:id/comments", async (req, res) => {
    const { data: comments } = await supabase
      .from("comments")
      .select("*, user:users!user_id(name)")
      .eq("post_id", req.params.id)
      .order("created_at", { ascending: true });

    const formattedComments = comments?.map(c => ({
      ...c,
      user_name: c.user?.name
    }));

    res.json(formattedComments || []);
  });

  app.post("/api/posts/:id/comments", async (req, res) => {
    const { user_id, content, image } = req.body;
    await supabase.from("comments").insert([{ post_id: req.params.id, user_id, content, image }]);
    
    // Notify post author
    const { data: post } = await supabase.from("posts").select("author_id, title").eq("id", req.params.id).single();
    const { data: user } = await supabase.from("users").select("name").eq("id", user_id).single();
    if (post && post.author_id !== user_id) {
      await createNotification(post.author_id, 'comment', `${user.name} commented on your post: ${post.title}`, `blog?post_id=${req.params.id}`);
    }
    
    res.json({ success: true });
  });

  app.post("/api/posts/:id/like", async (req, res) => {
    const { user_id } = req.body;
    const { data: existingLike } = await supabase
      .from("likes")
      .select("*")
      .eq("post_id", req.params.id)
      .eq("user_id", user_id)
      .single();

    if (existingLike) {
      await supabase.from("likes").delete().eq("post_id", req.params.id).eq("user_id", user_id);
      res.json({ liked: false });
    } else {
      await supabase.from("likes").insert([{ post_id: req.params.id, user_id }]);
      res.json({ liked: true });
    }
  });

  // Users Routes
  app.get("/api/users", async (req, res) => {
    const { data: users } = await supabase.from("users").select("id, name, email, role");
    res.json(users || []);
  });

  app.delete("/api/users/:id", async (req, res) => {
    const { admin_id } = req.query;
    const { data: admin } = await supabase.from("users").select("role").eq("id", admin_id).single();
    if (admin?.role !== 'admin') return res.status(403).json({ error: "Unauthorized" });

    await supabase.from("users").delete().eq("id", req.params.id);
    res.json({ success: true });
  });

  app.patch("/api/users/:id/role", async (req, res) => {
    const { admin_id, role } = req.body;
    const { data: admin } = await supabase.from("users").select("role").eq("id", admin_id).single();
    if (admin?.role !== 'admin') return res.status(403).json({ error: "Unauthorized" });

    await supabase.from("users").update({ role }).eq("id", req.params.id);
    res.json({ success: true });
  });

  app.put("/api/users/:id/profile", async (req, res) => {
    const { name, avatar, bio, phone } = req.body;
    await supabase.from("users").update({ name, avatar, bio, phone }).eq("id", req.params.id);
    const { data: user } = await supabase.from("users").select("id, name, email, role, avatar, bio, phone").eq("id", req.params.id).single();
    res.json(user);
  });

  app.delete("/api/posts/:id", async (req, res) => {
    const { admin_id } = req.query;
    const { data: admin } = await supabase.from("users").select("role").eq("id", admin_id).single();
    if (admin?.role !== 'admin' && admin?.role !== 'teacher') return res.status(403).json({ error: "Unauthorized" });

    await supabase.from("posts").delete().eq("id", req.params.id);
    res.json({ success: true });
  });

  // Messaging Routes
  app.get("/api/messages/conversations/:userId", async (req, res) => {
    const userId = req.params.userId;
    // This is a bit complex in Supabase without a custom RPC, but we can approximate it
    const { data: messages } = await supabase
      .from("messages")
      .select("*, sender:users!sender_id(id, name, role), receiver:users!receiver_id(id, name, role)")
      .or(`sender_id.eq.${userId},receiver_id.eq.${userId}`)
      .order("created_at", { ascending: false });

    const conversationsMap = new Map();
    messages?.forEach(m => {
      const otherUser = m.sender_id == userId ? m.receiver : m.sender;
      if (!conversationsMap.has(otherUser.id)) {
        conversationsMap.set(otherUser.id, {
          other_user_id: otherUser.id,
          other_user_name: otherUser.name,
          other_user_role: otherUser.role,
          last_message: m.content,
          last_message_at: m.created_at
        });
      }
    });

    res.json(Array.from(conversationsMap.values()));
  });

  app.get("/api/messages/:userId/:otherId", async (req, res) => {
    const { userId, otherId } = req.params;
    const { data: messages } = await supabase
      .from("messages")
      .select("*")
      .or(`and(sender_id.eq.${userId},receiver_id.eq.${otherId}),and(sender_id.eq.${otherId},receiver_id.eq.${userId})`)
      .order("created_at", { ascending: true });

    res.json(messages || []);
  });

  app.post("/api/messages", async (req, res) => {
    const { sender_id, receiver_id, content } = req.body;
    const { data: message } = await supabase
      .from("messages")
      .insert([{ sender_id, receiver_id, content }])
      .select()
      .single();
    
    // Notify receiver
    const { data: sender } = await supabase.from("users").select("name").eq("id", sender_id).single();
    await createNotification(receiver_id, 'message', `New message from ${sender.name}`, `messages?user_id=${sender_id}`);
    
    res.json({ id: message.id });
  });

  app.delete("/api/messages/:id", async (req, res) => {
    const { user_id } = req.query;
    const { data: user } = await supabase.from("users").select("role").eq("id", user_id).single();
    if (user?.role !== 'admin') return res.status(403).json({ error: "Unauthorized" });

    await supabase.from("messages").delete().eq("id", req.params.id);
    res.json({ success: true });
  });

  // Events Routes
  app.get("/api/events", async (req, res) => {
    const { data: events } = await supabase.from("events").select("*").order("date", { ascending: true });
    res.json(events || []);
  });

  app.post("/api/events", async (req, res) => {
    const { title, description, date, time, location, user_id } = req.body;
    const { data: user } = await supabase.from("users").select("role").eq("id", user_id).single();
    if (user?.role !== 'admin' && user?.role !== 'teacher') return res.status(403).json({ error: "Only admins and teachers can create events" });

    const { data: event } = await supabase.from("events").insert([{ title, description, date, time, location }]).select().single();
    
    // Notify all users about new event
    const { data: users } = await supabase.from("users").select("id").neq("id", user_id);
    users?.forEach(u => {
      createNotification(u.id, 'event', `New school event: ${title}`, `events?event_id=${event.id}`);
    });

    res.json({ id: event.id });
  });

  app.put("/api/events/:id", async (req, res) => {
    const { title, description, date, time, location, user_id } = req.body;
    const { data: user } = await supabase.from("users").select("role").eq("id", user_id).single();
    if (user?.role !== 'admin' && user?.role !== 'teacher') return res.status(403).json({ error: "Only admins and teachers can edit events" });

    await supabase.from("events").update({ title, description, date, time, location }).eq("id", req.params.id);
    res.json({ success: true });
  });

  app.delete("/api/events/:id", async (req, res) => {
    const { user_id } = req.query;
    const { data: user } = await supabase.from("users").select("role").eq("id", user_id).single();
    if (user?.role !== 'admin' && user?.role !== 'teacher') return res.status(403).json({ error: "Only admins and teachers can delete events" });

    await supabase.from("events").delete().eq("id", req.params.id);
    res.json({ success: true });
  });

  // Announcements Routes
  app.get("/api/announcements", async (req, res) => {
    const { data: announcements } = await supabase.from("announcements").select("*").order("created_at", { ascending: false });
    res.json(announcements || []);
  });

  app.post("/api/announcements", async (req, res) => {
    const { title, content, tag, icon, user_id } = req.body;
    const { data: user } = await supabase.from("users").select("role").eq("id", user_id).single();
    if (user?.role !== 'admin') return res.status(403).json({ error: "Only admins can create announcements" });

    const { data: announcement } = await supabase.from("announcements").insert([{ title, content, tag, icon }]).select().single();
    
    // Notify all users
    const { data: users } = await supabase.from("users").select("id").neq("id", user_id);
    users?.forEach(u => {
      createNotification(u.id, 'announcement', `New announcement: ${title}`, 'home');
    });

    res.json({ id: announcement.id });
  });

  app.put("/api/announcements/:id", async (req, res) => {
    const { title, content, tag, icon, user_id } = req.body;
    const { data: user } = await supabase.from("users").select("role").eq("id", user_id).single();
    if (user?.role !== 'admin') return res.status(403).json({ error: "Only admins can edit announcements" });

    await supabase.from("announcements").update({ title, content, tag, icon }).eq("id", req.params.id);
    res.json({ success: true });
  });

  app.delete("/api/announcements/:id", async (req, res) => {
    const admin_id = req.query.admin_id;
    const { data: user } = await supabase.from("users").select("role").eq("id", admin_id).single();
    if (user?.role !== 'admin') return res.status(403).json({ error: "Only admins can delete announcements" });

    await supabase.from("announcements").delete().eq("id", req.params.id);
    res.json({ success: true });
  });

  // Notifications Routes
  app.get("/api/notifications/:userId", async (req, res) => {
    const { data: notifications } = await supabase
      .from("notifications")
      .select("*")
      .eq("user_id", req.params.userId)
      .order("created_at", { ascending: false })
      .limit(50);
    res.json(notifications || []);
  });

  app.get("/api/settings/:userId", async (req, res) => {
    let { data: settings } = await supabase.from("user_settings").select("*").eq("user_id", req.params.userId).single();
    if (!settings) {
      const { data: newSettings } = await supabase.from("user_settings").insert([{ user_id: req.params.userId }]).select().single();
      settings = newSettings;
    }
    res.json(settings);
  });

  app.put("/api/settings/:userId", async (req, res) => {
    const { notify_messages, notify_events, notify_blog } = req.body;
    await supabase.from("user_settings").update({ 
      notify_messages: notify_messages ? 1 : 0, 
      notify_events: notify_events ? 1 : 0, 
      notify_blog: notify_blog ? 1 : 0 
    }).eq("user_id", req.params.userId);
    res.json({ success: true });
  });

  app.post("/api/notifications/:id/read", async (req, res) => {
    await supabase.from("notifications").update({ is_read: 1 }).eq("id", req.params.id);
    res.json({ success: true });
  });

  app.post("/api/notifications/read-all/:userId", async (req, res) => {
    await supabase.from("notifications").update({ is_read: 1 }).eq("user_id", req.params.userId);
    res.json({ success: true });
  });

  // Forum Routes
  app.get("/api/forum/categories", async (req, res) => {
    try {
      const { data: categories, error } = await supabase.from("forum_categories").select("*");
      if (error) throw error;
      
      const formattedCategories = await Promise.all((categories || []).map(async (c) => {
        const { count: topicsCount } = await supabase.from("forum_topics").select("*", { count: 'exact', head: true }).eq("category_id", c.id);
        
        const { data: topics } = await supabase.from("forum_topics").select("id").eq("category_id", c.id);
        const topicIds = (topics || []).map(t => t.id);
        const { count: postsCount } = await supabase.from("forum_posts").select("*", { count: 'exact', head: true }).in("topic_id", topicIds);

        return {
          ...c,
          topics_count: topicsCount || 0,
          posts_count: postsCount || 0
        };
      }));

      res.json(formattedCategories);
    } catch (e: any) {
      console.error("Error fetching categories:", e);
      res.status(500).json({ error: e.message || "Failed to fetch categories" });
    }
  });

  app.get("/api/forum/categories/:id/topics", async (req, res) => {
    try {
      const { data: topics, error } = await supabase
        .from("forum_topics")
        .select("*, author:users!user_id(name, role)")
        .eq("category_id", req.params.id)
        .order("created_at", { ascending: false });

      if (error) throw error;

      const formattedTopics = await Promise.all((topics || []).map(async (t) => {
        const { count: repliesCount } = await supabase.from("forum_posts").select("*", { count: 'exact', head: true }).eq("topic_id", t.id);
        return {
          ...t,
          author_name: t.author?.name,
          author_role: t.author?.role,
          replies_count: repliesCount || 0
        };
      }));

      res.json(formattedTopics);
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  app.post("/api/forum/topics", async (req, res) => {
    const { category_id, user_id, title, content } = req.body;
    const { data: topic } = await supabase.from("forum_topics").insert([{ category_id, user_id, title, content }]).select().single();
    res.json({ id: topic.id });
  });

  app.get("/api/forum/topics/:id", async (req, res) => {
    const { data: topic } = await supabase
      .from("forum_topics")
      .select("*, author:users!user_id(name, role, avatar)")
      .eq("id", req.params.id)
      .single();

    if (topic) {
      topic.author_name = topic.author?.name;
      topic.author_role = topic.author?.role;
      topic.author_avatar = topic.author?.avatar;
    }

    res.json(topic);
  });

  app.get("/api/forum/topics/:id/posts", async (req, res) => {
    const { data: posts } = await supabase
      .from("forum_posts")
      .select("*, author:users!user_id(name, role, avatar)")
      .eq("topic_id", req.params.id)
      .order("created_at", { ascending: true });

    const formattedPosts = posts?.map(p => ({
      ...p,
      author_name: p.author?.name,
      author_role: p.author?.role,
      author_avatar: p.author?.avatar
    }));

    res.json(formattedPosts || []);
  });

  app.post("/api/forum/posts", async (req, res) => {
    const { topic_id, user_id, content } = req.body;
    const { data: post } = await supabase.from("forum_posts").insert([{ topic_id, user_id, content }]).select().single();
    
    // Notify topic author if it's not them
    const { data: topic } = await supabase.from("forum_topics").select("user_id, title").eq("id", topic_id).single();
    const { data: replier } = await supabase.from("users").select("name").eq("id", user_id).single();
    if (topic && topic.user_id !== user_id) {
      await createNotification(topic.user_id, 'comment', `${replier.name} replied to your topic: ${topic.title}`, `forum?topic_id=${topic_id}`);
    }

    res.json({ id: post.id });
  });

  app.delete("/api/forum/topics/:id", async (req, res) => {
    const { user_id } = req.query;
    const { data: user } = await supabase.from("users").select("role").eq("id", user_id).single();
    if (user?.role !== 'admin') return res.status(403).json({ error: "Unauthorized" });

    // Delete all posts in topic first
    await supabase.from("forum_posts").delete().eq("topic_id", req.params.id);
    await supabase.from("forum_topics").delete().eq("id", req.params.id);
    res.json({ success: true });
  });

  app.delete("/api/forum/posts/:id", async (req, res) => {
    const { user_id } = req.query;
    const { data: user } = await supabase.from("users").select("role").eq("id", user_id).single();
    if (user?.role !== 'admin') return res.status(403).json({ error: "Unauthorized" });

    await supabase.from("forum_posts").delete().eq("id", req.params.id);
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

  // Test Supabase Connection
  try {
    const { error } = await supabase.from("users").select("id").limit(1);
    if (error) {
      console.error("Supabase connection test failed. Did you run the SQL script? Error:", error.message);
    } else {
      console.log("Supabase connection successful.");
    }
  } catch (e) {
    console.error("Supabase connection test threw an error:", e);
  }

  server.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
