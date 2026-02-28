import express from "express";
import { createServer } from "http";
import { Server } from "socket.io";
import { createServer as createViteServer } from "vite";
import Database from "better-sqlite3";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const db = new Database("truckflow.db");

// Initialize Database
db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    email TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    role TEXT NOT NULL, -- 'shipper', 'driver', 'admin'
    name TEXT NOT NULL,
    company TEXT,
    phone TEXT,
    is_approved INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS loads (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    shipper_id INTEGER NOT NULL,
    pickup_location TEXT NOT NULL,
    delivery_location TEXT NOT NULL,
    weight TEXT,
    truck_type TEXT,
    rate REAL,
    contact_details TEXT,
    status TEXT DEFAULT 'available', -- 'available', 'pending', 'completed'
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (shipper_id) REFERENCES users(id)
  );

  CREATE TABLE IF NOT EXISTS trucks (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    driver_id INTEGER NOT NULL,
    current_location TEXT NOT NULL,
    truck_type TEXT NOT NULL,
    availability_date TEXT NOT NULL,
    contact TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (driver_id) REFERENCES users(id)
  );

  CREATE TABLE IF NOT EXISTS applications (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    load_id INTEGER NOT NULL,
    driver_id INTEGER NOT NULL,
    status TEXT DEFAULT 'pending', -- 'pending', 'accepted', 'rejected'
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (load_id) REFERENCES loads(id),
    FOREIGN KEY (driver_id) REFERENCES users(id)
  );

  CREATE TABLE IF NOT EXISTS messages (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    sender_id INTEGER NOT NULL,
    receiver_id INTEGER NOT NULL,
    content TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (sender_id) REFERENCES users(id),
    FOREIGN KEY (receiver_id) REFERENCES users(id)
  );

  CREATE TABLE IF NOT EXISTS reviews (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    reviewer_id INTEGER NOT NULL,
    reviewee_id INTEGER NOT NULL,
    rating INTEGER NOT NULL,
    comment TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (reviewer_id) REFERENCES users(id),
    FOREIGN KEY (reviewee_id) REFERENCES users(id)
  );
`);

async function startServer() {
  const app = express();
  const httpServer = createServer(app);
  const io = new Server(httpServer, {
    cors: { origin: "*" }
  });

  app.use(express.json());

  // Auth Middleware (Simple)
  const auth = (req: any, res: any, next: any) => {
    const userId = req.headers['authorization'];
    if (!userId) return res.status(401).json({ error: "Unauthorized" });
    const user = db.prepare("SELECT * FROM users WHERE id = ?").get(userId);
    if (!user) return res.status(401).json({ error: "Unauthorized" });
    req.user = user;
    next();
  };

  // --- API Routes ---

  // Auth
  app.post("/api/auth/signup", (req, res) => {
    const { email, password, role, name, company, phone } = req.body;
    try {
      const is_approved = role === 'admin' ? 1 : 0; // Admin auto-approved for demo
      const result = db.prepare(
        "INSERT INTO users (email, password, role, name, company, phone, is_approved) VALUES (?, ?, ?, ?, ?, ?, ?)"
      ).run(email, password, role, name, company, phone, is_approved);
      const user = db.prepare("SELECT * FROM users WHERE id = ?").get(result.lastInsertRowid);
      res.json(user);
    } catch (e: any) {
      res.status(400).json({ error: e.message });
    }
  });

  app.post("/api/auth/login", (req, res) => {
    const { email, password } = req.body;
    const user = db.prepare("SELECT * FROM users WHERE email = ? AND password = ?").get(email, password);
    if (!user) return res.status(401).json({ error: "Invalid credentials" });
    res.json(user);
  });

  // Users
  app.get("/api/users/me", auth, (req: any, res) => {
    res.json(req.user);
  });

  app.get("/api/admin/users", auth, (req: any, res) => {
    if (req.user.role !== 'admin') return res.status(403).json({ error: "Forbidden" });
    const users = db.prepare("SELECT * FROM users").all();
    res.json(users);
  });

  app.post("/api/admin/users/:id/approve", auth, (req: any, res) => {
    if (req.user.role !== 'admin') return res.status(403).json({ error: "Forbidden" });
    db.prepare("UPDATE users SET is_approved = 1 WHERE id = ?").run(req.params.id);
    res.json({ success: true });
  });

  // Loads
  app.get("/api/loads", (req, res) => {
    const { pickup, delivery, type } = req.query;
    let query = "SELECT loads.*, users.name as shipper_name FROM loads JOIN users ON loads.shipper_id = users.id WHERE status = 'available'";
    const params: any[] = [];
    if (pickup) { query += " AND pickup_location LIKE ?"; params.push(`%${pickup}%`); }
    if (delivery) { query += " AND delivery_location LIKE ?"; params.push(`%${delivery}%`); }
    if (type) { query += " AND truck_type = ?"; params.push(type); }
    
    const loads = db.prepare(query).all(...params);
    res.json(loads);
  });

  app.post("/api/loads", auth, (req: any, res) => {
    if (req.user.role !== 'shipper') return res.status(403).json({ error: "Only shippers can post loads" });
    const { pickup_location, delivery_location, weight, truck_type, rate, contact_details } = req.body;
    const result = db.prepare(
      "INSERT INTO loads (shipper_id, pickup_location, delivery_location, weight, truck_type, rate, contact_details) VALUES (?, ?, ?, ?, ?, ?, ?)"
    ).run(req.user.id, pickup_location, delivery_location, weight, truck_type, rate, contact_details);
    res.json({ id: result.lastInsertRowid });
  });

  app.get("/api/shipper/loads", auth, (req: any, res) => {
    const loads = db.prepare("SELECT * FROM loads WHERE shipper_id = ?").all(req.user.id);
    res.json(loads);
  });

  app.delete("/api/loads/:id", auth, (req: any, res) => {
    const load = db.prepare("SELECT * FROM loads WHERE id = ?").get(req.params.id);
    if (!load || (load.shipper_id !== req.user.id && req.user.role !== 'admin')) {
      return res.status(403).json({ error: "Unauthorized" });
    }
    db.prepare("DELETE FROM loads WHERE id = ?").run(req.params.id);
    res.json({ success: true });
  });

  // Trucks
  app.post("/api/trucks", auth, (req: any, res) => {
    if (req.user.role !== 'driver') return res.status(403).json({ error: "Only drivers can post trucks" });
    const { current_location, truck_type, availability_date, contact } = req.body;
    const result = db.prepare(
      "INSERT INTO trucks (driver_id, current_location, truck_type, availability_date, contact) VALUES (?, ?, ?, ?, ?)"
    ).run(req.user.id, current_location, truck_type, availability_date, contact);
    res.json({ id: result.lastInsertRowid });
  });

  app.get("/api/trucks", (req, res) => {
    const trucks = db.prepare("SELECT trucks.*, users.name as driver_name FROM trucks JOIN users ON trucks.driver_id = users.id").all();
    res.json(trucks);
  });

  // Applications
  app.post("/api/loads/:id/apply", auth, (req: any, res) => {
    if (req.user.role !== 'driver') return res.status(403).json({ error: "Only drivers can apply" });
    const result = db.prepare(
      "INSERT INTO applications (load_id, driver_id) VALUES (?, ?)"
    ).run(req.params.id, req.user.id);
    res.json({ id: result.lastInsertRowid });
  });

  app.get("/api/shipper/applications", auth, (req: any, res) => {
    const apps = db.prepare(`
      SELECT applications.*, users.name as driver_name, loads.pickup_location, loads.delivery_location 
      FROM applications 
      JOIN loads ON applications.load_id = loads.id 
      JOIN users ON applications.driver_id = users.id 
      WHERE loads.shipper_id = ?
    `).all(req.user.id);
    res.json(apps);
  });

  // Messages
  app.post("/api/messages/send", auth, (req: any, res) => {
    const { receiverId, content } = req.body;
    const result = db.prepare("INSERT INTO messages (sender_id, receiver_id, content) VALUES (?, ?, ?)")
      .run(req.user.id, receiverId, content);
    const message = db.prepare("SELECT * FROM messages WHERE id = ?").get(result.lastInsertRowid);
    res.json(message);
  });

  app.get("/api/messages/:otherId", auth, (req: any, res) => {
    const messages = db.prepare(`
      SELECT * FROM messages 
      WHERE (sender_id = ? AND receiver_id = ?) OR (sender_id = ? AND receiver_id = ?)
      ORDER BY created_at ASC
    `).all(req.user.id, req.params.otherId, req.params.otherId, req.user.id);
    res.json(messages);
  });

  // Stats
  app.get("/api/stats", auth, (req: any, res) => {
    const activeLoads = db.prepare("SELECT COUNT(*) as count FROM loads WHERE status = 'available'").get() as any;
    const completedLoads = db.prepare("SELECT COUNT(*) as count FROM loads WHERE status = 'completed'").get() as any;
    const totalUsers = db.prepare("SELECT COUNT(*) as count FROM users").get() as any;
    
    res.json({
      activeLoads: activeLoads.count,
      completedLoads: completedLoads.count,
      totalUsers: totalUsers.count
    });
  });

  // Reviews
  app.post("/api/reviews", auth, (req: any, res) => {
    const { reviewee_id, rating, comment } = req.body;
    db.prepare("INSERT INTO reviews (reviewer_id, reviewee_id, rating, comment) VALUES (?, ?, ?, ?)")
      .run(req.user.id, reviewee_id, rating, comment);
    res.json({ success: true });
  });

  app.get("/api/reviews/:userId", (req, res) => {
    const reviews = db.prepare(`
      SELECT reviews.*, users.name as reviewer_name 
      FROM reviews 
      JOIN users ON reviews.reviewer_id = users.id 
      WHERE reviewee_id = ?
    `).all(req.params.userId);
    res.json(reviews);
  });

  // Socket.io for Chat
  io.on("connection", (socket) => {
    socket.on("join", (userId) => {
      socket.join(`user_${userId}`);
    });

    socket.on("send_message", ({ senderId, receiverId, content }) => {
      const result = db.prepare("INSERT INTO messages (sender_id, receiver_id, content) VALUES (?, ?, ?)")
        .run(senderId, receiverId, content);
      const message = db.prepare("SELECT * FROM messages WHERE id = ?").get(result.lastInsertRowid);
      
      io.to(`user_${receiverId}`).emit("receive_message", message);
      io.to(`user_${senderId}`).emit("receive_message", message);
    });
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

  const PORT = 3000;
  httpServer.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
