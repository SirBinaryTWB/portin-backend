const express = require('express');
const multer = require('multer');
const sharp = require('sharp');
const path = require('path');
const fs = require('fs');
const db = require('../db');
const { ensureAuth } = require('../middlewares/auth.middleware');

const upload = multer({ dest: 'tmp/' });
const router = express.Router();

router.post('/upload-avatar', ensureAuth, upload.single('avatar'), async (req, res) => {
  try {
    const file = req.file;
    const outDir = process.env.MEDIA_DIR || 'uploads';
    if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });
    const outPath = path.join(outDir, `avatar_${Date.now()}_${file.originalname}.webp`);

    await sharp(file.path)
      .resize(512, 512, { fit: 'cover' })
      .webp({ quality: 70 })
      .toFile(outPath);

    fs.unlinkSync(file.path);

    const url = `/uploads/${path.basename(outPath)}`;
    await db.query('UPDATE profiles SET avatar_url=$1 WHERE user_id=$2', [url, req.user.id]);
    res.json({ url });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'upload failed' });
  }
});

router.get('/me', ensureAuth, async (req, res) => {
  const r = await db.query('SELECT p.*, u.email FROM profiles p JOIN users u ON u.id = p.user_id WHERE user_id=$1', [req.user.id]);
  if (!r.rows.length) return res.status(404).json({ error: 'not found' });
  res.json(r.rows[0]);
});

module.exports = router;
