const fs = require('fs');
const path = require('path');

const DATA_DIR = path.join(__dirname, '..', 'data');
const RECORDS_FILE = path.join(DATA_DIR, 'records.json');
const PROPERTY_FILE = path.join(DATA_DIR, 'property.json');

// Simple write queue so two near-simultaneous saves can't corrupt the file.
let writeChain = Promise.resolve();

function readJson(file) {
  const raw = fs.readFileSync(file, 'utf8');
  return raw.trim() ? JSON.parse(raw) : null;
}

function writeJson(file, data) {
  writeChain = writeChain.then(
    () =>
      new Promise((resolve, reject) => {
        fs.writeFile(file, JSON.stringify(data, null, 2), (err) => {
          if (err) reject(err);
          else resolve();
        });
      })
  );
  return writeChain;
}

function getProperty() {
  return readJson(PROPERTY_FILE);
}

function getRecords() {
  return readJson(RECORDS_FILE) || [];
}

function addRecord(record) {
  const records = getRecords();
  records.push(record);
  return writeJson(RECORDS_FILE, records).then(() => record);
}

function getRecordsByCategory(slug) {
  return getRecords().filter((r) => r.category === slug);
}

function getCategoryCounts() {
  const records = getRecords();
  const counts = {};
  for (const r of records) {
    counts[r.category] = (counts[r.category] || 0) + 1;
  }
  return counts;
}

module.exports = {
  getProperty,
  getRecords,
  addRecord,
  getRecordsByCategory,
  getCategoryCounts
};
