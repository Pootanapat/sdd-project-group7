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

// 🟢 NEW: Serve Frontend Static Files
// You can now open http://localhost:3000 to see the website!
app.use(express.static(path.join(__dirname, '../frontend')));

// 🟢 NEW: Serve Uploaded Slips
// Admin can view slips at http://localhost:3000/uploads/filename
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
        if (!req.file) {
            return res.status(400).json({ error: 'No slip file uploaded' });
        }

        console.log(`Received slip: ${req.file.filename}`);

        // Extract booking data from form data
        const {
            userId,
            customerName,
            customerPhone,
            serviceName,
            barberName,
            bookingDate,
            bookingTime,
            price
        } = req.body;

        // Generate Receipt No
        const receiptNo = 'INV-' + Math.floor(Math.random() * 1000000);

        // Prepare data to save in Firestore
        const paymentRecord = {
            receiptNo: receiptNo,
            userId: userId || 'anonymous',
            customerName: customerName || '',
            customerPhone: customerPhone || '',
            serviceName: serviceName || '',
            barberName: barberName || '',
            date: bookingDate || '',
            time: bookingTime || '',
            price: Number(price) || 0,
            originalFilename: req.file.originalname,
            localFilePath: req.file.path, // หากมีการอัปโหลดขึ้น Firebase Storage ค่อยเปลี่ยน path ตรงนี้
            status: 'success', // คุณสามารถตั้งให้เป็น 'waiting' ถ้าต้องการให้แอดมินตรวจก่อน
            createdAt: admin.firestore.FieldValue.serverTimestamp()
        };

        // Save to Firebase Firestore collection named 'bookings'
        await db.collection('bookings').doc(receiptNo).set(paymentRecord);

        console.log(`[Firebase] Successfully saved document with ID ${receiptNo} to 'bookings' collection.`);

        // Respond back to frontend
        res.status(200).json({
            success: true,
            message: 'Booking saved successfully',
            receiptNo: receiptNo,
            filePath: `/uploads/${req.file.filename}` // Return relative path for the frontend
        });


    } catch (error) {
        console.error('Error processing upload:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

app.listen(PORT, () => {
    console.log(`Payment Server running on http://localhost:${PORT}`);
});


