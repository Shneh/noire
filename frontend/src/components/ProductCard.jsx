import React from 'react';
import { useNavigate } from 'react-router-dom';

function ProductCard({ product }) {
  const navigate = useNavigate();

  return (
    <div className="product-card" onClick={() => navigate(`/product/${product.id}`)} style={{ 
      backgroundColor: 'var(--white)', 
      borderRadius: '8px', 
      overflow: 'hidden',
      transition: 'transform 0.3s ease, box-shadow 0.3s ease',
      cursor: 'pointer',
      position: 'relative'
    }}>
      <div style={{ paddingBottom: '125%', position: 'relative', backgroundColor: '#EDEAE4' }}>
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

      <div style={{ padding: '15px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <h3 style={{ fontSize: '1.1rem', fontWeight: 500 }}>{product.name}</h3>
          <span style={{ fontWeight: 600 }}>${product.price.toFixed(2)}</span>
        </div>
        <p style={{ color: 'var(--text-light)', fontSize: '0.9rem', marginTop: '5px' }}>
          {product.category.toUpperCase()} - {product.genre.toUpperCase()}
        </p>
      </div>

      <style dangerouslySetInnerHTML={{__html: `
        .product-card:hover {
          transform: translateY(-5px);
          box-shadow: 0 10px 20px rgba(0,0,0,0.05);
        }
      `}} />
    </div>
  );
}

export default ProductCard;
