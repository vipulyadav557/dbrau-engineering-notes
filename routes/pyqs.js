
const express = require('express');
const PYQ = require('../models/pyq');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');

const router = express.Router();

// Upload directory
const uploadDir = path.join(__dirname, '..', 'uploads');
fs.mkdirSync(uploadDir, { recursive: true });

// Admin authentication
function requireAdmin(req, res, next) {
  if (req.session && req.session.isAdmin === true) {
    return next();
  }

  return res.status(401).json({
    message: 'Admin login required'
  });
}

// Remove an uploaded file
async function removeUploadedFile(file) {
  if (!file || !file.path) return;

  try {
    await fs.promises.unlink(file.path);
  } catch (error) {
    if (error.code !== 'ENOENT') {
      console.error('[PYQ PDF CLEANUP]', error);
    }
  }
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
    console.error('[PYQ PDF VALIDATION]', error);
    return false;
  }
}

// PDF storage
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

// Preliminary PDF validation
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

// Handle upload errors and validate actual file content
function handlePyqPdfUpload(req, res, next) {
  upload.single('pdf')(req, res, async (error) => {
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

    if (!req.file) {
      return next();
    }

    const valid = await isValidPdf(req.file.path);

    if (!valid) {
      await removeUploadedFile(req.file);

      return res.status(400).json({
        message: 'Invalid PDF content. Please upload a genuine PDF file.'
      });
    }

    return next();
  });
}

// Safely remove old local PDF
async function removeLocalPdf(fileUrl) {
  if (
    typeof fileUrl !== 'string' ||
    !fileUrl.startsWith('/uploads/')
  ) {
    return;
  }

  const filename = fileUrl.slice('/uploads/'.length);

  // Prevent path traversal
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
    console.log('[PYQ PDF CLEANUP] Removed:', filename);
  } catch (error) {
    if (error.code !== 'ENOENT') {
      console.error('[PYQ PDF CLEANUP]', error);
    }
  }
}

// GET all PYQs + Search
router.get('/', async (req, res, next) => {
  try {
    const { q } = req.query;
    const filter = {};

    if (q && String(q).trim()) {
      const searchText = String(q).trim().slice(0, 100);

      const searchRegex = new RegExp(
        searchText.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'),
        'i'
      );

      filter.$or = [
        { title: searchRegex },
        { subject: searchRegex },
        { branch: searchRegex },
        { year: searchRegex },
        { semester: searchRegex },
        { examYear: searchRegex },
        { description: searchRegex }
      ];
    }

    const pyqs = await PYQ.find(filter).sort({ createdAt: -1 });

    return res.json({
      count: pyqs.length,
      pyqs
    });
  } catch (error) {
    next(error);
  }
});

// ADD new PYQ
router.post(
  '/',
  requireAdmin,
  handlePyqPdfUpload,
  async (req, res, next) => {
    try {
      const {
        title,
        subject,
        branch,
        year,
        semester,
        examYear,
        description
      } = req.body;

      if (
        !title?.trim() ||
        !subject?.trim() ||
        !year ||
        !semester
      ) {
        await removeUploadedFile(req.file);

        return res.status(400).json({
          message: 'Title, subject, year and semester are required.'
        });
      }

      if (!req.file) {
        return res.status(400).json({
          message: 'Please upload a PDF file.'
        });
      }

      const pyq = await PYQ.create({
        title: title.trim(),
        subject: subject.trim(),
        branch,
        year,
        semester,
        examYear,
        description,
        fileUrl: `/uploads/${req.file.filename}`
      });

      return res.status(201).json({
        message: 'PYQ added successfully.',
        pyq
      });
    } catch (error) {
      await removeUploadedFile(req.file);
      next(error);
    }
  }
);

// UPDATE PYQ
router.put(
  '/:id',
  requireAdmin,
  handlePyqPdfUpload,
  async (req, res, next) => {
    try {
      if (!/^[0-9a-fA-F]{24}$/.test(req.params.id)) {
        await removeUploadedFile(req.file);

        return res.status(400).json({
          message: 'Invalid PYQ ID.'
        });
      }

      const pyq = await PYQ.findById(req.params.id);

      if (!pyq) {
        await removeUploadedFile(req.file);

        return res.status(404).json({
          message: 'PYQ not found.'
        });
      }

      const fields = [
        'title',
        'subject',
        'branch',
        'year',
        'semester',
        'examYear',
        'description'
      ];

      fields.forEach((field) => {
        if (req.body[field] !== undefined) {
          pyq[field] = req.body[field];
        }
      });

      const oldFileUrl = pyq.fileUrl;

      if (req.file) {
        pyq.fileUrl = `/uploads/${req.file.filename}`;
      }

      // Save first; remove old file only after successful save
      await pyq.save();

      if (req.file && oldFileUrl !== pyq.fileUrl) {
        await removeLocalPdf(oldFileUrl);
      }

      return res.json({
        message: 'PYQ updated successfully.',
        pyq
      });
    } catch (error) {
      await removeUploadedFile(req.file);
      next(error);
    }
  }
);

// DELETE PYQ
router.delete('/:id', requireAdmin, async (req, res, next) => {
  try {
    if (!/^[0-9a-fA-F]{24}$/.test(req.params.id)) {
      return res.status(400).json({
        message: 'Invalid PYQ ID.'
      });
    }

    const pyq = await PYQ.findById(req.params.id);

    if (!pyq) {
      return res.status(404).json({
        message: 'PYQ not found.'
      });
    }

    await pyq.deleteOne();
    await removeLocalPdf(pyq.fileUrl);

    return res.json({
      message: 'PYQ deleted successfully.'
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
