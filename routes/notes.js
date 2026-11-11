
const express = require('express');
const Note = require('../models/Note');
const mongoose = require('mongoose');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');

const router = express.Router();

// Create uploads folder automatically
const uploadDir = path.join(__dirname, '..', 'uploads');
fs.mkdirSync(uploadDir, { recursive: true });

// Admin authentication middleware
function requireAdmin(req, res, next) {
  if (req.session && req.session.isAdmin === true) {
    return next();
  }

  return res.status(401).json({
    message: 'Please login as admin to add notes.'
  });
}

// Remove an uploaded file
function removeUploadedFile(file) {
  if (!file || !file.path) return;

  fs.unlink(file.path, (error) => {
    if (error && error.code !== 'ENOENT') {
      console.error('[PDF CLEANUP]', error);
    }
  });
}

// Check actual PDF signature
async function isValidPdf(filePath) {
  try {
    const handle = await fs.promises.open(filePath, 'r');

    try {
      const buffer = Buffer.alloc(5);
      const result = await handle.read(buffer, 0, 5, 0);

      return (
        result.bytesRead === 5 &&
        buffer.toString('ascii') === '%PDF-'
      );
    } finally {
      await handle.close();
    }
  } catch (error) {
    console.error('[PDF VALIDATION]', error);
    return false;
  }
}

// Configure PDF storage
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },

  filename: (req, file, cb) => {
    const filename =
      `${Date.now()}-${crypto.randomBytes(8).toString('hex')}.pdf`;

    cb(null, filename);
  }
});

// Configure Multer
const upload = multer({
  storage,

  limits: {
    fileSize: 10 * 1024 * 1024,
    files: 1
  },

  fileFilter: (req, file, cb) => {
    const extension = path.extname(file.originalname).toLowerCase();

    if (
      extension !== '.pdf' ||
      file.mimetype !== 'application/pdf'
    ) {
      return cb(new Error('Only PDF files are allowed.'));
    }

    cb(null, true);
  }
});

// Handle upload errors and validate actual PDF content
function handlePdfUpload(req, res, next) {
  upload.single('pdfFile')(req, res, async (error) => {
    if (error) {
      if (error instanceof multer.MulterError) {
        if (error.code === 'LIMIT_FILE_SIZE') {
          return res.status(413).json({
            message: 'PDF size must not exceed 10 MB.'
          });
        }

        return res.status(400).json({
          message: 'Upload failed. Please select only one PDF file.'
        });
      }

      return res.status(400).json({
        message: error.message || 'Invalid PDF file.'
      });
    }

    // Upload is optional for Notes; online fileUrl is still supported
    if (!req.file) {
      return next();
    }

    const valid = await isValidPdf(req.file.path);

    if (!valid) {
      removeUploadedFile(req.file);

      return res.status(400).json({
        message: 'Invalid PDF content. Please upload a genuine PDF file.'
      });
    }

    return next();
  });
}

// Safely remove an old PDF stored inside uploads folder
async function removeLocalPdf(fileUrl) {
  if (typeof fileUrl !== 'string') return;
  if (!fileUrl.startsWith('/uploads/')) return;

  const filename = fileUrl.slice('/uploads/'.length);

  // Prevent path traversal and unexpected filenames
  if (
    !filename ||
    path.basename(filename) !== filename ||
    !filename.toLowerCase().endsWith('.pdf')
  ) {
    return;
  }

  const filePath = path.resolve(uploadDir, filename);

  if (path.dirname(filePath) !== path.resolve(uploadDir)) {
    return;
  }

  try {
    await fs.promises.unlink(filePath);
    console.log('[PDF CLEANUP] Old PDF removed:', filename);
  } catch (error) {
    if (error.code !== 'ENOENT') {
      console.error('[PDF CLEANUP]', error);
    }
  }
}

// GET notes — accessible to students without admin login
router.get('/', async (req, res) => {
  try {
    const { q, branch, year, semester, subject } = req.query;
    const filter = {};

    if (q) {
      const searchText = String(q).slice(0, 100);

      filter.$or = [
        { title: { $regex: searchText, $options: 'i' } },
        { subject: { $regex: searchText, $options: 'i' } },
        { description: { $regex: searchText, $options: 'i' } }
      ];
    }

    if (branch) filter.branch = branch;
    if (year) filter.year = year;
    if (semester) filter.semester = semester;
    if (subject) filter.subject = subject;

    const notes = await Note.find(filter).sort({ createdAt: -1 });

    return res.json({
      count: notes.length,
      notes
    });
  } catch (error) {
    console.error('[Notes API GET]', error);

    return res.status(500).json({
      message: 'Unable to fetch notes.'
    });
  }
});

// POST note — admin login required
router.post(
  '/',
  requireAdmin,
  handlePdfUpload,
  async (req, res) => {
    try {
      const {
        title,
        subject,
        branch,
        year,
        semester,
        description,
        fileUrl
      } = req.body;

      // Validate required fields
      if (
        !title?.trim() ||
        !subject?.trim() ||
        !branch ||
        !year ||
        !semester
      ) {
        removeUploadedFile(req.file);

        return res.status(400).json({
          message: 'Title, subject, branch, year and semester are required.'
        });
      }

      // Uploaded PDF takes priority over online URL
      const savedFileUrl = req.file
        ? `/uploads/${req.file.filename}`
        : (fileUrl || '').trim();

      const note = await Note.create({
        title: title.trim(),
        subject: subject.trim(),
        branch,
        year,
        semester,
        description: (description || '').trim(),
        fileUrl: savedFileUrl
      });

      return res.status(201).json({
        message: 'Note created successfully.',
        note
      });
    } catch (error) {
      console.error('[Notes API POST]', error);

      removeUploadedFile(req.file);

      return res.status(500).json({
        message: 'Unable to create note. Please try again.'
      });
    }
  }
);

// PUT note — admin login required
router.put(
  '/:id',
  requireAdmin,
  handlePdfUpload,
  async (req, res) => {
    try {
      const { id } = req.params;

      if (!mongoose.Types.ObjectId.isValid(id)) {
        removeUploadedFile(req.file);

        return res.status(400).json({
          message: 'Invalid note ID.'
        });
      }

      const note = await Note.findById(id);

      if (!note) {
        removeUploadedFile(req.file);

        return res.status(404).json({
          message: 'Note not found.'
        });
      }

      const {
        title,
        subject,
        branch,
        year,
        semester,
        description,
        fileUrl
      } = req.body;

      // Validate required fields
      if (
        typeof title !== 'string' || !title.trim() ||
        typeof subject !== 'string' || !subject.trim() ||
        typeof branch !== 'string' || !branch.trim() ||
        typeof year !== 'string' || !year.trim() ||
        typeof semester !== 'string' || !semester.trim()
      ) {
        removeUploadedFile(req.file);

        return res.status(400).json({
          message: 'Title, subject, branch, year and semester are required.'
        });
      }

      const oldFileUrl = note.fileUrl;

      note.title = title.trim();
      note.subject = subject.trim();
      note.branch = branch.trim();
      note.year = year.trim();
      note.semester = semester.trim();
      note.description =
        typeof description === 'string' ? description.trim() : '';

      if (req.file) {
        note.fileUrl = `/uploads/${req.file.filename}`;
      } else if (typeof fileUrl === 'string') {
        note.fileUrl = fileUrl.trim();
      }

      await note.save();

      // Delete old PDF only after successful database update
      if (
        req.file &&
        oldFileUrl &&
        oldFileUrl !== note.fileUrl
      ) {
        await removeLocalPdf(oldFileUrl);
      }

      return res.json({
        message: 'Note updated successfully.',
        note
      });
    } catch (error) {
      console.error('[Notes API PUT]', error);

      removeUploadedFile(req.file);

      return res.status(500).json({
        message: 'Unable to update note. Please try again.'
      });
    }
  }
);

// DELETE note — admin login required
router.delete('/:id', requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        message: 'Invalid note ID.'
      });
    }

    const note = await Note.findById(id);

    if (!note) {
      return res.status(404).json({
        message: 'Note not found.'
      });
    }

    const oldFileUrl = note.fileUrl;

    await note.deleteOne();
    await removeLocalPdf(oldFileUrl);

    return res.json({
      message: 'Note deleted successfully.'
    });
  } catch (error) {
    console.error('[Notes API DELETE]', error);

    return res.status(500).json({
      message: 'Unable to delete note. Please try again.'
    });
  }
});

module.exports = router;
