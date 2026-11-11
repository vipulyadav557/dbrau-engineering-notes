# DBRAU Engineering Notes

A web-based study platform for B.Tech students, designed to organize semester-wise engineering notes and Previous Year Question (PYQ) papers.

## 🌐 Live Demo

**Website:** https://dbrau-engineering-notes.onrender.com

**GitHub Repository:** https://github.com/vipulyadav557/dbrau-engineering-notes

> Note: The free hosting service may take some time to respond after a period of inactivity.

## 📖 About the Project

DBRAU Engineering Notes is a full-stack web application developed to make academic study materials easier to access and manage. Students can register, log in, browse notes and PYQs, and access PDF resources. Administrators can manage study materials through a protected admin panel.

## ✨ Features

- Student registration and login
- Student dashboard
- Admin authentication and dashboard
- Upload, view, edit and delete engineering notes
- Manage Previous Year Question (PYQ) papers
- Search PYQs by subject
- View and download PDF documents
- Browse academic content by year, semester and branch
- MongoDB Atlas database integration
- Responsive web interface

## 🛠️ Technology Stack

**Frontend**
- HTML5
- CSS3
- JavaScript

**Backend**
- Node.js
- Express.js

**Database**
- MongoDB Atlas

**Deployment and Version Control**
- Render
- GitHub

## 📂 Project Structure

```text
dbrau-engineering-notes/
├── config/
│   └── db.js
├── models/
│   ├── Note.js
│   ├── PYQ.js
│   └── Student.js
├── routes/
│   ├── notes.js
│   ├── pyqs.js
│   └── studentAuth.js
├── public/
│   ├── css/
│   ├── images/
│   ├── js/
│   ├── pages/
│   └── index.html
├── .env.example
├── .gitignore
├── package.json
└── server.js
```

## 🚀 Run Locally

### Prerequisites
- Node.js and npm
- A MongoDB Atlas account or compatible MongoDB database

### Installation

1. Clone the repository:

   ```bash
   git clone https://github.com/vipulyadav557/dbrau-engineering-notes.git
   ```

2. Open the project folder:

   ```bash
   cd dbrau-engineering-notes
   ```

3. Install dependencies:

   ```bash
   npm install
   ```

4. Create a `.env` file using `.env.example` as a reference. Add your own database connection string and required application secrets. Never commit real credentials.

5. Start the application:

   ```bash
   npm start
   ```

6. Open `http://localhost:3000` if your local server uses port 3000.

## 🔐 Environment Configuration

Configure the environment variables required by your application, such as the MongoDB connection string, admin credentials and session secret. Use the exact variable names expected by the source code.

Do not publish `.env` or real passwords, database credentials, or session secrets.

## ☁️ Deployment

The project source code is hosted on GitHub and the application is deployed on Render. The application uses MongoDB Atlas for database connectivity.

Uploaded files require suitable persistent or external storage for reliable long-term retention. Do not assume files stored on a temporary hosting filesystem will persist.

## 🧪 Testing

The developer has tested the main student authentication, admin, Notes and PYQ workflows. Further testing should be performed after code changes or redeployment.

## 🎯 Future Enhancements

- Reliable cloud storage for uploaded PDFs
- Improved input validation and abuse protection
- Automated testing and monitoring
- Additional academic resources and usability improvements

## 👨‍💻 Developer

**Vipul Kumar Yadav**

GitHub: https://github.com/vipulyadav557

---

This project is developed for educational purposes to help students access and organize engineering study materials.