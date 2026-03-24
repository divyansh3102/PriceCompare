# PriceCompare App

A visually premium, highly performant Local Electronics Price Comparison Platform designed to operate entirely locally. 

The application offers a secure environment with JWT-based authentication and email verification workflows using Nodemailer. It has recently been optimized to use a local, file-based SQLite database (`sql.js`), removing the need for external database dependencies (like MongoDB) and minimizing setup overhead.

---

## 🚀 Features

- **Modern User Interface:** Built with React, Vite, and TailwindCSS for a highly responsive, glassmorphic, and dynamic design.
- **Local Persistence:** Data is stored locally via SQL-based persistence (`sql.js`), ensuring privacy and speed.
- **Secure Authentication:** Implementation of robust JWT-based authentication workflows.
- **Email OTP Verification:** Validates user registrations actively through Nodemailer configuration.
- **Seller vs. User Accounts:** Differentiated workflows for shop owners and regular consumers comparing prices.

---

## 🛠️ Technology Stack

**Frontend:**
- [React 18](https://reactjs.org/)
- [Vite](https://vitejs.dev/)
- [TailwindCSS](https://tailwindcss.com/)
- [Framer Motion](https://www.framer.com/motion/)

**Backend:**
- [Node.js](https://nodejs.org/) & [Express](https://expressjs.com/)
- [sql.js](https://sql.js.org/) (SQLite local database)
- [Nodemailer](https://nodemailer.com/) (OTP emails)
- [JSON Web Tokens (JWT)](https://jwt.io/)

---

## 💻 Getting Started (Local Development)

### 1. Clone the repository
\`\`\`bash
git clone https://github.com/Arnab-Das41766/Divyansh-project-.git
cd Divyansh-project-
\`\`\`

### 2. Backend Setup
Navigate to the \`backend\` directory and install dependencies:
\`\`\`bash
cd backend
npm install
\`\`\`

Set up your environment variables. Create a \`.env\` file in the \`backend\` directory:
\`\`\`bash
# Database (SQLite)
SQLITE_DB_PATH=./data/pricecompare.db

# Email Configuration
EMAIL_USER=your_email@gmail.com
EMAIL_PASS=your_app_password

# JWT
JWT_SECRET=your-super-secret-jwt-key
PORT=5000
NODE_ENV=development
\`\`\`

Run the backend development server:
\`\`\`bash
npm run dev
# The server will start on http://localhost:5000
\`\`\`

### 3. Frontend Setup
Open a new terminal, navigate to the \`frontend\` directory, and install dependencies:
\`\`\`bash
cd frontend
npm install
\`\`\`

Run the frontend development server:
\`\`\`bash
npm run dev
# The frontend will be accessible at http://localhost:5173
\`\`\`

---

## 🛡️ License
This project is for educational and hackathon demonstration purposes. All rights reserved.
