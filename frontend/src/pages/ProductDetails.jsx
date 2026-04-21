import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { db } from '../firebase';
import { doc, getDoc, collection, query, where, limit, getDocs } from 'firebase/firestore';
import ProductCard from '../components/ProductCard';

function ProductDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [product, setProduct] = useState(null);
  const [suggested, setSuggested] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchProduct();
    window.scrollTo(0, 0);
  }, [id]);

  const fetchProduct = async () => {
    setLoading(true);
    try {
      const docRef = await getDoc(doc(db, 'products', id));
      if (!docRef.exists()) {
        navigate('/');
        return;
      }
      const data = { id: docRef.id, ...docRef.data() };
      setProduct(data);
      
      // Fetch suggested (same category, excluding current)
      const q = query(collection(db, 'products'), where('category', '==', data.category), limit(5));
      const snap = await getDocs(q);
      const suggestions = snap.docs
          .map(d => ({ id: d.id, ...d.data() }))
          .filter(p => p.id !== id)
          .slice(0, 4); // Show up to 4
      
      setSuggested(suggestions);
    } catch (err) {
      console.error(err);
    }
    setLoading(false);
  };

  const handleAddToCart = () => {
    const currentCart = JSON.parse(localStorage.getItem('noire_cart') || '[]');
    currentCart.push(product);
    localStorage.setItem('noire_cart', JSON.stringify(currentCart));
    alert(`${product.name} added to cart!`);
  };

  if (loading) return <div style={{ textAlign: 'center', padding: '60px' }}>Loading...</div>;
  if (!product) return null;

  return (
    <div className="container" style={{ paddingTop: '40px' }}>
      <div className="grid" style={{ gridTemplateColumns: '1fr 1fr', gap: '40px', marginBottom: '80px' }}>
        
        {/* Left: Image */}
        <div style={{ backgroundColor: '#EDEAE4', paddingBottom: '125%', position: 'relative', borderRadius: '8px', overflow: 'hidden' }}>
          {product.image_url ? (
            <img 
              src={product.image_url} 
              alt={product.name} 
              style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', objectFit: 'cover' }}
            />
          ) : (
            <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', color: 'var(--text-light)' }}>
              No Image
            </div>
          )}
        </div>

        {/* Right: Details */}
        <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
          <p style={{ color: 'var(--text-light)', textTransform: 'uppercase', fontSize: '0.9rem', letterSpacing: '2px', marginBottom: '10px' }}>
            {product.genre} • {product.category}
          </p>
          <h1 style={{ fontSize: '2.5rem', fontWeight: 300, marginBottom: '20px' }}>{product.name}</h1>
          <p style={{ fontSize: '1.5rem', fontWeight: 500, marginBottom: '30px' }}>${product.price.toFixed(2)}</p>
          
          <div style={{ color: 'var(--text-light)', lineHeight: '1.8', marginBottom: '40px' }}>
            {product.description}
          </div>

          <div style={{ marginBottom: '20px' }}>
             <p style={{ fontSize: '0.9rem', color: product.stock > 0 ? 'var(--text-dark)' : 'var(--danger)' }}>
               {product.stock > 0 ? `${product.stock} in stock` : 'Out of stock'}
             </p>
          </div>

          <button 
            className="btn-primary" 
            style={{ padding: '15px 40px', fontSize: '1.1rem', letterSpacing: '1px' }}
            onClick={handleAddToCart}
            disabled={product.stock <= 0}
          >
            {product.stock > 0 ? 'ADD TO CART' : 'SOLD OUT'}
          </button>
        </div>

      </div>

      {suggested.length > 0 && (
        <div style={{ borderTop: '1px solid var(--accent)', paddingTop: '60px', paddingBottom: '40px' }}>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 400, textAlign: 'center', marginBottom: '40px', letterSpacing: '2px' }}>
            YOU MIGHT ALSO LIKE
          </h2>
          <div className="grid grid-cols-4">
            {suggested.map(p => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default ProductDetails;
