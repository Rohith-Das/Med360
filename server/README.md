# 🩺 Med360 - Online Doctor Consultation Platform

Med360 is a mid-to-large scale web application built using the **MERN stack + TypeScript**, following **Clean Architecture** principles. It enables patients to consult with doctors online, manage appointments, medical records, payments, and more — all in a secure and scalable way.

---

## 🧱 Project Architecture

src/
├── application/ # Use cases and business logic
├── domain/ # Entities and repository interfaces
├── infrastructure/ # DB models, MongoDB connection, services
├── presentation/ # Routes, controllers, middleware
├── server.ts # Express app configuration
├── index.ts # Application entry point


Follows **Clean Architecture** with dependency injection using `tsyringe`.

---

## ⚙️ Tech Stack

- **Frontend**: React 
- **Backend**: Node.js, Express.js
- **Database**: MongoDB
- **Language**: TypeScript
- **Auth**: JWT (Access + Refresh Tokens), Email OTP Verification
- **Mailing**: Nodemailer (Gmail SMTP)
- **Validation**: express-validator
- **Dependency Injection**: tsyringe

---
## 🧩 Features 

### ✅ User Roles
- 👨‍⚕️ Doctor
- 👩‍💼 Admin
- 👨‍🦱 Patient

### ✅ Auth
- Register with OTP verification (Email + Mobile with country code)
- Login with JWT & Refresh Token
- Forgot password via email


## 🚀 Getting Started

### 🔧 Prerequisites

- Node.js (v18+)
- MongoDB installed locally or Atlas
- Gmail account with [App Password](https://myaccount.google.com/apppasswords)

### 🛠 Installation

```bash
# Clone the repo
git clone https://github.com/rohithdas/Med360.git
cd Med360/server