const express = require('express');
const cors = require('cors');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const admin = require("firebase-admin");

const serviceAccount = require("./serviceAccountKey.json");

admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

const app = express();
const PORT = 3000;

app.use(cors());
app.use(express.json());
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

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
<<<<<<< HEAD
=======

>>>>>>> fc50b985243b6c54b85d1c8629b0e25337b467c1
        if (!req.file) {
            return res.status(400).json({ error: 'No slip file uploaded' });
        }

        const receiptNo = 'INV-' + Math.floor(Math.random() * 1000000);
        const paymentRecord = {
            receiptNo: receiptNo,
            originalFilename: req.file.originalname,
<<<<<<< HEAD
            localFilePath: req.file.path,
            slip: 'http://localhost:3000/uploads/' + req.file.filename,
            status: 'pending',
=======
            localFilePath: req.file.path, // หากมีการอัปโหลดขึ้น Firebase Storage ค่อยเปลี่ยน path ตรงนี้
            slip: 'http://localhost:3000/uploads/' + req.file.filename,
            status: 'pending', // คุณสามารถตั้งให้เป็น 'waiting' ถ้าต้องการให้แอดมินตรวจก่อน
>>>>>>> fc50b985243b6c54b85d1c8629b0e25337b467c1
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

<<<<<<< HEAD
app.get('/api/payments', async (req, res) => {
  try {
    const snapshot = await db.collection('payments').get();
    const payments = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    res.json(payments);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

=======
//ดึงรายการ Payment
app.get('/api/payments', async (req, res) => {
  try {
    const snapshot = await db.collection('payments').get();

    const payments = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));

    res.json(payments);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

//อนุมัติ / ปฏิเสธ Payment 
>>>>>>> fc50b985243b6c54b85d1c8629b0e25337b467c1
app.put('/api/payments/:id/status', async (req, res) => {
  try {
    const { status, adminName } = req.body;
    const { id } = req.params;
<<<<<<< HEAD
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

=======

    //  เพิ่ม
    if (!status) {
        return res.status(400).json({ error: "Status is required" });
    }


    await db.collection('payments').doc(id).update({
      status: status,
      updatedAt: new Date()
    });

    // เพิ่ม log
    await db.collection('logs').add({
      admin: adminName,
      action: `${status} payment ${id}`,
      time: new Date().toLocaleString()
    });

    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

//3. Members API
//ดึงสมาชิก
app.get('/api/members', async (req, res) => {
  try {
    const snapshot = await db.collection('users').get();

    const members = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));

    res.json(members);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

//แก้ไขสมาชิก
>>>>>>> fc50b985243b6c54b85d1c8629b0e25337b467c1
app.put('/api/members/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { name, phone, email, adminName } = req.body;
<<<<<<< HEAD
    await db.collection('users').doc(id).update({ name, phone, email });
    await db.collection('logs').add({ admin: adminName, action: `Edited member ${name}`, time: new Date().toLocaleString() });
    res.json({ success: true });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

=======

    await db.collection('users').doc(id).update({
      name, phone, email
    });

    await db.collection('logs').add({
      admin: adminName,
      action: `Edited member ${name}`,
      time: new Date().toLocaleString()
    });

    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

//ลบสมาชิก
>>>>>>> fc50b985243b6c54b85d1c8629b0e25337b467c1
app.delete('/api/members/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { adminName } = req.body;
<<<<<<< HEAD
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

=======

    await db.collection('users').doc(id).delete();

    await db.collection('logs').add({
      admin: adminName,
      action: `Deleted member ${id}`,
      time: new Date().toLocaleString()
    });

    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

//4. Logs API
app.get('/api/logs', async (req, res) => {
  try {
    const snapshot = await db.collection('logs').get();

    const logs = snapshot.docs.map(doc => doc.data());

    res.json(logs);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

//5. Dashboard Stats
>>>>>>> fc50b985243b6c54b85d1c8629b0e25337b467c1
app.get('/api/dashboard/stats', async (req, res) => {
  try {
    const paymentsSnap = await db.collection('payments').get();
    const usersSnap = await db.collection('users').get();

    let totalRevenue = 0;
    let totalBookings = paymentsSnap.size;
<<<<<<< HEAD
    let bookingByDay = [0, 0, 0, 0, 0, 0, 0];
    let revenueByDay = [0, 0, 0, 0, 0, 0, 0];
=======
    
    // Array to hold aggregated data for Mon (0) to Sun (6)
    let bookingByDay = [0, 0, 0, 0, 0, 0, 0];
    let revenueByDay = [0, 0, 0, 0, 0, 0, 0];
    
>>>>>>> fc50b985243b6c54b85d1c8629b0e25337b467c1
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

<<<<<<< HEAD
=======
      // We aggregate by the date it was created
>>>>>>> fc50b985243b6c54b85d1c8629b0e25337b467c1
      let d = new Date();
      if (data.createdAt && typeof data.createdAt.toDate === 'function') {
         d = data.createdAt.toDate();
      }
      
<<<<<<< HEAD
      let day = d.getDay();
      let index = day === 0 ? 6 : day - 1;

      if (data.status === "approved" || data.status === "success" || data.status === "completed") {
=======
      let day = d.getDay(); // 0 is Sun, 1 is Mon... 6 is Sat
      let index = day === 0 ? 6 : day - 1; // Map so 0=Mon, 6=Sun

      if (data.status === "approved" || data.status === "success")  {
>>>>>>> fc50b985243b6c54b85d1c8629b0e25337b467c1
        totalRevenue += amt;
        revenueByDay[index] += amt;
      }
      bookingByDay[index] += 1;
    });

    allPayments.sort((a,b) => {
       const da = (a.createdAt && typeof a.createdAt.toDate === 'function') ? a.createdAt.toDate().getTime() : 0;
       const db = (b.createdAt && typeof b.createdAt.toDate === 'function') ? b.createdAt.toDate().getTime() : 0;
<<<<<<< HEAD
       return db - da;
=======
       return db - da; // Descending
>>>>>>> fc50b985243b6c54b85d1c8629b0e25337b467c1
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
<<<<<<< HEAD
      chartData: { bookings: bookingByDay, revenue: revenueByDay },
=======
      chartData: {
        bookings: bookingByDay,
        revenue: revenueByDay
      },
>>>>>>> fc50b985243b6c54b85d1c8629b0e25337b467c1
      recentTransactions,
      barberStats: barberCounts
    });

<<<<<<< HEAD
  } catch (err) { res.status(500).json({ error: err.message }); }
});

=======
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 6. Generic CRM Endpoints (Services, Staff, Promotions, Settings)

>>>>>>> fc50b985243b6c54b85d1c8629b0e25337b467c1
app.get('/api/services', async (req, res) => {
  try {
    let snap = await db.collection('services').get();
    if (snap.empty) {
<<<<<<< HEAD
      await db.collection('services').add({ name: "Haircut", duration: "45", price: "250" });
      await db.collection('services').add({ name: "Shaving", duration: "20", price: "100" });
=======
      await db.collection('services').add({ name: "Haircut (ตัดผมผู้ชาย)", duration: "45", price: "250" });
      await db.collection('services').add({ name: "Haircut + Wash (ตัด+สระ)", duration: "60", price: "350" });
      await db.collection('services').add({ name: "Shaving (โกนหนวด)", duration: "20", price: "100" });
>>>>>>> fc50b985243b6c54b85d1c8629b0e25337b467c1
      snap = await db.collection('services').get();
    }
    res.json(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.post('/api/services', async (req, res) => {
  try {
<<<<<<< HEAD
    const docRef = await db.collection('services').add({ ...req.body, createdAt: admin.firestore.FieldValue.serverTimestamp() });
=======
    const docRef = await db.collection('services').add({
      ...req.body,
      createdAt: admin.firestore.FieldValue.serverTimestamp()
    });
>>>>>>> fc50b985243b6c54b85d1c8629b0e25337b467c1
    res.json({ id: docRef.id, message: "Service added" });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.get('/api/staff', async (req, res) => {
  try {
    let snap = await db.collection('staff').get();
    if (snap.empty) {
<<<<<<< HEAD
      await db.collection('staff').add({ name: "Sun", hours: "09:00 - 18:00", icon: "👨🦱" });
=======
      await db.collection('staff').add({ name: "Sun", hours: "09:00 - 18:00", icon: "👨‍🦱" });
>>>>>>> fc50b985243b6c54b85d1c8629b0e25337b467c1
      await db.collection('staff').add({ name: "Earth", hours: "12:00 - 21:00", icon: "🧔" });
      snap = await db.collection('staff').get();
    }
    res.json(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.post('/api/staff', async (req, res) => {
  try {
<<<<<<< HEAD
    const docRef = await db.collection('staff').add({ ...req.body, createdAt: admin.firestore.FieldValue.serverTimestamp() });
=======
    const docRef = await db.collection('staff').add({
      ...req.body,
      createdAt: admin.firestore.FieldValue.serverTimestamp()
    });
>>>>>>> fc50b985243b6c54b85d1c8629b0e25337b467c1
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
<<<<<<< HEAD
    const docRef = await db.collection('promotions').add({ ...req.body, createdAt: admin.firestore.FieldValue.serverTimestamp() });
=======
    const docRef = await db.collection('promotions').add({
      ...req.body,
      createdAt: admin.firestore.FieldValue.serverTimestamp()
    });
>>>>>>> fc50b985243b6c54b85d1c8629b0e25337b467c1
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

app.post('/api/settings', async (req, res) => {
  try {
<<<<<<< HEAD
    await db.collection('settings').doc('general').set({ ...req.body, updatedAt: admin.firestore.FieldValue.serverTimestamp() });
=======
    await db.collection('settings').doc('general').set({
      ...req.body,
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    });
>>>>>>> fc50b985243b6c54b85d1c8629b0e25337b467c1
    res.json({ message: "Settings updated" });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

<<<<<<< HEAD
=======
// Dynamic CRUD Routes for Admin Data
>>>>>>> fc50b985243b6c54b85d1c8629b0e25337b467c1
['services', 'staff', 'promotions', 'payments'].forEach(collectionName => {
  app.delete(`/api/${collectionName}/:id`, async (req, res) => {
    try {
      await db.collection(collectionName).doc(req.params.id).delete();
      res.json({ message: "Item deleted successfully" });
    } catch (err) { res.status(500).json({ error: err.message }); }
  });

  app.put(`/api/${collectionName}/:id`, async (req, res) => {
    try {
<<<<<<< HEAD
      await db.collection(collectionName).doc(req.params.id).update({ ...req.body, updatedAt: admin.firestore.FieldValue.serverTimestamp() });
=======
      await db.collection(collectionName).doc(req.params.id).update({
        ...req.body,
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
      });
>>>>>>> fc50b985243b6c54b85d1c8629b0e25337b467c1
      res.json({ message: "Item updated successfully" });
    } catch (err) { res.status(500).json({ error: err.message }); }
  });
});

app.post('/api/members', async (req, res) => {
  try {
<<<<<<< HEAD
    const docRef = await db.collection('users').add({ name: req.body.name || "Unknown", phone: req.body.phone || "-", email: req.body.email || "-" });
    res.json({ success: true, id: docRef.id });
  } catch (error) { res.status(500).json({ error: "Failed to add member" }); }
});

=======
    const { name, phone, email } = req.body;

    const newMember = {
      name: name || "Unknown",
      phone: phone || "-",
      email: email || "-"
    };

    const docRef = await db.collection('users').add(newMember);

    res.json({ success: true, id: docRef.id });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to add member" });
  }
});


>>>>>>> fc50b985243b6c54b85d1c8629b0e25337b467c1
app.listen(PORT, () => {
    console.log(`Payment Server running on http://localhost:${PORT}`);
});
