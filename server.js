const express = require('express');
const path = require('path');
const dotenv = require('dotenv');
const session = require('express-session');

const connectDB = require('./config/db');
const notesRouter = require('./routes/notes');
const pyqsRouter = require('./routes/pyqs'); // NEW: PYQ route
const studentAuthRouter = require('./routes/studentAuth');

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Check required admin environment variables
if (
  !process.env.ADMIN_USERNAME ||
  !process.env.ADMIN_PASSWORD ||
  !process.env.SESSION_SECRET
) {
  console.error(
    '[Server] Missing ADMIN_USERNAME, ADMIN_PASSWORD or SESSION_SECRET in .env'
  );
  process.exit(1);
}

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(
  '/uploads',
  express.static(path.join(__dirname, 'uploads'), {
    dotfiles: 'deny',
    index: false
  })
);

// Session configuration
app.use(
  session({
    name: 'dbrau_admin_session',
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      sameSite: 'lax',
      secure: false, // For localhost development only
      maxAge: 2 * 60 * 60 * 1000
    }
  })
);

// Static files
app.use(express.static(path.join(__dirname, 'public')));
// Notes page route
app.get('/notes', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'pages', 'notes.html'));
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    message: 'DBRAU Engineering Notes server is running',
    timestamp: new Date().toISOString()
  });
});

// Admin login
app.post('/api/auth/login', (req, res, next) => {
  const { username, password } = req.body;

  if (
    typeof username !== 'string' ||
    typeof password !== 'string' ||
    username !== process.env.ADMIN_USERNAME ||
    password !== process.env.ADMIN_PASSWORD
  ) {
    return res.status(401).json({
      message: 'Username ya password galat hai.'
    });
  }

  req.session.regenerate((err) => {
    if (err) {
      return next(err);
    }

    req.session.isAdmin = true;

    req.session.save((saveError) => {
      if (saveError) {
        return next(saveError);
      }

      res.json({
        message: 'Login successful',
        isAdmin: true
      });
    });
  });
});

// Check current login status
app.get('/api/auth/me', (req, res) => {
  res.json({
    isAdmin: req.session.isAdmin === true
  });
});

// Admin logout
app.post('/api/auth/logout', (req, res, next) => {
  req.session.destroy((err) => {
    if (err) {
      return next(err);
    }

    res.clearCookie('dbrau_admin_session', {
      httpOnly: true,
      sameSite: 'lax',
      secure: false
    });

    res.json({
      message: 'Logout successful'
    });
  });
});

// Notes API
app.use('/api/notes', notesRouter);

// PYQ API - NEW
app.use('/api/pyqs', pyqsRouter);

// Student Authentication API
app.use('/api/student-auth', studentAuthRouter);

// 404 handler
app.use((req, res, next) => {
  res.status(404).json({
    error: 'Not Found',
    message: 'The requested resource does not exist'
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('[Server Error]', err.message);

  res.status(err.status || 500).json({
    error: err.name || 'Internal Server Error',
    message:
      process.env.NODE_ENV === 'production'
        ? 'Something went wrong'
        : err.message
  });
});

//
// Start Server
const startServer = async () => {
  try {
    await connectDB();

    const PORT = process.env.PORT || 3000;

    app.listen(PORT, '0.0.0.0', () => {
      console.log(
        `[Server] DBRAU Engineering Notes running on http://localhost:${PORT}`
      );

      console.log(
        `[Server] Mobile access: http://10.92.17.81:${PORT}`
      );

      console.log(
        `[Server] Health check: http://localhost:${PORT}/api/health`
      );

      console.log(
        `[Server] Admin login API: http://localhost:${PORT}/api/auth/login`
      );

      console.log(
        `[Server] Notes API: http://localhost:${PORT}/api/notes`
      );

      console.log(
        `[Server] PYQ API: http://localhost:${PORT}/api/pyqs`
      );
    });

  } catch (error) {
    console.error('[Server] Failed to start:', error.message);
    process.exit(1);
  }
};

startServer();
