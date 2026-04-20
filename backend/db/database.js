const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.resolve(__dirname, 'noire.db');

const db = new sqlite3.Database(dbPath, (err) => {
    if (err) {
        console.error('Error opening database', err.message);
    } else {
        console.log('Connected to the SQLite database.');
        
        db.serialize(() => {
            // Users table: role can be 'customer', 'retailer', 'admin'
            db.run(`CREATE TABLE IF NOT EXISTS users (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT NOT NULL,
                email TEXT UNIQUE NOT NULL,
                password TEXT,
                google_id TEXT,
                role TEXT DEFAULT 'customer'
            )`);
            
            // Products table
            db.run(`CREATE TABLE IF NOT EXISTS products (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT NOT NULL,
                description TEXT,
                price REAL NOT NULL,
                genre TEXT NOT NULL, -- 'men', 'women', 'unisex'
                category TEXT NOT NULL, -- 'jewellery', 'clothing'
                stock INTEGER DEFAULT 0,
                retailer_id INTEGER,
                image_url TEXT,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (retailer_id) REFERENCES users(id)
            )`);

            // Product history for timestamps/rollback
            db.run(`CREATE TABLE IF NOT EXISTS product_history (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                product_id INTEGER,
                name TEXT,
                description TEXT,
                price REAL,
                genre TEXT,
                category TEXT,
                stock INTEGER,
                image_url TEXT,
                changed_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (product_id) REFERENCES products(id)
            )`);

            // Product history trigger (ON UPDATE)
            db.run(`
                CREATE TRIGGER IF NOT EXISTS product_update_history
                AFTER UPDATE ON products
                BEGIN
                    INSERT INTO product_history (product_id, name, description, price, genre, category, stock, image_url, changed_at)
                    VALUES (OLD.id, OLD.name, OLD.description, OLD.price, OLD.genre, OLD.category, OLD.stock, OLD.image_url, CURRENT_TIMESTAMP);
                END;
            `);
            
            // Product history trigger (ON DELETE)
            db.run(`
                CREATE TRIGGER IF NOT EXISTS product_delete_history
                AFTER DELETE ON products
                BEGIN
                    INSERT INTO product_history (product_id, name, description, price, genre, category, stock, image_url, changed_at)
                    VALUES (OLD.id, OLD.name, OLD.description, OLD.price, OLD.genre, OLD.category, OLD.stock, OLD.image_url, CURRENT_TIMESTAMP);
                END;
            `);

            // Orders table
            db.run(`CREATE TABLE IF NOT EXISTS orders (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id INTEGER,
                total REAL NOT NULL,
                status TEXT DEFAULT 'pending',
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (user_id) REFERENCES users(id)
            )`);
        });
    }
});

module.exports = db;
