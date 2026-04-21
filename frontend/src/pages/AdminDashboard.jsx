import React, { useEffect, useContext, useState } from 'react';
import { AuthContext } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { db } from '../firebase';
import { collection, query, where, getDocs, orderBy } from 'firebase/firestore';

function AdminDashboard() {
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();
  const [history, setHistory] = useState([]);
  const [productIdToCheck, setProductIdToCheck] = useState('');

  useEffect(() => {
    if (!user || user.role !== 'admin') {
      navigate('/');
    }
  }, [user, navigate]);

  const viewHistory = async () => {
    if (!productIdToCheck) return;
    try {
      const q = query(
        collection(db, 'product_history'), 
        where('product_id', '==', productIdToCheck)
      );
      const snapshot = await getDocs(q);
      
      // Sort in memory because Firestore requires index for dynamic composite queries
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      data.sort((a, b) => b.changed_at?.toMillis() - a.changed_at?.toMillis());
      
      setHistory(data);
    } catch (err) {
      alert('Could not fetch history: ' + err.message);
    }
  };

  return (
    <div className="container" style={{ marginTop: '40px' }}>
      <h1 style={{ marginBottom: '30px' }}>Admin Dashboard</h1>
      
      <div className="grid grid-cols-2">
        <div style={{ backgroundColor: 'var(--white)', padding: '20px', borderRadius: '8px' }}>
          <h2>System Management Overview</h2>
          <p style={{ marginTop: '10px', color: 'var(--text-light)' }}>
            Admins have full access to view product histories and manage all users.
            Use the Retailer Dashboard directly to edit/delete any product since Admins share those capabilities.
          </p>
          <div style={{ marginTop: '30px' }}>
            <button className="btn-primary" onClick={() => navigate('/retailer')}>Go to All Products Management</button>
          </div>
        </div>

        <div style={{ backgroundColor: 'var(--white)', padding: '20px', borderRadius: '8px' }}>
          <h2>Product Rollback History</h2>
          <p style={{ marginTop: '10px', color: 'var(--text-light)', marginBottom: '20px' }}>
            Check the timeline of changes for any product ID.
          </p>
          
          <div style={{ display: 'flex', gap: '10px' }}>
            <input 
              type="text" 
              placeholder="Product ID (e.g. 1)" 
              value={productIdToCheck}
              onChange={(e) => setProductIdToCheck(e.target.value)}
            />
            <button className="btn-primary" onClick={viewHistory}>Check</button>
          </div>

          <div style={{ marginTop: '20px', maxHeight: '300px', overflowY: 'auto' }}>
            {history.map(h => (
              <div key={h.id} style={{ borderBottom: '1px solid var(--accent)', padding: '10px 0' }}>
                <div style={{ fontWeight: 500 }}>Time: {h.changed_at ? h.changed_at.toDate().toLocaleString() : 'Just now'}</div>
                <div style={{ fontSize: '0.9rem', color: 'var(--text-light)' }}>
                  {h.deleted ? <strong style={{color:'red'}}>DELETED</strong> : <>Name: {h.name} | Price: ${h.price} | Stock: {h.stock} | Desc: {h.description}</>}
                </div>
              </div>
            ))}
            {history.length === 0 && <p style={{ color: 'var(--text-light)', fontSize: '0.9rem' }}>No history found. Try an ID.</p>}
          </div>

        </div>
      </div>
    </div>
  );
}

export default AdminDashboard;
