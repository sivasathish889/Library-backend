# 📚 Library Management System (LMS) - Backend API

A robust, production-ready RESTful API backend for managing library operations including user management, book inventory, physical copy tracking, book issuance and returns, automated fine calculations, missing book management, and dashboard analytics.

Built with **Node.js**, **Express**, **TypeScript**, **Prisma ORM**, **MySQL**, and documented using **Swagger / OpenAPI 3.0**.

---

## 🚀 Features

- **🔐 Authentication & Authorization**: JWT-based token authentication with Role-Based Access Control (`STUDENT`, `LIBRARIAN`, `ADMIN`).
- **📖 Book & Inventory Management**: CRUD operations for books, stock management, rack positioning, and individual book copy accession tracking.
- **🔄 Book Issuing & Returns**: Track active loans, due dates, return processing, and automated missing book workflows.
- **💰 Fine Management**: Automatic daily fine computation for overdue returns, configurable fine rates, payment processing, and fine tracking.
- **👥 User & Student Administration**: Student search by registration number/name, user management, and department tracking.
- **📊 Analytics & Dashboard**: Metrics for total books, active loans, returned books, missing items, and fine collections.
- **📄 Interactive API Documentation**: Built-in Swagger UI at `/api-docs` with direct endpoint testing and JWT authorization support.

---

## 🛠️ Tech Stack

- **Runtime**: Node.js
- **Framework**: Express.js
- **Language**: TypeScript
- **Database & ORM**: MySQL with Prisma ORM
- **Authentication**: JSON Web Tokens (`jsonwebtoken`) & `bcryptjs`
- **API Documentation**: Swagger UI (`swagger-ui-express` & `swagger-jsdoc`)
- **Development Tooling**: `nodemon`, `ts-node`, `typescript`

---

## 📂 Project Structure

```text
Library-backend/
├── prisma/
│   ├── schema.prisma        # Prisma Database Schemas & Relations
│   └── seed.ts              # Database Seeder (Initial Data & Admin user)
├── src/
│   ├── config/
│   │   ├── logger.ts        # HTTP Request Logging Middleware
│   │   └── swagger.ts       # Swagger OpenAPI 3.0 Specification Config
│   ├── controllers/
│   │   ├── auth.controller.ts        # Authentication Logic
│   │   ├── book.controller.ts        # Book Management Logic
│   │   ├── dashboard.controller.ts   # Analytics & Dashboard Metrics
│   │   ├── fine.controller.ts        # Fine Rates & Payment Logic
│   │   ├── transaction.controller.ts # Issue, Return, & Missing Logic
│   │   └── user.controller.ts        # User Management & Student Search
│   ├── middlewares/
│   │   └── auth.middleware.ts        # JWT Verification & Role Authorization
│   ├── routes/
│   │   ├── auth.routes.ts            # /api/auth Endpoints
│   │   ├── book.routes.ts            # /api/books Endpoints
│   │   ├── dashboard.routes.ts       # /api/dashboard Endpoints
│   │   ├── fine.routes.ts            # /api/fines Endpoints
│   │   ├── transaction.routes.ts     # /api/transactions Endpoints
│   │   └── user.routes.ts            # /api/users Endpoints
│   ├── app.ts               # Express App Setup & Middleware Mounts
│   └── index.ts             # Server Entry Point
├── .env.example             # Template for Environment Variables
├── nodemon.json             # Nodemon Configuration
├── package.json             # Dependencies & NPM Scripts
└── tsconfig.json            # TypeScript Compiler Configuration
```

---

## ⚡ Getting Started

### Prerequisites

- **Node.js** (v18 or higher recommended)
- **MySQL** Database Server
- **npm** or **yarn**

---

### Installation & Environment Setup

1. **Clone the repository** and navigate to the backend directory:
   ```bash
   cd Library-backend
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Configure environment variables**:
   Create a `.env` file in the root directory (copy from `.env.example`):
   ```bash
   cp .env.example .env
   ```
   Update the database URL and JWT secret in `.env`:
   ```env
   PORT=5001
   DATABASE_URL="mysql://root:password@localhost:3306/lms"
   JWT_SECRET="your_jwt_secret_key_here"
   ```

4. **Initialize Database & Prisma Client**:
   ```bash
   npx prisma migrate dev --name init
   # or sync database schema:
   npx prisma db push
   npx prisma generate
   ```

5. **(Optional) Seed Initial Data**:
   ```bash
   npm run prisma:seed
   ```

---

## 📜 NPM Scripts

| Script | Command | Description |
| :--- | :--- | :--- |
| `npm run dev` | `nodemon src/index.ts` | Starts the server in development mode with auto-reload. |
| `npm run build` | `tsc && npx prisma generate` | Compiles TypeScript into JavaScript inside `/dist`. |
| `npm start` | `ts-node src/index.ts` | Runs the TypeScript entry point directly. |
| `npm run start-prod` | `node dist/index.js` | Runs the compiled JavaScript production build. |
| `npm run prisma:generate` | `prisma generate` | Generates Prisma Client. |
| `npm run prisma:seed` | `ts-node prisma/seed.ts` | Seeds the database with default records. |

---

## 📖 API Documentation & Swagger UI

Interactive API documentation is built into the backend via Swagger UI.

1. Start the backend dev server:
   ```bash
   npm run dev
   ```

2. Access the Swagger UI in your browser:
   - **Swagger UI Page**: [http://localhost:5001/api-docs](http://localhost:5001/api-docs) (or `/docs`)
   - **Raw OpenAPI JSON Spec**: [http://localhost:5001/api-docs.json](http://localhost:5001/api-docs.json)

### Authenticating in Swagger UI
1. Perform a `POST /api/auth/login` request using the Auth endpoint in Swagger UI or Postman.
2. Copy the returned `token`.
3. Click the **Authorize 🔓** button at the top right of the Swagger UI.
4. Paste your token into the Value box as `Bearer <token>` and click **Authorize**.

---

## 🛣️ API Endpoints Summary

### 🔑 Authentication (`/api/auth`)
- `POST /api/auth/signup` - Register a new user
- `POST /api/auth/login` - Authenticate user & retrieve JWT token

### 📚 Books (`/api/books`)
- `GET /api/books` - List all books with search query support
- `GET /api/books/:id` - Get specific book details and available copies
- `POST /api/books` - Add a new book & generate copies *(Librarian/Admin)*
- `PUT /api/books/:id` - Update book details *(Librarian/Admin)*
- `DELETE /api/books/:id` - Delete book & associated copies *(Librarian/Admin)*

### 🔄 Transactions (`/api/transactions`)
- `GET /api/transactions/my` - Get current logged-in user's transactions
- `GET /api/transactions/issued` - Get all currently issued books *(Librarian/Admin)*
- `GET /api/transactions/returned` - Get returned books history *(Librarian/Admin)*
- `GET /api/transactions/missing` - Get missing book records *(Librarian/Admin)*
- `GET /api/transactions/issued-by-user/:userId` - Get active issues for a user *(Librarian/Admin)*
- `POST /api/transactions/issue` - Issue a book copy to a student *(Librarian/Admin)*
- `POST /api/transactions/missing-manual` - Manually log a missing item *(Librarian/Admin)*
- `PUT /api/transactions/:id/return` - Return an issued book & compute fine *(Librarian/Admin)*
- `PUT /api/transactions/:id/missing` - Mark an active issue as missing *(Librarian/Admin)*
- `GET /api/transactions` - List all transactions with filters *(Librarian/Admin)*

### 💰 Fines (`/api/fines`)
- `GET /api/fines` - List all system fines *(Librarian/Admin)*
- `GET /api/fines/my` - List logged-in user's fines
- `PUT /api/fines/config` - Update daily overdue fine rate *(Admin)*
- `PUT /api/fines/:id/pay` - Mark a fine as paid

### 👥 Users (`/api/users`)
- `GET /api/users/search` - Search students by name or registration number *(Librarian/Admin)*
- `GET /api/users` - Get all registered users *(Admin)*
- `POST /api/users` - Create a user profile *(Admin)*
- `PUT /api/users/:id` - Update a user profile *(Admin)*
- `DELETE /api/users/:id` - Delete a user profile *(Admin)*

### 📊 Dashboard & System (`/api/dashboard` & `/health`)
- `GET /api/dashboard` - Get library summary metrics *(Librarian/Admin)*
- `GET /health` - Health check status endpoint

---

## 🔒 Security & Best Practices

- **Role Authorization**: Endpoints are secured using custom middleware (`authenticate` & `authorize`).
- **Input Validation**: Request bodies and parameters are checked before executing Prisma transaction blocks.
- **Error Handling**: Graceful error handling with HTTP status codes (400, 401, 403, 404, 500).

---

## 📄 License

This project is licensed under the **ISC License**.
