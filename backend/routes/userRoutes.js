const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { authUser, getProfile, updateProfile, uploadAvatar } = require('../controllers/userController.js');

// ensure upload directory exists
const uploadDir = path.join(__dirname, '..', 'uploads', 'avatars');
fs.mkdirSync(uploadDir, { recursive: true });

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    const ext = path.extname(file.originalname);
    const filename = `avatar_${Date.now()}${ext}`;
    cb(null, filename);
  },
});

const upload = multer({ storage });

router.post('/login', authUser);
router.get('/:id', getProfile);
router.put('/:id', updateProfile);
router.post('/:id/avatar', upload.single('avatar'), uploadAvatar);

module.exports = router;
