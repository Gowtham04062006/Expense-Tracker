# 💰 Expense Tracker Application (MERN Stack)

A full-stack expense management application that helps users track daily expenses, manage budgets, monitor spending habits, and maintain financial records through a clean and responsive user interface.

---

# Technical Stack

### Frontend
- HTML5
- CSS3
- JavaScript
- Vite

### Backend
- Node.js
- Express.js
- JWT Authentication
- bcryptjs

### Database
- MongoDB
- Mongoose ODM

---

# Key Features

### Authentication
- User Registration
- Secure Login
- JWT-Based Authentication
- Password Hashing

### Expense Management
- Add Expenses
- Update Expenses
- Delete Expenses
- Categorize Expenses
- Track Spending History

### User Dashboard
- Expense Summary
- Budget Monitoring
- Financial Overview

### Profile Management
- Update Personal Information
- Manage User Settings

---

# Project Structure

```text
expense-tracker/

├── backend/
│   ├── middleware/
│   │   └── authMiddleware.js
│   │
│   ├── models/
│   │   ├── User.js
│   │   └── Expense.js
│   │
│   ├── routes/
│   │   ├── authRoutes.js
│   │   ├── expenseRoutes.js
│   │   └── profileRoutes.js
│   │
│   ├── config/
│   │   └── db.js
│   │
│   ├── server.js
│   └── .env
│
├── public/
│
├── src/
│   ├── pages/
│   │   ├── Login
│   │   ├── Register
│   │   ├── Dashboard
│   │   ├── History
│   │   └── Profile
│   │
│   ├── components/
│   ├── assets/
│   └── App.js
│
├── package.json
└── README.md
```

---

# Environment Variable Configuration

Create a `.env` file inside the backend directory.

```env
PORT=5000

MONGO_URI=your_mongodb_connection_string

JWT_SECRET=your_secret_key
```

---

# Database Schema Design

## User Schema

| Field | Type | Description |
|---------|---------|-------------|
| username | String | User name |
| email | String | Unique email |
| password | String | Hashed password |
| createdAt | Date | Registration timestamp |

---

## Expense Schema

| Field | Type | Description |
|---------|---------|-------------|
| userId | ObjectId | User reference |
| title | String | Expense title |
| amount | Number | Expense amount |
| category | String | Expense category |
| date | Date | Expense date |
| createdAt | Date | Record timestamp |

---

# REST API Documentation

## Authentication Routes

### Register User

```http
POST /api/auth/register
```

Request Body

```json
{
  "username":"john",
  "email":"john@example.com",
  "password":"password123"
}
```

---

### Login User

```http
POST /api/auth/login
```

Request Body

```json
{
  "email":"john@example.com",
  "password":"password123"
}
```

---

## Expense Routes

### Get All Expenses

```http
GET /api/expenses
```

### Add Expense

```http
POST /api/expenses
```

Request Body

```json
{
  "title":"Groceries",
  "amount":500,
  "category":"Food"
}
```

### Update Expense

```http
PUT /api/expenses/:id
```

### Delete Expense

```http
DELETE /api/expenses/:id
```

---

# Application Flow

1. User creates an account.
2. User logs into the application.
3. Dashboard displays expense overview.
4. User adds daily expenses.
5. Expenses are stored in MongoDB.
6. Users can update or remove expenses.
7. Expense history is maintained for tracking.

---

# Setup & Installation Guide

## Prerequisites

- Node.js (v18+)
- MongoDB
- npm

---

## Installation

Clone Repository

```bash
git clone https://github.com/your-username/expense-tracker.git
```

Move into project folder

```bash
cd expense-tracker
```

Install dependencies

```bash
npm install
```

Install backend dependencies

```bash
cd backend
npm install
```

---

## Run Development Server

Backend

```bash
cd backend
npm start
```

Frontend

```bash
npm run dev
```

Application URL

```text
http://localhost:5173
```

---

# Future Enhancements

- Expense Analytics Charts
- Monthly Reports
- Export to PDF
- Email Notifications
- Dark Mode
- Mobile Application

---

# Contributors

- G.Leela Gowtham
- Project Team Members

---

# License

This project is developed for educational and learning purposes.
