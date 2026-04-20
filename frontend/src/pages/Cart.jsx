import React, { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

function Cart() {
  const [cartItems, setCartItems] = useState([]);
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();

  useEffect(() => {
    const items = JSON.parse(localStorage.getItem('noire_cart') || '[]');
    setCartItems(items);
  }, []);

  const handleRemove = (index) => {
    const newItems = [...cartItems];
    newItems.splice(index, 1);
    setCartItems(newItems);
    localStorage.setItem('noire_cart', JSON.stringify(newItems));
  };

  const handleCheckout = () => {
    if (!user) {
      alert("You need to login to checkout.");
      navigate('/login?redirect=cart');
      return;
    }
    // Mock checkout process
    alert(`Checkout successful for ${user.name}! Total: $${total.toFixed(2)}`);
    setCartItems([]);
    localStorage.removeItem('noire_cart');
    navigate('/');
  };

  const total = cartItems.reduce((sum, item) => sum + item.price, 0);

  return (
    <div className="container" style={{ maxWidth: '800px', marginTop: '40px' }}>
      <h1 style={{ marginBottom: '30px', fontWeight: 400, letterSpacing: '1px' }}>YOUR CART</h1>
      
      {cartItems.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '40px', backgroundColor: 'var(--white)', borderRadius: '8px' }}>
          <p>Your cart is empty.</p>
        </div>
      ) : (
        <div style={{ backgroundColor: 'var(--white)', padding: '30px', borderRadius: '8px' }}>
          <ul style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            {cartItems.map((item, idx) => (
              <li key={idx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--accent)', paddingBottom: '20px' }}>
                <div style={{ display: 'flex', gap: '20px', alignItems: 'center' }}>
                  {item.image_url ? (
                    <img src={item.image_url} alt={item.name} style={{ width: '80px', height: '100px', objectFit: 'cover', borderRadius: '4px' }}/>
                  ) : (
                    <div style={{ width: '80px', height: '100px', backgroundColor: 'var(--secondary)', borderRadius: '4px' }}></div>
                  )}
                  <div>
                    <h3 style={{ fontSize: '1.1rem' }}>{item.name}</h3>
                    <p style={{ color: 'var(--text-light)', fontSize: '0.9rem' }}>{item.category}</p>
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '30px' }}>
                  <span style={{ fontWeight: 600 }}>${item.price.toFixed(2)}</span>
                  <button onClick={() => handleRemove(idx)} style={{ color: 'var(--danger)', fontSize: '0.9rem', textDecoration: 'underline' }}>Remove</button>
                </div>
              </li>
            ))}
          </ul>
          
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '30px', paddingTop: '20px', borderTop: '2px solid var(--primary)' }}>
            <span style={{ fontSize: '1.2rem', fontWeight: 600 }}>TOTAL</span>
            <span style={{ fontSize: '1.5rem', fontWeight: 600 }}>${total.toFixed(2)}</span>
          </div>

          <button onClick={handleCheckout} className="btn-primary" style={{ width: '100%', marginTop: '30px', padding: '15px' }}>
            {user ? 'CHECKOUT SECURELY' : 'LOGIN TO CHECKOUT'}
          </button>
        </div>
      )}
    </div>
  );
}

export default Cart;
