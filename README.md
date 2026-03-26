# 💇‍♂️ Barbershop Booking Application (Group 7)
**Software Design and Development Project** โปรเจกต์ระบบจองคิวร้านตัดผมออนไลน์ พัฒนาขึ้นเพื่อส่งงานในรายวิชา SDD โดยเน้นการออกแบบประสบการณ์ผู้ใช้ตามหลัก Material Design และระบบจัดการการจองที่ครบวงจร

---

## 👥 2.1 ทีมงาน (Team Members)

| ลำดับ | รายชื่อ-นามสกุล | หน้าที่และความรับผิดชอบ (Specific Tasks) |
| :--- | :--- | :--- |
| 1 | **นายเจ้านาย เอี่ยมสำอางค์** | Creative Director & Lead Frontend |
| 2 | **นายธีธีช คัดคนัมพร** | System Analyst & System Designer |
| 3 | **นายจักรกฤษณ์ บางต่าย** | User Management & Auth Dev |
| 4 | **นายทีฆทัศน์ พินิจทรัพย์** | Feature Developer (Home/Booking) |
| 5 | **นายธนกฤต พรรณเผือก** | Financial System & Payment Flow |
| 6 | **นายณภัทร รัศมี** | Full-stack Engineer & Admin Dashboard |
| 7 | **นายภูธนพัตน์ ตากิ่มนอก** | Editor & Quality Control (Testing) |

---

## 📑 2.2 SRS ของระบบทั้งหมด
**Software Requirements Specification (Functional Requirements)**
*   **User Side:** ระบบสมาชิก (Register/Login), การเลือกช่าง, ระบบจองวัน/เวลา/บริการ, ระบบชำระเงินพร้อมอัปโหลดสลิป, หน้าข้อมูลส่วนตัวและประวัติการจอง
*   **Admin Side:** Dashboard สถิติรายได้, ระบบจัดการคิว (อนุมัติ/ปฏิเสธ), จัดการข้อมูลสมาชิก, และจัดการข้อมูลการบริการ/ช่าง

---

## 🛠 2.3 Tech Stack & Tools
*   **Frontend:** HTML5, CSS3 (Vanilla CSS), JavaScript (ES6+), Firebase SDK v10.12.0
*   **Backend:** Node.js, Express.js
*   **Database & Cloud:** Google Firebase (Firestore, Authentication, Storage)
*   **Design:** Figma
*   **Version Control:** Git & [GitHub](https://github.com/Pootanapat/sdd-project-group7.git)
*   **Tools:** VS Code, Postman, Node Package Manager (npm), **Google Antigravity (AI Coding Assistant)**

---

## 📁 2.4 โครงสร้างโปรเจกต์ (Project Structure)
```text
/
├── frontend/          # ไฟล์หน้าจอทั้งหมด (index.html, booking.html, admin.html, etc.)
│   ├── firebase.js    # ตั้งค่าการเชื่อมต่อ Firebase SDK
│   └── style.css      # ไฟล์สไตล์ส่วนกลาง
├── backend/           # ระบบเซิร์ฟเวอร์ Node.js สำหรับจัดการการอัปโหลดและสถิติ
│   ├── server.js      # Main Express Server
│   ├── uploads/       # โฟลเดอร์เก็บไฟล์สลิป (Local Development)
│   └── package.json   # Backend Dependencies
└── image/             # ไฟล์รูปภาพประกอบ
```

---

## 🧪 2.5 ผลการทดสอบระบบ (Test Results)
| Test Case | Description | Result |
| :--- | :--- | :--- |
| TC-01 | เข้าสู่ระบบสมาชิก | **Pass** |
| TC-02 | จองคิวออนไลน์และเลือกช่าง | **Pass** |
| TC-03 | อัปโหลดสลิปหลักฐานการชำระเงิน | **Pass** |
| TC-04 | Admin อนุมัติการจองและดู Dashboard | **Pass** |

---

## 🚀 2.6 การติดตั้งและเริ่มต้นใช้งาน (Installation & Setup)

### 1. การเตรียมการ (Prerequisites)
*   ติดตั้ง Node.js
*   ตั้งค่า Firebase Project

### 2. การตั้งค่า Backend & Frontend
1. เข้าไปที่โฟลเดอร์ `backend`
2. รัน `npm install`
3. วางไฟล์ `serviceAccountKey.json` ในโฟลเดอร์ `backend`
4. รัน `npm start` เพื่อเริ่มต้นเซิร์ฟเวอร์ (รันที่ port 3000)
5. เข้าใช้งานผ่าน `http://localhost:3000`

---

## 🎨 2.7 ผลงานการออกแบบ (Design Assets)
(เอกสารแนบประกอบไปด้วย System Architecture, ER Diagram, และ Use Case Diagram ในรูปแบบ PDF)

---
> **Note:** โปรเจกต์นี้พัฒนาขึ้นโดยนักศักษากลุ่ม 7 เพื่อวัตถุประสงค์ทางการศึกษาในรายวิชา SDD เท่านั้น
