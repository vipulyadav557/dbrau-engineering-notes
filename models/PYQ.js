const mongoose = require('mongoose');

const pyqSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true
    },

    subject: {
      type: String,
      required: true,
      trim: true
    },

    branch: {
      type: String,
      default: 'CSE',
      trim: true
    },

    year: {
      type: String,
      required: true,
      trim: true
    },

    semester: {
      type: String,
      required: true,
      trim: true
    },

    examYear: {
      type: String,
      trim: true,
      default: ''
    },

    description: {
      type: String,
      trim: true,
      default: ''
    },

    fileUrl: {
      type: String,
      required: true
    }
  },
  {
    timestamps: true
  }
);

module.exports = mongoose.model('PYQ', pyqSchema);