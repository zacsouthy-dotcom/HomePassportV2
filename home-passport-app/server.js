const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const archiver = require('archiver');
const { v4: uuidv4 } = require('uuid');

const { CATEGORIES, findCategory } = require('./lib/categories');
const store = require('./lib/store');

const app = express();
const PORT = process.env.PORT || 3000;
const UPLOADS_DIR = path.join(__dirname, 'data', 'uploads');

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.use(express.static(path.join(__dirname, 'public')));
app.use('/uploads', express.static(UPLOADS_DIR));

// ---- File uploads -------------------------------------------------------

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, UPLOADS_DIR),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname) || '';
    cb(null, `${uuidv4()}${ext}`);
  }
});
const upload = multer({
  storage,
  limits: { fileSize: 20 * 1024 * 1024 } // 20MB, matches the design copy
});

// ---- Routes ---------------------------------------------------------------

// Property overview — what the NFC tag opens
app.get('/', (req, res) => {
  const property = store.getProperty();
  const counts = store.getCategoryCounts();
  const totalRecords = store.getRecords().length;
  const ageYears = new Date().getFullYear() - property.builtYear;

  const categories = CATEGORIES.map((c) => ({
    ...c,
    count: counts[c.slug] || 0
  }));

  res.render('home', { property, categories, totalRecords, ageYears });
});

// One category's record list
app.get('/category/:slug', (req, res) => {
  const category = findCategory(req.params.slug);
  if (!category) return res.status(404).send('Category not found');

  const property = store.getProperty();
  const records = store
    .getRecordsByCategory(category.slug)
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

  res.render('category', { property, category, records });
});

// Add-record form
app.get('/add', (req, res) => {
  const requestedSlug = req.query.category;
  const selected = findCategory(requestedSlug) || CATEGORIES[0];
  res.render('add', { categories: CATEGORIES, selected });
});

// Handle the add-record submission (photo/doc + optional voice note)
app.post(
  '/records',
  upload.fields([
    { name: 'photo', maxCount: 1 },
    { name: 'voiceNote', maxCount: 1 }
  ]),
  async (req, res) => {
    try {
      const { category, title, notes } = req.body;
      const cat = findCategory(category);
      if (!cat) return res.status(400).send('Unknown category');
      if (!title || !title.trim()) return res.status(400).send('Title is required');

      const photoFile = req.files.photo && req.files.photo[0];
      const voiceFile = req.files.voiceNote && req.files.voiceNote[0];

      const record = {
        id: uuidv4(),
        category: cat.slug,
        title: title.trim(),
        notes: (notes || '').trim(),
        photoPath: photoFile ? `/uploads/${photoFile.filename}` : null,
        photoIsPdf: photoFile ? photoFile.mimetype === 'application/pdf' : false,
        voiceNotePath: voiceFile ? `/uploads/${voiceFile.filename}` : null,
        createdAt: new Date().toISOString()
      };

      await store.addRecord(record);
      res.redirect(`/category/${cat.slug}`);
    } catch (err) {
      console.error('Failed to save record:', err);
      res.status(500).send('Something went wrong saving that record.');
    }
  }
);

// Share screen — just the public link + copy button
app.get('/share', (req, res) => {
  const property = store.getProperty();
  res.render('share', { property, url: `${req.protocol}://${req.get('host')}/` });
});

// Zip export: every uploaded file plus a JSON summary of all records
app.get('/export', (req, res) => {
  const property = store.getProperty();
  const records = store.getRecords();

  res.attachment('home-passport-export.zip');
  const archive = archiver('zip', { zlib: { level: 9 } });
  archive.on('error', (err) => {
    console.error('Export failed:', err);
    res.status(500).end();
  });
  archive.pipe(res);

  archive.append(JSON.stringify({ property, records }, null, 2), {
    name: 'records.json'
  });

  if (fs.existsSync(UPLOADS_DIR)) {
    archive.directory(UPLOADS_DIR, 'files', (entry) => {
      // skip the placeholder file
      return entry.name.endsWith('.gitkeep') ? false : entry;
    });
  }

  archive.finalize();
});

app.listen(PORT, () => {
  console.log(`Home Passport running on http://localhost:${PORT}`);
});
