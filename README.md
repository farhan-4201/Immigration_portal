# 🏛️ Legal & Immigration CRM Portal

A robust, enterprise-grade CRM system built with Next.js 14, designed specifically for legal firms and immigration consultants to manage clients, cases, and workflows with precision.

## 🚀 Features

- **📊 Dashboard**: Real-time overview of active cases, upcoming deadlines, and recent activities.
- **👥 Client Management**: Detailed client profiles, including nationality, relationship status, and contact info.
- **📁 Case Tracking**: Manage immigration status, history, documents, and specific legal deadlines.
- **🛡️ Role-Based Access Control (RBAC)**:
  - **Admin**: Full system access, user management, and high-level advice.
  - **Manager**: Oversee caseworkers and manage case assignments.
  - **Case Worker**: Direct interaction with cases, notes, and updates.
- **🔔 Notification System**: Stay updated on new advice, case changes, and urgent deadlines.
- **📝 Audit Logging**: Comprehensive tracking of all critical system actions.

## 🛠️ Tech Stack

- **Frontend**: [Next.js 14](https://nextjs.org/) (App Router), [React 18](https://reactjs.org/), [Tailwind CSS](https://tailwindcss.com/)
- **Backend**: [Next.js API Routes](https://nextjs.org/docs/app/building-your-application/routing/route-handlers)
- **Database**: [MongoDB](https://www.mongodb.com/) with [Mongoose](https://mongoosejs.com/)
- **Authentication**: JWT (JSON Web Tokens) with [Jose](https://github.com/panva/jose)
- **Validation**: [Zod](https://zod.dev/)
- **Icons**: [React Icons](https://react-icons.github.io/react-icons/) & [Lucide React](https://lucide.dev/)

## ⚙️ Project Setup

### Prerequisites

- Node.js (v18.x or later)
- MongoDB instance (Local or Atlas)

### Installation

1. **Clone the repository**:
   ```bash
   git clone <repository-url>
   cd CRM
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Environment Setup**:
   Create a `.env.local` file in the root directory:
   ```env
   MONGODB_URI=your_mongodb_connection_string
   JWT_SECRET=your_secure_jwt_secret
   ```

4. **Seed the Database** (Optional):
   Populate the database with initial roles and sample data:
   ```bash
   npm run seed
   ```

### Development

Run the development server:
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) to view the portal.

## 📦 Scripts

- `npm run dev`: Starts the development server.
- `npm run build`: Builds the application for production.
- `npm run start`: Starts the production server.
- `npm run lint`: Runs ESLint for code quality.
- `npm run seed`: Seeds the database with initial data.

## 🔐 Security

- **Password Hashing**: Uses `bcryptjs` for secure storage.
- **Session Management**: Secure JWT-based authentication.
- **RBAC**: Strict role checks on all sensitive API routes.
- **Audit Logs**: Every major case modification is logged with the user ID and timestamp.

---
