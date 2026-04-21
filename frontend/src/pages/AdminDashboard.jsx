import React, { useEffect, useContext, useState } from 'react';
import { AuthContext } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { db } from '../firebase';
import { collection, query, where, getDocs, doc, setDoc, deleteDoc } from 'firebase/firestore';
import { initializeApp } from 'firebase/app';
import { getAuth, createUserWithEmailAndPassword, deleteUser } from 'firebase/auth';

// Secondary Firebase App for creating retailers without logging out the Admin
const secondaryApp = initializeApp({
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
}, "Secondary");
const secondaryAuth = getAuth(secondaryApp);

function AdminDashboard() {
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();
  const [history, setHistory] = useState([]);
  const [productIdToCheck, setProductIdToCheck] = useState('');
  
  const [retailers, setRetailers] = useState([]);
  const [newRetailer, setNewRetailer] = useState({ name: '', email: '', password: '' });
  const [retailerError, setRetailerError] = useState('');

  useEffect(() => {
    if (!user || user.role !== 'admin') navigate('/');
    else fetchRetailers();
  }, [user, navigate]);

  const viewHistory = async () => {
    if (!productIdToCheck) return;
    try {
      const q = query(collection(db, 'product_history'), where('product_id', '==', productIdToCheck));
      const snapshot = await getDocs(q);
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      data.sort((a, b) => b.changed_at?.toMillis() - a.changed_at?.toMillis());
      setHistory(data);
    } catch (err) {
      alert('Could not fetch history: ' + err.message);
    }
  };

  const fetchRetailers = async () => {
    try {
      const q = query(collection(db, 'users'), where('role', '==', 'retailer'));
      const snapshot = await getDocs(q);
      setRetailers(snapshot.docs.map(d => ({ id: d.id, ...d.data() })));
    } catch (err) {
      console.error(err);
    }
  };

  const handleCreateRetailer = async (e) => {
    e.preventDefault();
    setRetailerError('');
    try {
      const cred = await createUserWithEmailAndPassword(secondaryAuth, newRetailer.email, newRetailer.password);
      await setDoc(doc(db, 'users', cred.user.uid), {
        name: newRetailer.name,
        email: newRetailer.email,
        role: 'retailer'
      });
      secondaryAuth.signOut(); // Clean up secondary auth state
      setNewRetailer({ name: '', email: '', password: '' });
      fetchRetailers();
      alert("Retailer created successfully!");
    } catch (err) {
      setRetailerError(err.message.replace('Firebase:', '').trim());
    }
  };

  const handleRemoveRetailer = async (r) => {
    if(window.confirm(`Remove retailer ${r.email}? This will just remove their role in the database.`)) {
      try {
        await deleteDoc(doc(db, 'users', r.id));
        fetchRetailers();
      } catch (err) {
        alert(err.message);
      }
    }
  };

  return (
    <div className="container" style={{ marginTop: '40px' }}>
      <h1 style={{ marginBottom: '30px' }}>Admin Dashboard</h1>
      
      <div className="grid grid-cols-2" style={{ gap: '30px' }}>
        
        {/* Manage Retailers */}
        <div style={{ backgroundColor: 'var(--white)', padding: '20px', borderRadius: '8px' }}>
          <h2>Manage Retailers</h2>
          <p style={{ marginTop: '10px', color: 'var(--text-light)', marginBottom: '20px' }}>
            Only Admins can register or remove Retailer accounts.
          </p>

          <form onSubmit={handleCreateRetailer} style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '20px' }}>
            {retailerError && <div style={{ color: 'var(--danger)', fontSize: '0.9rem' }}>{retailerError}</div>}
            <input type="text" placeholder="Name" value={newRetailer.name} onChange={e => setNewRetailer({...newRetailer, name: e.target.value})} required/>
            <input type="email" placeholder="Email" value={newRetailer.email} onChange={e => setNewRetailer({...newRetailer, email: e.target.value})} required/>
            <input type="password" placeholder="Temporary Password" value={newRetailer.password} onChange={e => setNewRetailer({...newRetailer, password: e.target.value})} required/>
            <button className="btn-primary" type="submit">Create Retailer</button>
          </form>

          <div style={{ borderTop: '1px solid var(--accent)', paddingTop: '20px' }}>
            <h3 style={{ marginBottom: '10px' }}>Active Retailers</h3>
            {retailers.map(r => (
              <div key={r.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0', borderBottom: '1px solid var(--accent)' }}>
                <div>
                  <div style={{ fontWeight: 500 }}>{r.name}</div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-light)' }}>{r.email}</div>
                </div>
                <button onClick={() => handleRemoveRetailer(r)} style={{ color: 'var(--danger)', fontSize: '0.9rem', textDecoration: 'underline' }}>Remove</button>
              </div>
            ))}
            {retailers.length === 0 && <p style={{ fontSize: '0.9rem', color: 'var(--text-light)' }}>No retailers found.</p>}
          </div>
        </div>

        <div>
           {/* General Settings */}
          <div style={{ backgroundColor: 'var(--white)', padding: '20px', borderRadius: '8px', marginBottom: '30px' }}>
            <h2>System Products</h2>
            <p style={{ marginTop: '10px', color: 'var(--text-light)' }}>
              Use the Retailer Dashboard directly to edit/delete any product since Admins share those capabilities.
            </p>
            <div style={{ marginTop: '20px' }}>
              <button className="btn-primary" onClick={() => navigate('/retailer')}>Go to All Products Management</button>
            </div>
          </div>

          <div style={{ backgroundColor: 'var(--white)', padding: '20px', borderRadius: '8px' }}>
            <h2>Product Rollback History</h2>
            <p style={{ marginTop: '10px', color: 'var(--text-light)', marginBottom: '20px' }}>
              Check the timeline of changes for any product ID.
            </p>
            <div style={{ display: 'flex', gap: '10px' }}>
              <input type="text" placeholder="Product ID (e.g. 1)" value={productIdToCheck} onChange={(e) => setProductIdToCheck(e.target.value)} />
              <button className="btn-primary" onClick={viewHistory}>Check</button>
            </div>
            <div style={{ marginTop: '20px', maxHeight: '200px', overflowY: 'auto' }}>
              {history.map(h => (
                <div key={h.id} style={{ borderBottom: '1px solid var(--accent)', padding: '10px 0' }}>
                  <div style={{ fontWeight: 500 }}>Time: {h.changed_at ? h.changed_at.toDate().toLocaleString() : 'Just now'}</div>
                  <div style={{ fontSize: '0.9rem', color: 'var(--text-light)' }}>
                    {h.deleted ? <strong style={{color:'red'}}>DELETED</strong> : <>Name: {h.name} | Price: ₹{h.price} | Stock: {h.stock} | Desc: {h.description}</>}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}

export default AdminDashboard;
