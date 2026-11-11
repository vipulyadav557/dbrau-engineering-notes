const mongoose = require('mongoose');

const noteSchema = new mongoose.Schema(
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
      required: true,
      trim: true
    },
    year: {
      type: String,
      required: true
    },
    semester: {
      type: String,
      required: true
    },
    description: {
      type: String,
      default: ''
    },
    fileUrl: {
      type: String,
      default: ''
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model('Note', noteSchema);