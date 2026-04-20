import React, { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import { AuthContext } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

function RetailerDashboard() {
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();
  const [products, setProducts] = useState([]);
  const [formData, setFormData] = useState({ name: '', description: '', price: '', genre: 'unisex', category: 'clothing', stock: 10, image_url: '' });
  const [editingId, setEditingId] = useState(null);

  useEffect(() => {
    if (!user || (user.role !== 'retailer' && user.role !== 'admin')) {
      navigate('/');
    } else {
      fetchProducts();
    }
  }, [user, navigate]);

  const fetchProducts = async () => {
    try {
      const res = await axios.get(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/products`);
      // If retailer, filter only theirs. If admin, see all.
      // Assuming retailer UI for simplicity just filters visually if the API returns all
      if (user.role === 'retailer') {
        setProducts(res.data.filter(p => p.retailer_id === user.id));
      } else {
        setProducts(res.data);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingId) {
        await axios.put(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/products/${editingId}`, formData);
      } else {
        await axios.post(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/products`, formData);
      }
      setFormData({ name: '', description: '', price: '', genre: 'unisex', category: 'clothing', stock: 10, image_url: '' });
      setEditingId(null);
      fetchProducts();
    } catch (err) {
      alert(err.response?.data?.error || 'Operation failed');
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm("Are you sure you want to delete this product?")) {
      try {
        await axios.delete(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/products/${id}`);
        fetchProducts();
      } catch (err) {
         alert(err.response?.data?.error || 'Delete failed');
      }
    }
  };

  const handleEdit = (product) => {
    setEditingId(product.id);
    setFormData({
      name: product.name,
      description: product.description,
      price: product.price,
      genre: product.genre,
      category: product.category,
      stock: product.stock,
      image_url: product.image_url || ''
    });
  };

  return (
    <div className="container" style={{ marginTop: '40px' }}>
      <h1 style={{ marginBottom: '30px' }}>Retailer Dashboard</h1>

      <div className="grid grid-cols-2">
        <div style={{ backgroundColor: 'var(--white)', padding: '20px', borderRadius: '8px', alignSelf: 'start' }}>
          <h2>{editingId ? 'Edit Product' : 'Add New Product'}</h2>
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '15px', marginTop: '20px' }}>
            <input type="text" placeholder="Product Name" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} required />
            <textarea placeholder="Description" value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} required />
            <input type="number" placeholder="Price" value={formData.price} onChange={e => setFormData({...formData, price: e.target.value})} step="0.01" required />
            <select value={formData.genre} onChange={e => setFormData({...formData, genre: e.target.value})}>
              <option value="men">Men</option>
              <option value="women">Women</option>
              <option value="unisex">Unisex</option>
            </select>
            <select value={formData.category} onChange={e => setFormData({...formData, category: e.target.value})}>
              <option value="clothing">Clothing</option>
              <option value="jewellery">Jewellery</option>
            </select>
            <input type="number" placeholder="Stock" value={formData.stock} onChange={e => setFormData({...formData, stock: e.target.value})} />
            <input type="text" placeholder="Image URL" value={formData.image_url} onChange={e => setFormData({...formData, image_url: e.target.value})} />
            <button type="submit" className="btn-primary" style={{ marginTop: '10px' }}>
              {editingId ? 'Update Product' : 'Create Product'}
            </button>
            {editingId && (
              <button type="button" className="btn-outline" onClick={() => {setEditingId(null); setFormData({ name: '', description: '', price: '', genre: 'unisex', category: 'clothing', stock: 10, image_url: '' })}}>
                Cancel Edit
              </button>
            )}
          </form>
        </div>

        <div>
          <h2>Your Products</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '15px', marginTop: '20px' }}>
            {products.map(p => (
              <div key={p.id} style={{ backgroundColor: 'var(--white)', padding: '15px', borderRadius: '8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <h3 style={{ fontSize: '1.1rem' }}>{p.name}</h3>
                  <p style={{ color: 'var(--text-light)', fontSize: '0.9rem' }}>${p.price} | Stock: {p.stock} | {p.genre}</p>
                </div>
                <div style={{ display: 'flex', gap: '10px' }}>
                  <button onClick={() => handleEdit(p)} className="btn-outline" style={{ padding: '8px 16px', fontSize: '0.8rem' }}>Edit</button>
                  <button onClick={() => handleDelete(p.id)} className="btn-primary" style={{ padding: '8px 16px', fontSize: '0.8rem', backgroundColor: 'var(--danger)' }}>Delete</button>
                </div>
              </div>
            ))}
            {products.length === 0 && <p style={{ color: 'var(--text-light)' }}>No products listed yet.</p>}
          </div>
        </div>
      </div>
    </div>
  );
}

export default RetailerDashboard;
