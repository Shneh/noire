const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');

// Configure storage
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/'); // Destination folder
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + path.extname(file.originalname)); // unique filename
  }
});

const upload = multer({ storage: storage });

// POST route for uploading multiple files
router.post('/', upload.array('media', 10), (req, res) => {
  try {
    const files = req.files;
    if (!files || files.length === 0) {
      return res.status(400).json({ message: 'No files uploaded.' });
    }

    // Generate URLs for the uploaded files
    const urls = files.map(file => {
      const isVideo = file.mimetype.startsWith('video/');
      const protocol = req.headers['x-forwarded-proto'] || req.protocol;
      const host = req.get('host');
      return {
        url: `${protocol}://${host}/uploads/${file.filename}`,
        type: isVideo ? 'video' : 'image'
      };
    });

    res.status(200).json({ urls });
  } catch (error) {
    console.error('Upload Error:', error);
    res.status(500).json({ message: 'Failed to upload files', error: error.message });
  }
});

module.exports = router;
