// Central list of record categories.
// To add a new category: add an entry here, then add a matching icon
// case in views/partials/icon.ejs.
const CATEGORIES = [
  { slug: 'plumbing', label: 'Plumbing', icon: 'plumbing' },
  { slug: 'electrical', label: 'Electrical', icon: 'electrical' },
  { slug: 'renovations', label: 'Renovations', icon: 'renovations' },
  { slug: 'warranties', label: 'Warranties & Certs', icon: 'warranties' },
  { slug: 'general', label: 'General', icon: 'general' }
];

function findCategory(slug) {
  return CATEGORIES.find((c) => c.slug === slug) || null;
}

module.exports = { CATEGORIES, findCategory };
