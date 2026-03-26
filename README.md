# 💇‍♂️ Barbershop Booking Application (Group 7)

**Software Design and Development Project** โปรเจกต์ระบบจองคิวร้านตัดผมออนไลน์ พัฒนาขึ้นเพื่อส่งงานในรายวิชา SDD โดยเน้นการออกแบบประสบการณ์ผู้ใช้ตามหลัก Material Design และระบบจัดการการจองที่ครบวงจร



---



## 👥 2.1 ทีมงาน (Team Members)



| ลำดับ | รายชื่อ-นามสกุล | หน้าที่และความรับผิดชอบ (Specific Tasks) |

| :--- | :--- | :--- |

| 1 | **นายเจ้านาย เอี่ยมสำอางค์** | Creative Director & Lead Frontend |

| 2 | **นายธีธีช คัดคนัมพร** | System Analyst |

| 3 | **นายจักรกฤษณ์ บางต่าย** | User Management & Auth Dev |

| 4 | **นายทีฆทัศน์ พินิจทรัพย์** | Feature Developer (Home/Booking) |

| 5 | **นายธนกฤต พรรณเผือก** | Financial System & Payment Flow |

| 6 | **นายณภัทร รัศมี** |  Admin Dashboard |

| 7 | **นายภูธนพัตน์ ตากิ่มนอก** | Editor & Quality Control (Testing) |



---



## 📑 2.2 SRS ของระบบทั้งหมด

**Software Requirements Specification (Functional Requirements)**

*   **User Side:** ระบบสมาชิก (Register/Login), การเลือกช่าง, ระบบจองวัน/เวลา/บริการ, ระบบชำระเงินพร้อมอัปโหลดสลิป, หน้าข้อมูลส่วนตัวและประวัติการจอง

*   **Admin Side:** Dashboard สถิติรายได้, ระบบจัดการคิว (อนุมัติ/ปฏิเสธ), จัดการข้อมูลสมาชิก, และจัดการข้อมูลการบริการ/ช่าง



---



## 🛠 2.3.1 สถาปัตยกรรมระบบ (System Architecture)

![System Architecture](image\system_architecture.png)



---



## 📁 2.3.2 แผนภาพกรณีการใช้งาน (Use case diagram)

![Use case diagram](image\use_case_diagram.png)



---



## 🧪 2.3.3 แผนภาพกิจกรรม (Activity Diagram)

![Activity Diagram Register](image\activity_login_register.png)

![Activity Diagram Booking](image\activity_booking.png)

![Activity Diagram Upload Slip](image\activity_upload_slip.png)

![Activity Diagram Admin Verify Slip](image\activity_admin_verify_slip.png)



---



## 🧪 2.3.4 แผนภาพ ER (ER Diagram)



![ER Diagram](image\firestore_er_diagram.png)



---



## 📑 2.3.6 UX/UI

![Main Page](image\Main_Page.png)

![Sigh Up](image\Sigh_Up.png)

![Sigh In](image\Sigh_In.png)

![Service](image\Service.png)



---



## 🛠 2.4 Tech Stack ที่ใช้พัฒนา



*   Frontend:Static HTML/CSS/JS , Firebase Client SDK

*   Backend:Node.js + Express, endpoints: /api/upload-slip

*   Database:Firebase Firestore (bookings, users)

*   File Storage:Local uploads/ + Firebase Storage (avatar)

*   Auth:Firebase Auth (Email/Password)



---



### 2.5 Test Case ของระบบ และผลการทดสอบระบบ

การทดสอบระบบ (System Testing) แบ่งออกเป็นการทดสอบการทำงานของระบบ (Functional Testing) ตาม Requirement ที่ได้ออกแบบไว้ และการทดสอบ API (API Testing) โดยมีรายละเอียดและผลการทดสอบดังนี้

#### 🧪 System Test Cases (Manual Testing)

| Test Case ID | ระบบ / โมดูล | รายละเอียดการทดสอบ (Test Description) | ผลลัพธ์ที่คาดหวัง (Expected Result) | สถานะ (Status) |
| --- | --- | --- | --- | :---: |
| **TC_1.01** | UI/UX | ตรวจสอบการแสดงผลสีหลัก (Primary Color) ของปุ่มจองคิว | ปุ่มแสดงสีตรงตาม Code สีที่กำหนดไว้ | Pass ✅ |
| **TC_1.02** | UI/UX | ตรวจสอบฟอนต์ (Typography) ในหน้าแรกของระบบ | ตัวหนังสือแสดงผลเป็นฟอนต์ที่กำหนดและอ่านง่าย | Pass ✅ |
| **TC_1.03** | UI/UX | ตรวจสอบการแสดงผลรูปภาพ Reference บนมือถือ | รูปภาพไม่เบี้ยวและปรับขนาดตามหน้าจอได้อย่างถูกต้อง | Fail ❌ |
| **TC_2.01** | Navigation | ตรวจสอบการกดปุ่มเพื่อเปลี่ยนหน้าจาก Login ไปฟอร์มสมัครสมาชิก | ระบบเปลี่ยนหน้าไปยังหน้าฟอร์มสมัครสมาชิก (Register) ได้ทันทีโดยไม่เกิด Error | Pass ✅ |
| **TC_2.02** | Authorization | ทดสอบการจัดการสิทธิ์การเข้าถึงหน้า Admin Dashboard ของลูกค้าทั่วไป | ระบบป้องกันไม่ให้ลูกค้าทั่วไปเข้าถึงได้ (แสดงข้อความแจ้งเตือน) | Fail ❌ |
| **TC_2.03** | Data Flow | ตรวจสอบการเชื่อมโยงข้อมูลจากขั้นตอนการจองคิวไปยังหน้าชำระเงิน | ระบบเปลี่ยนหน้าไปที่ Payment Summary และแสดงยอดเงินรวมถูกต้อง | Pass ✅ |
| **TC_3.01** | Authentication | ตรวจสอบการเข้าสู่ระบบด้วย Username และ Password ที่ถูกต้อง | ผู้ใช้เข้าสู่ระบบสำเร็จและไปหน้า Dashboard | Pass ✅ |
| **TC_3.02** | Authentication | ตรวจสอบการเข้าสู่ระบบด้วย Password ไม่ถูกต้อง | ระบบแสดงข้อความ "Username หรือ Password ไม่ถูกต้อง" | Pass ✅ |
| **TC_3.03** | Authentication | ตรวจสอบการเข้าสู่ระบบเมื่อไม่ได้กรอกข้อมูล | ระบบแจ้งเตือนให้กรอก Username และ Password | Pass ✅ |
| **TC_4.01** | Booking | ตรวจสอบการแสดงรายชื่อช่างตัดผมในหน้าจองคิว | ระบบแสดงข้อมูลรายชื่อช่างตัดผมทั้งหมดให้ลูกค้าเลือก | Pass ✅ |
| **TC_4.02** | Booking | ทดสอบการเลือกช่วงเวลาที่ว่างสำหรับการจองคิว | ระบบแสดงช่วงเวลาที่ว่างและสามารถกดจองได้ | Pass ✅ |
| **TC_5.01** | Payment | ตรวจสอบความถูกต้องของการคำนวณยอดเงินรวม | ยอดเงินรวมแสดงตรงตามราคาบริการที่ลูกค้าเลือกไว้ในตะกร้า | Pass ✅ |
| **TC_5.02** | Payment | ตรวจสอบการอัปโหลดไฟล์สลิป (รูปแบบ .jpg) | ระบบอัปโหลดไฟล์สำเร็จและแสดงตัวอย่างภาพสลิป | Fail ❌ |
| **TC_5.03** | Payment | ตรวจสอบสถานะการจองหลังกดส่งสลิปโอนเงิน | สถานะการจองเปลี่ยนจาก "รอชำระเงิน" เป็น "รอการตรวจสอบ" | Pass ✅ |
| **TC_6.01** | Admin | ทดสอบการแสดงกราฟสรุปยอดจองในหน้า Dashboard | ระบบแสดงกราฟจำนวนลูกค้าที่จองต่อวัน/ต่อเดือนได้อย่างถูกต้อง | Pass ✅ |
| **TC_6.02** | Admin | ทดสอบการดูสลิปโอนเงินและการอนุมัติการชำระเงิน | ผู้ดูแลระบบสามารถคลิกดูภาพสลิป และกดอัปเดตสถานะได้ | Pass ✅ |
| **TC_6.03** | Admin | ทดสอบการดูรายชื่อ, แก้ไข และลบข้อมูลสมาชิก | ระบบแสดงรายชื่อ และสามารถบันทึกการแก้ไข/ลบข้อมูลได้ | Pass ✅ |
| **TC_7.01** | UI/UX | ทดสอบการทำงานของปุ่ม "ย้อนกลับ" (Back) ในทุกหน้าจอ | ระบบพากลับไปหน้าจอก่อนหน้าได้ถูกต้องโดยไม่เกิดข้อผิดพลาด | Pass ✅ |
| **TC_7.02** | UI/UX | ทดสอบการแสดงผลและกดปิดหน้าต่าง Pop-up ยืนยัน | Pop-up แสดงผลถูกต้อง และสามารถคลิกเพื่อปิดการแสดงผลได้ | Pass ✅ |

<br>


---



## 🚀การติดตั้งและเริ่มต้นใช้งาน (Installation & Setup)



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
