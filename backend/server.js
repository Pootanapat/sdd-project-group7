const express = require('express');
const cors = require('cors');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const admin = require("firebase-admin");

// โหลด .env ถ้ามี (local dev) — ใน production (Render) ใช้ env vars จาก Dashboard
require('dotenv').config();

// ─── Firebase Init: ใช้ env var หรือ fallback ไปที่ไฟล์ JSON (dev only) ───
if (!admin.apps.length) {
    let credential;
    if (process.env.FIREBASE_SERVICE_ACCOUNT) {
        // Render/Production: ใช้ environment variable
        try {
            const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
            credential = admin.credential.cert(serviceAccount);
        } catch (e) {
            console.error('❌ FIREBASE_SERVICE_ACCOUNT is not valid JSON:', e.message);
            process.exit(1);
        }
    } else {
        // Local dev: ใช้ไฟล์ serviceAccountKey.json
        const keyPath = path.join(__dirname, 'serviceAccountKey.json');
        if (!fs.existsSync(keyPath)) {
            console.error('❌ Missing Firebase credentials!');
            console.error('   - Production: set FIREBASE_SERVICE_ACCOUNT env var in Render Dashboard');
            console.error('   - Local dev: place serviceAccountKey.json in backend/');
            process.exit(1);
        }
        const serviceAccount = require('./serviceAccountKey.json');
        credential = admin.credential.cert(serviceAccount);
    }
    admin.initializeApp({ credential });
}


const db = admin.firestore();

const app = express();
const PORT = process.env.PORT || 3000;
const BACKEND_URL = process.env.BACKEND_URL || `http://localhost:${PORT}`;

// ─── CORS: อนุญาต Vercel frontend ───
const allowedOrigins = [
    'http://localhost:3000',
    'http://localhost:5500',
    'http://127.0.0.1:5500',
    process.env.FRONTEND_URL || ''
].filter(Boolean);

app.use(cors({
    origin: function (origin, callback) {
        // อนุญาต requests ที่ไม่มี origin (เช่น mobile apps, curl)
        if (!origin) return callback(null, true);
        if (allowedOrigins.some(o => origin.startsWith(o)) || origin.endsWith('.vercel.app')) {
            return callback(null, true);
        }
        callback(new Error('Not allowed by CORS'));
    },
    credentials: true
}));
app.use(express.json());
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
app.use('/image', express.static(path.join(__dirname, '../image')));
app.use(express.static(path.join(__dirname, '../frontend')));

const uploadDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir);
}

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, uploadDir)
    },
    filename: function (req, file, cb) {
        cb(null, 'slip-' + Date.now() + path.extname(file.originalname))
    }
});

const upload = multer({ storage: storage });

app.post('/api/upload-slip', upload.single('slip'), async (req, res) => {
    try {
        if (!req.body.amount || isNaN(req.body.amount)) {
            return res.status(400).json({ error: "Invalid amount" });
        }
        if (!req.file) {
            return res.status(400).json({ error: 'No slip file uploaded' });
        }

        const receiptNo = 'INV-' + Math.floor(Math.random() * 1000000);
        const paymentRecord = {
            receiptNo: receiptNo,
            originalFilename: req.file.originalname,
            localFilePath: req.file.path,
            slip: `${BACKEND_URL}/uploads/` + req.file.filename,
            status: 'pending',
            amount: Number(req.body.amount) ,
            customer: req.body.customer || "Unknown",
            service: req.body.service || "Haircut",
            barber: req.body.barber || "-",
            reservedDate: req.body.reservedDate || "-",
            reservedTime: req.body.reservedTime || "-",
            date: new Date().toLocaleDateString(),
            createdAt: admin.firestore.FieldValue.serverTimestamp()
        };

        await db.collection('payments').doc(receiptNo).set(paymentRecord);
        res.status(200).json({
            success: true,
            receiptNo: receiptNo,
            filePath: req.file.path
        });
    } catch (error) {
        res.status(500).json({ error: 'Internal server error' });
    }
});

app.get('/api/payments', async (req, res) => {
  try {
    const snapshot = await db.collection('payments').get();
    const payments = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    res.json(payments);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.put('/api/payments/:id/status', async (req, res) => {
  try {
    const { status, adminName } = req.body;
    const { id } = req.params;
    if (!status) return res.status(400).json({ error: "Status is required" });

    await db.collection('payments').doc(id).update({ status: status, updatedAt: new Date() });
    await db.collection('logs').add({ admin: adminName, action: `${status} payment ${id}`, time: new Date().toLocaleString() });

    res.json({ success: true });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.get('/api/members', async (req, res) => {
  try {
    const snapshot = await db.collection('users').get();
    const members = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    res.json(members);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.put('/api/members/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { name, phone, email, adminName } = req.body;
    await db.collection('users').doc(id).update({ name, phone, email });
    await db.collection('logs').add({ admin: adminName, action: `Edited member ${name}`, time: new Date().toLocaleString() });
    res.json({ success: true });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.delete('/api/members/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { adminName } = req.body;
    await db.collection('users').doc(id).delete();
    await db.collection('logs').add({ admin: adminName, action: `Deleted member ${id}`, time: new Date().toLocaleString() });
    res.json({ success: true });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.get('/api/logs', async (req, res) => {
  try {
    const snapshot = await db.collection('logs').get();
    const logs = snapshot.docs.map(doc => doc.data());
    res.json(logs);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.get('/api/dashboard/stats', async (req, res) => {
  try {
    const paymentsSnap = await db.collection('payments').get();
    const usersSnap = await db.collection('users').get();

    let totalRevenue = 0;
    let totalBookings = paymentsSnap.size;
    let bookingByDay = [0, 0, 0, 0, 0, 0, 0];
    let revenueByDay = [0, 0, 0, 0, 0, 0, 0];
    let allPayments = [];
    let barberCounts = {};

    paymentsSnap.forEach(doc => {
      const data = doc.data();
      const amt = Number(data.amount || 0);

      data.id = doc.id;
      allPayments.push(data);

      if (data.barber && data.barber !== "-") {
        barberCounts[data.barber] = (barberCounts[data.barber] || 0) + 1;
      }

      let d = new Date();
      if (data.createdAt && typeof data.createdAt.toDate === 'function') {
         d = data.createdAt.toDate();
      }
      
      let day = d.getDay();
      let index = day === 0 ? 6 : day - 1;

      if (data.status === "approved" || data.status === "success" || data.status === "completed") {
        totalRevenue += amt;
        revenueByDay[index] += amt;
      }
      bookingByDay[index] += 1;
    });

    allPayments.sort((a,b) => {
       const da = (a.createdAt && typeof a.createdAt.toDate === 'function') ? a.createdAt.toDate().getTime() : 0;
       const db = (b.createdAt && typeof b.createdAt.toDate === 'function') ? b.createdAt.toDate().getTime() : 0;
       return db - da;
    });
    
    const recentTransactions = allPayments.slice(0, 5).map(p => ({
        id: p.id,
        customer: p.customer || "-",
        amount: p.amount || 0,
        status: p.status || "pending",
        time: (p.reservedDate || "-") + " " + (p.reservedTime && p.reservedTime !== "-" ? p.reservedTime : "")
    }));

    res.json({
      dailyBookings: totalBookings,
      monthlyRevenue: totalRevenue,
      totalMembers: usersSnap.size,
      chartData: { bookings: bookingByDay, revenue: revenueByDay },
      recentTransactions,
      barberStats: barberCounts
    });

  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.get('/api/services', async (req, res) => {
  try {
    let snap = await db.collection('services').get();
    if (snap.empty) {
      await db.collection('services').add({ name: "Haircut", duration: "45", price: "250" });
      await db.collection('services').add({ name: "Shaving", duration: "20", price: "100" });
      snap = await db.collection('services').get();
    }
    res.json(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.post('/api/services', async (req, res) => {
  try {
    const docRef = await db.collection('services').add({ ...req.body, createdAt: admin.firestore.FieldValue.serverTimestamp() });
    res.json({ id: docRef.id, message: "Service added" });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.get('/api/staff', async (req, res) => {
  try {
    let snap = await db.collection('staff').get();
    if (snap.empty) {
      await db.collection('staff').add({ name: "Sun", hours: "09:00 - 18:00", icon: "👨🦱" });
      await db.collection('staff').add({ name: "Earth", hours: "12:00 - 21:00", icon: "🧔" });
      snap = await db.collection('staff').get();
    }
    res.json(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.post('/api/staff', async (req, res) => {
  try {
    const docRef = await db.collection('staff').add({ ...req.body, createdAt: admin.firestore.FieldValue.serverTimestamp() });
    res.json({ id: docRef.id, message: "Staff added" });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.get('/api/promotions', async (req, res) => {
  try {
    const snap = await db.collection('promotions').get();
    res.json(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.post('/api/promotions', async (req, res) => {
  try {
    const docRef = await db.collection('promotions').add({ ...req.body, createdAt: admin.firestore.FieldValue.serverTimestamp() });
    res.json({ id: docRef.id, message: "Promotion added" });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.get('/api/settings', async (req, res) => {
  try {
    const doc = await db.collection('settings').doc('general').get();
    if (!doc.exists) return res.json({});
    res.json(doc.data());
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.get('/api/expenses', async (req, res) => {
  try {
    const snap = await db.collection('expenses').get();
    res.json(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.post('/api/expenses', async (req, res) => {
  try {
    const { adminName, description } = req.body;
    const docRef = await db.collection('expenses').add({
      ...req.body,
      createdAt: admin.firestore.FieldValue.serverTimestamp()
    });
    await db.collection('logs').add({ admin: adminName || "Admin", action: `Added expense: ${description}`, time: new Date().toLocaleString() });
    res.json({ id: docRef.id, message: "Expense added" });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.post('/api/settings', async (req, res) => {
  try {
    await db.collection('settings').doc('general').set({ ...req.body, updatedAt: admin.firestore.FieldValue.serverTimestamp() });
    res.json({ message: "Settings updated" });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

['services', 'staff', 'promotions', 'payments', 'expenses'].forEach(collectionName => {
  app.delete(`/api/${collectionName}/:id`, async (req, res) => {
    try {
      const { adminName } = req.body;
      const { id } = req.params;
      await db.collection(collectionName).doc(id).delete();
      if (adminName) {
        await db.collection('logs').add({ admin: adminName, action: `Deleted from ${collectionName}: ${id}`, time: new Date().toLocaleString() });
      }
      res.json({ message: "Item deleted successfully" });
    } catch (err) { res.status(500).json({ error: err.message }); }
  });

  app.put(`/api/${collectionName}/:id`, async (req, res) => {
    try {
      const { adminName, ...data } = req.body;
      const { id } = req.params;
      await db.collection(collectionName).doc(id).update({ ...data, updatedAt: admin.firestore.FieldValue.serverTimestamp() });
      if (adminName) {
        await db.collection('logs').add({ admin: adminName, action: `Updated ${collectionName}: ${data.description || data.name || id}`, time: new Date().toLocaleString() });
      }
      res.json({ message: "Item updated successfully" });
    } catch (err) { res.status(500).json({ error: err.message }); }
  });
});

app.post('/api/members', async (req, res) => {
  try {
    const docRef = await db.collection('users').add({ name: req.body.name || "Unknown", phone: req.body.phone || "-", email: req.body.email || "-" });
    res.json({ success: true, id: docRef.id });
  } catch (error) { res.status(500).json({ error: "Failed to add member" }); }
});

app.listen(PORT, () => {
    console.log(`Payment Server running on port ${PORT}`);
    console.log(`Backend URL: ${BACKEND_URL}`);
});

