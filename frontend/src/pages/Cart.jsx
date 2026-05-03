import React, { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { auth, db } from '../firebase';
import { RecaptchaVerifier, signInWithPhoneNumber, linkWithPhoneNumber } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';

function Cart() {
  const [cartItems, setCartItems] = useState([]);
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();

  const [address, setAddress] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [otp, setOtp] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);
  const [isVerified, setIsVerified] = useState(false);
  const [confirmationResult, setConfirmationResult] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const items = JSON.parse(localStorage.getItem('noire_cart') || '[]');
    setCartItems(items);

    if (user && user.phoneNumber) {
      setPhoneNumber(user.phoneNumber);
      setIsVerified(true);
    }
  }, [user]);

  const handleRemove = (index) => {
    const newItems = [...cartItems];
    newItems.splice(index, 1);
    setCartItems(newItems);
    localStorage.setItem('noire_cart', JSON.stringify(newItems));
  };

  const setupRecaptcha = () => {
    if (!window.recaptchaVerifier) {
      window.recaptchaVerifier = new RecaptchaVerifier(auth, 'recaptcha-container', {
        'size': 'invisible'
      });
    }
  };

  const sendOtp = async () => {
    if (!user) return alert("You must be logged in to verify your phone number.");
    if (!phoneNumber) return alert("Please enter a valid phone number.");
    try {
      setupRecaptcha();
      const appVerifier = window.recaptchaVerifier;
      const formattedPhone = phoneNumber.startsWith('+') ? phoneNumber : `+91${phoneNumber}`; // Default to India if no country code
      
      const confResult = await linkWithPhoneNumber(auth.currentUser, formattedPhone, appVerifier);
      setConfirmationResult(confResult);
      setIsVerifying(true);
      alert("OTP Sent!");
    } catch (error) {
      console.error(error);
      alert(`Failed to send OTP: ${error.message}`);
    }
  };

  const verifyOtp = async () => {
    try {
      await confirmationResult.confirm(otp);
      setIsVerified(true);
      setIsVerifying(false);
      alert("Phone number verified successfully!");
    } catch (error) {
      console.error(error);
      alert("Invalid OTP.");
    }
  };

  const getRetailerEmails = async () => {
    const retailerIds = [...new Set(cartItems.map(item => item.retailer_id).filter(id => id))];
    const emails = [];
    for (const id of retailerIds) {
      const docRef = await getDoc(doc(db, 'users', id));
      if (docRef.exists() && docRef.data().email) {
        emails.push(docRef.data().email);
      }
    }
    return emails;
  };

  const handleCheckout = async () => {
    if (!user) {
      alert("You need to login to checkout.");
      navigate('/login?redirect=cart');
      return;
    }
    if (!isVerified) {
      return alert("Please verify your phone number first.");
    }
    if (!address) {
      return alert("Please provide a delivery address.");
    }

    setLoading(true);
    try {
      const retailerEmails = await getRetailerEmails();
      
      const payload = {
        cartItems,
        user,
        address,
        phone: phoneNumber,
        retailerEmails
      };

      const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/checkout`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const result = await response.json();
      if (!response.ok) throw new Error(result.error || 'Checkout failed');

      alert(`Checkout successful! An email confirmation has been sent.`);
      setCartItems([]);
      localStorage.removeItem('noire_cart');
      navigate('/');
    } catch (err) {
      console.error(err);
      alert("Order placed, but email notification might have failed. Please contact admin.");
    }
    setLoading(false);
  };

  const total = cartItems.reduce((sum, item) => sum + item.price, 0);

  return (
    <div className="container" style={{ maxWidth: '800px', marginTop: '40px', marginBottom: '80px' }}>
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
                  {item.media && item.media.length > 0 ? (
                    <img src={item.media[0].url} alt={item.name} style={{ width: '80px', height: '100px', objectFit: 'cover', borderRadius: '4px' }}/>
                  ) : item.image_url ? (
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
                  <span style={{ fontWeight: 600 }}>₹{item.price.toFixed(2)}</span>
                  <button onClick={() => handleRemove(idx)} style={{ color: 'var(--danger)', fontSize: '0.9rem', textDecoration: 'underline' }}>Remove</button>
                </div>
              </li>
            ))}
          </ul>
          
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '30px', paddingTop: '20px', borderTop: '2px solid var(--primary)' }}>
            <span style={{ fontSize: '1.2rem', fontWeight: 600 }}>TOTAL</span>
            <span style={{ fontSize: '1.5rem', fontWeight: 600 }}>₹{total.toFixed(2)}</span>
          </div>

          <div style={{ marginTop: '40px', paddingTop: '20px', borderTop: '1px solid var(--accent)' }}>
            <h3 style={{ marginBottom: '20px' }}>Delivery Details</h3>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
              <textarea 
                placeholder="Full Delivery Address" 
                value={address} 
                onChange={(e) => setAddress(e.target.value)} 
                style={{ padding: '15px', borderRadius: '4px', border: '1px solid var(--accent)', resize: 'vertical' }}
                required
              />

              <div style={{ display: 'flex', gap: '10px' }}>
                <input 
                  type="text" 
                  placeholder="Phone Number (e.g. +919876543210)" 
                  value={phoneNumber} 
                  onChange={(e) => setPhoneNumber(e.target.value)} 
                  style={{ padding: '15px', borderRadius: '4px', border: '1px solid var(--accent)', flex: 1 }}
                  disabled={isVerified}
                />
                {!isVerified && !isVerifying && (
                  <button onClick={sendOtp} className="btn-outline" style={{ padding: '0 20px' }}>Verify</button>
                )}
                {isVerified && <span style={{ padding: '15px', color: 'green', fontWeight: 'bold' }}>✓ Verified</span>}
              </div>

              {isVerifying && !isVerified && (
                <div style={{ display: 'flex', gap: '10px' }}>
                  <input 
                    type="text" 
                    placeholder="Enter OTP" 
                    value={otp} 
                    onChange={(e) => setOtp(e.target.value)} 
                    style={{ padding: '15px', borderRadius: '4px', border: '1px solid var(--accent)', flex: 1 }}
                  />
                  <button onClick={verifyOtp} className="btn-outline" style={{ padding: '0 20px' }}>Confirm OTP</button>
                </div>
              )}
              
              <div id="recaptcha-container"></div>
            </div>
          </div>

          <button 
            onClick={handleCheckout} 
            className="btn-primary" 
            style={{ width: '100%', marginTop: '30px', padding: '15px' }}
            disabled={loading}
          >
            {loading ? 'Processing...' : (user ? 'PLACE ORDER SECURELY' : 'LOGIN TO CHECKOUT')}
          </button>
        </div>
      )}
    </div>
  );
}

export default Cart;
