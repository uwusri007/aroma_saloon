const { query } = require('../config/db');
const { success, error } = require('../utils/response');

async function listCategories(req, res) {
  const activeOnly = req.query.active !== 'false';
  let sql = 'SELECT * FROM treatment_categories';
  if (activeOnly) sql += ' WHERE is_active = TRUE';
  sql += ' ORDER BY sort_order, name';

  const categories = await query(sql);
  return success(res, categories);
}

async function getCategory(req, res) {
  const categories = await query('SELECT * FROM treatment_categories WHERE id = ?', [req.params.id]);
  if (!categories.length) return error(res, 'Category not found', 404);
  return success(res, categories[0]);
}

async function listTreatments(req, res) {
  const { category_id, search, active } = req.query;
  let sql = `
    SELECT t.*, tc.name as category_name
    FROM treatments t
    JOIN treatment_categories tc ON t.category_id = tc.id
    WHERE 1=1
  `;
  const params = [];

  if (active !== 'false') {
    sql += ' AND t.is_active = TRUE';
  }
  if (category_id) {
    sql += ' AND t.category_id = ?';
    params.push(category_id);
  }
  if (search) {
    sql += ' AND (t.name LIKE ? OR t.description LIKE ?)';
    params.push(`%${search}%`, `%${search}%`);
  }

  sql += ' ORDER BY tc.sort_order, t.name';
  const treatments = await query(sql, params);
  return success(res, treatments);
}

async function getTreatment(req, res) {
  const treatments = await query(
    `SELECT t.*, tc.name as category_name
     FROM treatments t JOIN treatment_categories tc ON t.category_id = tc.id
     WHERE t.id = ?`,
    [req.params.id]
  );
  if (!treatments.length) return error(res, 'Treatment not found', 404);

  const suggestions = await query(
    `SELECT t2.id, t2.name, t2.price, t2.duration_minutes, t2.image_url
     FROM treatment_suggestions ts
     JOIN treatments t2 ON ts.suggested_treatment_id = t2.id
     WHERE ts.treatment_id = ? AND t2.is_active = TRUE`,
    [req.params.id]
  );

  return success(res, { ...treatments[0], suggestions });
}

async function createCategory(req, res) {
  const { name, description, image_url, sort_order, is_active } = req.body;
  const result = await query(
    `INSERT INTO treatment_categories (name, description, image_url, sort_order, is_active)
     VALUES (?, ?, ?, ?, ?)`,
    [name, description || null, image_url || null, sort_order || 0, is_active !== false]
  );
  const category = await query('SELECT * FROM treatment_categories WHERE id = ?', [result.insertId]);
  return success(res, category[0], 'Category created', 201);
}

async function updateCategory(req, res) {
  const { name, description, image_url, sort_order, is_active } = req.body;
  const existing = await query('SELECT id FROM treatment_categories WHERE id = ?', [req.params.id]);
  if (!existing.length) return error(res, 'Category not found', 404);

  await query(
    `UPDATE treatment_categories SET name = ?, description = ?, image_url = ?, sort_order = ?, is_active = ? WHERE id = ?`,
    [name, description || null, image_url || null, sort_order || 0, is_active !== false, req.params.id]
  );
  const category = await query('SELECT * FROM treatment_categories WHERE id = ?', [req.params.id]);
  return success(res, category[0], 'Category updated');
}

async function deleteCategory(req, res) {
  const treatments = await query('SELECT id FROM treatments WHERE category_id = ? LIMIT 1', [req.params.id]);
  if (treatments.length) {
    return error(res, 'Cannot delete category with existing treatments', 400);
  }
  await query('DELETE FROM treatment_categories WHERE id = ?', [req.params.id]);
  return success(res, null, 'Category deleted');
}

async function createTreatment(req, res) {
  const { category_id, name, description, duration_minutes, price, image_url, is_active } = req.body;
  const result = await query(
    `INSERT INTO treatments (category_id, name, description, duration_minutes, price, image_url, is_active)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [category_id, name, description || null, duration_minutes, price, image_url || null, is_active !== false]
  );
  const treatment = await query('SELECT * FROM treatments WHERE id = ?', [result.insertId]);
  return success(res, treatment[0], 'Treatment created', 201);
}

async function updateTreatment(req, res) {
  const { category_id, name, description, duration_minutes, price, image_url, is_active } = req.body;
  const existing = await query('SELECT id FROM treatments WHERE id = ?', [req.params.id]);
  if (!existing.length) return error(res, 'Treatment not found', 404);

  await query(
    `UPDATE treatments SET category_id = ?, name = ?, description = ?, duration_minutes = ?, price = ?, image_url = ?, is_active = ? WHERE id = ?`,
    [category_id, name, description || null, duration_minutes, price, image_url || null, is_active !== false, req.params.id]
  );
  const treatment = await query('SELECT * FROM treatments WHERE id = ?', [req.params.id]);
  return success(res, treatment[0], 'Treatment updated');
}

async function deleteTreatment(req, res) {
  await query('DELETE FROM treatments WHERE id = ?', [req.params.id]);
  return success(res, null, 'Treatment deleted');
}

module.exports = {
  listCategories,
  getCategory,
  listTreatments,
  getTreatment,
  createCategory,
  updateCategory,
  deleteCategory,
  createTreatment,
  updateTreatment,
  deleteTreatment,
};
