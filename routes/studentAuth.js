
const express = require('express');
const bcrypt = require('bcryptjs');
const Student = require('../models/Student');

const router = express.Router();

// Email validation
function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

// Student Registration
router.post('/register', async (req, res) => {
  try {
    const {
      fullName,
      rollNumber,
      email,
      branch,
      year,
      password,
      confirmPassword
    } = req.body;

    // Check required fields
    if (
      typeof fullName !== 'string' ||
      typeof rollNumber !== 'string' ||
      typeof email !== 'string' ||
      typeof branch !== 'string' ||
      typeof year !== 'string' ||
      typeof password !== 'string' ||
      typeof confirmPassword !== 'string'
    ) {
      return res.status(400).json({
        message: 'Please fill all required fields.'
      });
    }

    const cleanName = fullName.trim();
    const cleanRoll = rollNumber.trim().toUpperCase();
    const cleanEmail = email.trim().toLowerCase();
    const cleanBranch = branch.trim();

    if (
      cleanName.length < 2 ||
      cleanName.length > 100 ||
      !cleanRoll ||
      cleanRoll.length > 30 ||
      !isValidEmail(cleanEmail) ||
      cleanEmail.length > 150 ||
      !cleanBranch ||
      cleanBranch.length > 50
    ) {
      return res.status(400).json({
        message: 'Please enter valid student details.'
      });
    }

    if (!['1', '2', '3', '4'].includes(year)) {
      return res.status(400).json({
        message: 'Please select a valid B.Tech year.'
      });
    }

    if (password.length < 8 || password.length > 72) {
      return res.status(400).json({
        message: 'Password must be between 8 and 72 characters.'
      });
    }

    if (password !== confirmPassword) {
      return res.status(400).json({
        message: 'Password and Confirm Password do not match.'
      });
    }

    // Check duplicate email or roll number
    const existingStudent = await Student.findOne({
      $or: [
        { email: cleanEmail },
        { rollNumber: cleanRoll }
      ]
    });

    if (existingStudent) {
      return res.status(409).json({
        message: 'This Email or Roll Number is already registered.'
      });
    }

    // Hash password before saving
    const hashedPassword = await bcrypt.hash(password, 12);

    await Student.create({
      fullName: cleanName,
      rollNumber: cleanRoll,
      email: cleanEmail,
      branch: cleanBranch,
      year,
      password: hashedPassword
    });

    return res.status(201).json({
      message: 'Student registration successful. Please login now.'
    });

  } catch (error) {
    console.error('[Student Registration]', error);

    if (error.code === 11000) {
      return res.status(409).json({
        message: 'Email or Roll Number is already registered.'
      });
    }

    return res.status(500).json({
      message: 'Unable to register. Please try again.'
    });
  }
});

// Student Login
router.post('/login', async (req, res, next) => {
  try {
    const { identifier, password } = req.body;

    if (
      typeof identifier !== 'string' ||
      typeof password !== 'string' ||
      !identifier.trim() ||
      !password
    ) {
      return res.status(400).json({
        message: 'Please enter Email/Roll Number and Password.'
      });
    }

    const loginId = identifier.trim();
    const isEmail = loginId.includes('@');

    const student = await Student.findOne(
      isEmail
        ? { email: loginId.toLowerCase() }
        : { rollNumber: loginId.toUpperCase() }
    ).select('+password');

    if (!student || !student.isActive) {
      return res.status(401).json({
        message: 'Invalid login details or inactive account.'
      });
    }

    const passwordMatches = await bcrypt.compare(
      password,
      student.password
    );

    if (!passwordMatches) {
      return res.status(401).json({
        message: 'Invalid login details or inactive account.'
      });
    }

    // Create a fresh session after successful login
    req.session.regenerate((error) => {
      if (error) return next(error);

      req.session.isStudent = true;
      req.session.studentId = student._id.toString();

      req.session.save((saveError) => {
        if (saveError) return next(saveError);

        return res.json({
          message: 'Student login successful.',
          student: {
            id: student._id,
            fullName: student.fullName,
            rollNumber: student.rollNumber,
            email: student.email,
            branch: student.branch,
            year: student.year
          }
        });
      });
    });

  } catch (error) {
    console.error('[Student Login]', error);

    return res.status(500).json({
      message: 'Unable to login. Please try again.'
    });
  }
});

// Check Student Login Status
router.get('/me', async (req, res) => {
  try {
    if (
      !req.session ||
      req.session.isStudent !== true ||
      !req.session.studentId
    ) {
      return res.status(401).json({
        isStudent: false,
        message: 'Please login first.'
      });
    }

    const student = await Student.findById(
      req.session.studentId
    );

    if (!student || !student.isActive) {
      return res.status(401).json({
        isStudent: false,
        message: 'Student account not available.'
      });
    }

    return res.json({
      isStudent: true,
      student: {
        id: student._id,
        fullName: student.fullName,
        rollNumber: student.rollNumber,
        email: student.email,
        branch: student.branch,
        year: student.year
      }
    });

  } catch (error) {
    console.error('[Student Auth Check]', error);

    return res.status(500).json({
      message: 'Unable to check login status.'
    });
  }
});

// Student Logout
router.post('/logout', (req, res, next) => {
  if (!req.session || req.session.isStudent !== true) {
    return res.status(401).json({
      message: 'Student is not logged in.'
    });
  }

  req.session.destroy((error) => {
    if (error) return next(error);

    res.clearCookie('dbrau_admin_session', {
      httpOnly: true,
      sameSite: 'lax',
      secure: false
    });

    return res.json({
      message: 'Student logout successful.'
    });
  });
});

module.exports = router;
