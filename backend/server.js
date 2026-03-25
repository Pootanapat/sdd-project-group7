const express = require('express');
const cors = require('cors');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const admin = require("firebase-admin");

// 1. Initialize Firebase (Using actual credentials)
// กรุณานำไฟล์ serviceAccountKey.json มาวางไว้ในโฟลเดอร์เดียวกันกับ server.js ด้วยนะครับ
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

// Setup Multer for file uploads (simulating Firebase Storage upload by saving locally for now)
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

// API Endpoint to process payment slip
app.post('/api/upload-slip', upload.single('slip'), async (req, res) => {
    try {
        if (!req.body.amount || isNaN(req.body.amount)) {
            return res.status(400).json({ error: "Invalid amount" });
        }

        if (!req.file) {
            return res.status(400).json({ error: 'No slip file uploaded' });
        }

        console.log(`Received slip: ${req.file.filename}`);

        // Generate Receipt No
        const receiptNo = 'INV-' + Math.floor(Math.random() * 1000000);

        // Prepare data to save in Firestore
        const paymentRecord = {
            receiptNo: receiptNo,
            originalFilename: req.file.originalname,
            localFilePath: req.file.path, // หากมีการอัปโหลดขึ้น Firebase Storage ค่อยเปลี่ยน path ตรงนี้
            slip: 'http://localhost:3000/uploads/' + req.file.filename,
            status: 'pending', // คุณสามารถตั้งให้เป็น 'waiting' ถ้าต้องการให้แอดมินตรวจก่อน
            amount: Number(req.body.amount) ,
            customer: req.body.customer || "Unknown",
            service: req.body.service || "Haircut",
            barber: req.body.barber || "-",
            reservedDate: req.body.reservedDate || "-",
            reservedTime: req.body.reservedTime || "-",
            date: new Date().toLocaleDateString(),
            createdAt: admin.firestore.FieldValue.serverTimestamp()
        };

        // Save to Firebase Firestore collection named 'payments'
        await db.collection('payments').doc(receiptNo).set(paymentRecord);

        console.log(`[Firebase] Successfully saved document with ID ${receiptNo} to 'payments' collection.`);

        // Respond back to frontend
        res.status(200).json({
            success: true,
            message: 'Slip uploaded successfully and data saved to Firebase',
            receiptNo: receiptNo,
            filePath: req.file.path
        });

    } catch (error) {
        console.error('Error processing upload:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

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
app.put('/api/payments/:id/status', async (req, res) => {
  try {
    const { status, adminName } = req.body;
    const { id } = req.params;

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
app.put('/api/members/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { name, phone, email, adminName } = req.body;

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
app.delete('/api/members/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { adminName } = req.body;

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
app.get('/api/dashboard/stats', async (req, res) => {
  try {
    const paymentsSnap = await db.collection('payments').get();
    const usersSnap = await db.collection('users').get();

    let totalRevenue = 0;
    let totalBookings = paymentsSnap.size;
    
    // Array to hold aggregated data for Mon (0) to Sun (6)
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

      // We aggregate by the date it was created
      let d = new Date();
      if (data.createdAt && typeof data.createdAt.toDate === 'function') {
         d = data.createdAt.toDate();
      }
      
      let day = d.getDay(); // 0 is Sun, 1 is Mon... 6 is Sat
      let index = day === 0 ? 6 : day - 1; // Map so 0=Mon, 6=Sun

      if (data.status === "approved" || data.status === "success")  {
        totalRevenue += amt;
        revenueByDay[index] += amt;
      }
      bookingByDay[index] += 1;
    });

    allPayments.sort((a,b) => {
       const da = (a.createdAt && typeof a.createdAt.toDate === 'function') ? a.createdAt.toDate().getTime() : 0;
       const db = (b.createdAt && typeof b.createdAt.toDate === 'function') ? b.createdAt.toDate().getTime() : 0;
       return db - da; // Descending
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
      chartData: {
        bookings: bookingByDay,
        revenue: revenueByDay
      },
      recentTransactions,
      barberStats: barberCounts
    });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/members', async (req, res) => {
  try {
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


app.listen(PORT, () => {
    console.log(`Payment Server running on http://localhost:${PORT}`);
});


