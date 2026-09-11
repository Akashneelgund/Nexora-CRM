import { Request, Response } from 'express';
import db from '../config/db.js';
import { logAudit } from '../middleware/auth.js';

export async function listProducts(req: Request, res: Response): Promise<void> {
  const { category_id, warehouse_id, low_stock_only, search } = req.query;

  let query = `
    SELECT p.*,
           c.name as category_name,
           w.name as warehouse_name,
           s.name as supplier_name,
           (p.stock <= p.min_stock) as is_low_stock,
           (p.stock = 0) as is_out_of_stock
    FROM products p
    LEFT JOIN categories c ON p.category_id = c.id
    LEFT JOIN warehouses w ON p.warehouse_id = w.id
    LEFT JOIN suppliers s ON p.supplier_id = s.id
    WHERE 1=1
  `;
  const params: any[] = [];

  if (low_stock_only === 'true') {
    query += ' AND p.stock <= p.min_stock';
  }
  if (category_id && category_id !== 'all') {
    query += ' AND p.category_id = ?';
    params.push(category_id);
  }
  if (warehouse_id && warehouse_id !== 'all') {
    query += ' AND p.warehouse_id = ?';
    params.push(warehouse_id);
  }
  if (search) {
    query += ' AND (p.name LIKE ? OR p.sku LIKE ?)';
    const s = `%${search}%`;
    params.push(s, s);
  }

  query += ' ORDER BY is_low_stock DESC, p.stock ASC';

  const products = db.all<any>(query, params);

  const summary = db.get<any>(`
    SELECT
      COUNT(id) as total_products,
      SUM(stock) as total_units,
      SUM(stock * price) as total_valuation,
      SUM(CASE WHEN stock <= min_stock AND stock > 0 THEN 1 ELSE 0 END) as low_stock_count,
      SUM(CASE WHEN stock = 0 THEN 1 ELSE 0 END) as out_of_stock_count
    FROM products
  `);

  res.json({ success: true, summary, products });
}

export async function adjustStock(req: Request, res: Response): Promise<void> {
  const user = req.user!;
  const { product_id, quantity_change, movement_type = 'Adjustment', reason } = req.body;

  if (!product_id || quantity_change === undefined) {
    res.status(400).json({ success: false, message: 'Product ID and quantity change required' });
    return;
  }

  const prod = db.get<any>('SELECT * FROM products WHERE id = ?', [product_id]);
  if (!prod) {
    res.status(404).json({ success: false, message: 'Product not found' });
    return;
  }

  const change = Number(quantity_change);
  const previousStock = prod.stock;
  const newStock = Math.max(previousStock + change, 0);

  const movId = `mov-${Date.now()}-${Math.random().toString(36).substring(7)}`;

  db.transaction(() => {
    db.run('UPDATE products SET stock = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?', [newStock, product_id]);

    db.run(
      `INSERT INTO stock_movements (id, product_id, warehouse_id, movement_type, quantity_change, previous_stock, new_stock, reason, user_id)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [movId, product_id, prod.warehouse_id, movement_type, change, previousStock, newStock, reason || 'Manual stock adjustment', user.id]
    );
  });

  logAudit(user.id, 'ADJUST_STOCK', 'products', product_id, { previousStock }, { newStock, change, reason }, req.ip);

  res.json({
    success: true,
    message: 'Stock updated successfully!',
    product: {
      id: prod.id,
      name: prod.name,
      previousStock,
      newStock,
      minStock: prod.min_stock
    }
  });
}

export async function transferStock(req: Request, res: Response): Promise<void> {
  const user = req.user!;
  const { product_id, from_warehouse_id, to_warehouse_id, quantity, notes } = req.body;

  if (!product_id || !from_warehouse_id || !to_warehouse_id || !quantity) {
    res.status(400).json({ success: false, message: 'Missing required transfer fields' });
    return;
  }

  const prod = db.get<any>('SELECT * FROM products WHERE id = ?', [product_id]);
  if (!prod || prod.stock < Number(quantity)) {
    res.status(400).json({ success: false, message: 'Insufficient stock for transfer' });
    return;
  }

  const transferCode = `TRF-2026-${Date.now().toString().slice(-6)}`;
  const trfId = `trf-${Date.now()}-${Math.random().toString(36).substring(7)}`;

  db.run(
    `INSERT INTO stock_transfers (id, transfer_code, from_warehouse_id, to_warehouse_id, product_id, quantity, status, notes, user_id)
     VALUES (?, ?, ?, ?, ?, ?, 'Completed', ?, ?)`,
    [trfId, transferCode, from_warehouse_id, to_warehouse_id, product_id, Number(quantity), notes || 'Inter-warehouse transfer', user.id]
  );

  db.run('UPDATE products SET warehouse_id = ? WHERE id = ?', [to_warehouse_id, product_id]);

  res.json({ success: true, message: 'Stock transfer recorded successfully', transferCode });
}

export async function listWarehouses(req: Request, res: Response): Promise<void> {
  const warehouses = db.all<any>('SELECT * FROM warehouses ORDER BY name ASC');
  const suppliers = db.all<any>('SELECT * FROM suppliers ORDER BY name ASC');
  const categories = db.all<any>('SELECT * FROM categories ORDER BY name ASC');
  const movements = db.all<any>(`
    SELECT sm.*, p.name as product_name, p.sku, u.name as user_name
    FROM stock_movements sm
    JOIN products p ON sm.product_id = p.id
    LEFT JOIN users u ON sm.user_id = u.id
    ORDER BY sm.created_at DESC
    LIMIT 50
  `);

  res.json({ success: true, warehouses, suppliers, categories, movements });
}
