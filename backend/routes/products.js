const express = require('express');
const router = express.Router();
const db = require('../db/database');
const { authenticateToken, restrictTo } = require('../middleware/auth');

// Get all products (Public)
router.get('/', (req, res) => {
    db.all('SELECT * FROM products', [], (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(rows);
    });
});

// Get a single product (Public)
router.get('/:id', (req, res) => {
    db.get('SELECT * FROM products WHERE id = ?', [req.params.id], (err, row) => {
        if (err) return res.status(500).json({ error: err.message });
        if (!row) return res.status(404).json({ error: 'Product not found' });
        res.json(row);
    });
});

// Get product history (Admin only)
router.get('/:id/history', authenticateToken, restrictTo('admin'), (req, res) => {
    db.all('SELECT * FROM product_history WHERE product_id = ? ORDER BY changed_at DESC', [req.params.id], (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(rows);
    });
});

// Create product (Retailer, Admin)
router.post('/', authenticateToken, restrictTo('retailer', 'admin'), (req, res) => {
    const { name, description, price, genre, category, stock, image_url } = req.body;
    const retailer_id = req.user.id;

    db.run(
        'INSERT INTO products (name, description, price, genre, category, stock, retailer_id, image_url) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
        [name, description, price, genre, category, stock || 0, retailer_id, image_url],
        function(err) {
            if (err) return res.status(500).json({ error: err.message });
            res.status(201).json({ id: this.lastID, name, description, price, genre, category, stock, retailer_id, image_url });
        }
    );
});

// Update product (Retailer only their own, Admin can update any)
router.put('/:id', authenticateToken, restrictTo('retailer', 'admin'), (req, res) => {
    const { name, description, price, genre, category, stock, image_url } = req.body;
    
    // Check if retailer owns it
    db.get('SELECT retailer_id FROM products WHERE id = ?', [req.params.id], (err, row) => {
        if (err) return res.status(500).json({ error: err.message });
        if (!row) return res.status(404).json({ error: 'Product not found' });

        if (req.user.role === 'retailer' && row.retailer_id !== req.user.id) {
            return res.status(403).json({ error: 'Unauthorized to edit this product' });
        }

        db.run(
            'UPDATE products SET name = ?, description = ?, price = ?, genre = ?, category = ?, stock = ?, image_url = ? WHERE id = ?',
            [name, description, price, genre, category, stock, image_url, req.params.id],
            function(err) {
                if (err) return res.status(500).json({ error: err.message });
                res.json({ message: 'Product updated successfully' });
            }
        );
    });
});

// Delete product (Retailer only their own, Admin can delete any)
router.delete('/:id', authenticateToken, restrictTo('retailer', 'admin'), (req, res) => {
    db.get('SELECT retailer_id FROM products WHERE id = ?', [req.params.id], (err, row) => {
        if (err) return res.status(500).json({ error: err.message });
        if (!row) return res.status(404).json({ error: 'Product not found' });

        if (req.user.role === 'retailer' && row.retailer_id !== req.user.id) {
            return res.status(403).json({ error: 'Unauthorized to delete this product' });
        }

        db.run('DELETE FROM products WHERE id = ?', [req.params.id], function(err) {
            if (err) return res.status(500).json({ error: err.message });
            res.json({ message: 'Product deleted successfully' });
        });
    });
});

module.exports = router;
