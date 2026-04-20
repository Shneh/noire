const express = require('express');
const cors = require('cors');
const path = require('path');
const dotenv = require('dotenv');

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Routes
const authRoutes = require('./routes/auth');
const productRoutes = require('./routes/products');
const aiRoutes = require('./routes/ai');

app.use('/api/auth', authRoutes);
app.use('/api/products', productRoutes);
app.use('/api/ai', aiRoutes);

app.get('/', (req, res) => {
    res.send('Noiré API is running');
});

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
