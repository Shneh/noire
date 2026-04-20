const express = require('express');
const router = express.Router();
const db = require('../db/database');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { JWT_SECRET } = require('../middleware/auth');

// Helper function to query DB in Promise format
const dbGet = (sql, params) => new Promise((resolve, reject) => db.get(sql, params, (err, row) => err ? reject(err) : resolve(row)));

router.post('/register', async (req, res) => {
    try {
        const { name, email, password, role } = req.body;
        // Basic validation
        if (!name || !email || !password) return res.status(400).json({ error: 'Name, email, and password required' });
        
        // Ensure only 'customer', 'retailer', or 'admin' roles can be defined
        const validRole = ['customer', 'retailer', 'admin'].includes(role) ? role : 'customer';

        const existingUser = await dbGet('SELECT * FROM users WHERE email = ?', [email]);
        if (existingUser) return res.status(400).json({ error: 'Email already exists' });

        const hashedPassword = await bcrypt.hash(password, 10);

        db.run('INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, ?)', [name, email, hashedPassword, validRole], function(err) {
            if (err) return res.status(500).json({ error: 'Failed to create user' });
            
            const token = jwt.sign({ id: this.lastID, email, role: validRole }, JWT_SECRET, { expiresIn: '24h' });
            res.status(201).json({ user: { id: this.lastID, name, email, role: validRole }, token });
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        
        const user = await dbGet('SELECT * FROM users WHERE email = ?', [email]);
        if (!user) return res.status(404).json({ error: 'User not found' });
        
        const match = await bcrypt.compare(password, user.password);
        if (!match) return res.status(401).json({ error: 'Invalid credentials' });

        const token = jwt.sign({ id: user.id, email: user.email, role: user.role }, JWT_SECRET, { expiresIn: '24h' });
        res.json({ user: { id: user.id, name: user.name, email: user.email, role: user.role }, token });
        
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
