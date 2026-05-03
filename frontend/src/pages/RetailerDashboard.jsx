import React, { useState, useEffect, useContext } from 'react';
import { db, storage } from '../firebase';
import { collection, getDocs, addDoc, updateDoc, deleteDoc, doc, serverTimestamp } from 'firebase/firestore';
import { ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage';
import { AuthContext } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import imageCompression from 'browser-image-compression';

function RetailerDashboard() {
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();
  const [products, setProducts] = useState([]);
  const [formData, setFormData] = useState({ name: '', description: '', price: '', genre: 'unisex', category: 'clothing', stock: 10 });
  const [editingId, setEditingId] = useState(null);
  
  const [mediaFiles, setMediaFiles] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState('');

  useEffect(() => {
    if (!user || (user.role !== 'retailer' && user.role !== 'admin')) {
      navigate('/');
    } else {
      fetchProducts();
    }
  }, [user, navigate]);

  const fetchProducts = async () => {
    try {
      const snapshot = await getDocs(collection(db, 'products'));
      const allProds = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
      
      if (user.role === 'retailer') {
        setProducts(allProds.filter(p => p.retailer_id === user.id));
      } else {
        setProducts(allProds);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const uploadMedia = async () => {
    const formDataObj = new FormData();
    for (let i = 0; i < mediaFiles.length; i++) {
      const file = mediaFiles[i];
      setUploadProgress(`Preparing file ${i + 1} of ${mediaFiles.length}...`);
      // Use the raw file from the input to bypass any browser compression bugs
      formDataObj.append('media', file, file.name || `media_${Date.now()}`);
    }

    setUploadProgress('Uploading to secure server (this may take a moment)...');
    
    const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/upload`, {
      method: 'POST',
      body: formDataObj,
    });

    if (!response.ok) {
      throw new Error('Failed to upload media to backend server.');
    }

    const data = await response.json();
    return data.urls;
  };

  const logHistory = async (productId, data) => {
    try {
      await addDoc(collection(db, 'product_history'), {
        product_id: productId,
        ...data,
        changed_at: serverTimestamp()
      });
    } catch (err) {}
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setUploading(true);
    setUploadProgress('Starting upload...');
    try {
      const uploadedMedia = mediaFiles.length > 0 ? await uploadMedia() : null;
      setUploadProgress('Saving product details...');
      const payload = { 
        ...formData, 
        price: parseFloat(formData.price),
        stock: parseInt(formData.stock)
      };

      if (uploadedMedia) {
        payload.media = uploadedMedia;
      }

      if (editingId) {
        await updateDoc(doc(db, 'products', editingId), payload);
        await logHistory(editingId, payload);
      } else {
        payload.retailer_id = user.id;
        payload.media = payload.media || []; // ensure it has array if no files uploaded
        const docRef = await addDoc(collection(db, 'products'), payload);
        await logHistory(docRef.id, payload);
      }
      
      setFormData({ name: '', description: '', price: '', genre: 'unisex', category: 'clothing', stock: 10 });
      setMediaFiles([]);
      e.target.reset(); // reset file input visually
      setEditingId(null);
      fetchProducts();
    } catch (err) {
      console.error(err);
      alert(err.message || 'Operation failed');
    }
    setUploading(false);
    setUploadProgress('');
  };

  const handleDelete = async (id, data) => {
    if (window.confirm("Are you sure you want to delete this product?")) {
      try {
        await deleteDoc(doc(db, 'products', id));
        await logHistory(id, { ...data, deleted: true });
        fetchProducts();
      } catch (err) {
         alert(err.message || 'Delete failed');
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
      stock: product.stock
    });
    setMediaFiles([]);
  };

  return (
    <div className="container" style={{ marginTop: '40px' }}>
      <h1 style={{ marginBottom: '30px' }}>Retailer Dashboard</h1>

      <div className="grid grid-cols-2">
        <div style={{ backgroundColor: 'var(--white)', padding: '20px', borderRadius: '8px', alignSelf: 'start' }}>
          <h2>{editingId ? 'Edit Product' : 'Add New Product'}</h2>
          
          <form id="product-form" onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '15px', marginTop: '20px' }}>
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
            
            <div style={{ border: '1px dashed var(--accent)', padding: '15px', borderRadius: '4px' }}>
              <label style={{ display: 'block', marginBottom: '10px', fontSize: '0.9rem', color: 'var(--text-light)' }}>
                Upload multiple images & videos (optional if editing):
              </label>
              <input 
                type="file" 
                multiple 
                accept="image/*,video/*" 
                onChange={(e) => setMediaFiles(Array.from(e.target.files))} 
              />
              {mediaFiles.length > 0 && <p style={{ fontSize: '0.8rem', marginTop: '5px' }}>{mediaFiles.length} file(s) selected.</p>}
            </div>

            <button type="submit" className="btn-primary" style={{ marginTop: '10px' }} disabled={uploading}>
              {uploading ? (uploadProgress || 'Processing...') : (editingId ? 'Update Product' : 'Create Product')}
            </button>
            {editingId && (
              <button type="button" className="btn-outline" onClick={() => {setEditingId(null); setFormData({ name: '', description: '', price: '', genre: 'unisex', category: 'clothing', stock: 10 }); setMediaFiles([]); document.getElementById('product-form').reset();}}>
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
                  <p style={{ color: 'var(--text-light)', fontSize: '0.9rem' }}>₹{p.price} | Stock: {p.stock} | Media files: {p.media?.length || (p.image_url ? 1 : 0)}</p>
                </div>
                <div style={{ display: 'flex', gap: '10px' }}>
                  <button onClick={() => handleEdit(p)} className="btn-outline" style={{ padding: '8px 16px', fontSize: '0.8rem' }}>Edit</button>
                  <button onClick={() => handleDelete(p.id, p)} className="btn-primary" style={{ padding: '8px 16px', fontSize: '0.8rem', backgroundColor: 'var(--danger)' }}>Delete</button>
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
