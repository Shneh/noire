import React, { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { auth, db, googleProvider } from '../firebase';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword, signInWithPopup, updateProfile } from 'firebase/auth';
import { doc, setDoc, getDoc } from 'firebase/firestore';

function useQuery() {
  return new URLSearchParams(useLocation().search);
}

function Login() {
  const query = useQuery();
  const roleMode = query.get('role') || 'customer';
  const redirectParams = query.get('redirect');
  const navigate = useNavigate();

  const [isRegister, setIsRegister] = useState(false);
  const [formData, setFormData] = useState({ name: '', email: '', password: '' });
  const [error, setError] = useState('');

  const routeUser = (role) => {
    if (redirectParams === 'cart') navigate('/cart');
    else if (role === 'admin') navigate('/admin');
    else if (role === 'retailer') navigate('/retailer');
    else navigate('/');
  };

  const handleEmailSubmit = async (e) => {
    e.preventDefault();
    setError('');
    
    try {
      if (isRegister) {
        const userCredential = await createUserWithEmailAndPassword(auth, formData.email, formData.password);
        const user = userCredential.user;
        
        await updateProfile(user, { displayName: formData.name });
        
        // Save user role in Firestore
        await setDoc(doc(db, 'users', user.uid), {
          name: formData.name,
          email: formData.email,
          role: roleMode
        });
        
        routeUser(roleMode);
      } else {
        const userCredential = await signInWithEmailAndPassword(auth, formData.email, formData.password);
        const user = userCredential.user;
        
        // Fetch role to know where to route
        const docRef = await getDoc(doc(db, 'users', user.uid));
        const role = docRef.exists() ? docRef.data().role : 'customer';
        
        routeUser(role);
      }
    } catch (err) {
      setError(err.message.replace('Firebase:', '').trim());
    }
  };

  const handleGoogleLogin = async () => {
    setError('');
    try {
      const result = await signInWithPopup(auth, googleProvider);
      const user = result.user;
      
      // Check if user exists in Firestore
      const docRef = await getDoc(doc(db, 'users', user.uid));
      let role = 'customer';
      if (!docRef.exists()) {
        await setDoc(doc(db, 'users', user.uid), {
          name: user.displayName,
          email: user.email,
          role: roleMode
        });
        role = roleMode;
      } else {
        role = docRef.data().role || 'customer';
      }
      
      routeUser(role);
    } catch (err) {
      setError(err.message.replace('Firebase:', '').trim());
    }
  };

  return (
    <div className="container" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
      <div className="glass" style={{ width: '100%', maxWidth: '400px', padding: '40px', borderRadius: '8px' }}>
        <h2 style={{ textAlign: 'center', marginBottom: '20px', fontWeight: 500, letterSpacing: '1px', textTransform: 'uppercase' }}>
          {isRegister ? 'Register' : 'Login'} {roleMode !== 'customer' && `as ${roleMode}`}
        </h2>

        {error && <div style={{ backgroundColor: 'var(--danger)', color: 'white', padding: '10px', borderRadius: '4px', marginBottom: '20px', fontSize: '0.9rem' }}>{error}</div>}

        <form onSubmit={handleEmailSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {isRegister && (
            <input 
              type="text" 
              placeholder="Full Name" 
              value={formData.name}
              onChange={(e) => setFormData({...formData, name: e.target.value})}
              required
            />
          )}
          <input 
            type="email" 
            placeholder="Email Address" 
            value={formData.email}
            onChange={(e) => setFormData({...formData, email: e.target.value})}
            required
          />
          <input 
            type="password" 
            placeholder="Password" 
            value={formData.password}
            onChange={(e) => setFormData({...formData, password: e.target.value})}
            required
          />
          <button type="submit" className="btn-primary">
            {isRegister ? 'Create Account' : 'Sign In'}
          </button>
        </form>

        <div style={{ textAlign: 'center', marginTop: '20px', fontSize: '0.9rem' }}>
          {roleMode === 'customer' ? (
            <button onClick={() => setIsRegister(!isRegister)} style={{ textDecoration: 'underline', color: 'var(--text-light)' }}>
              {isRegister ? 'Already have an account? Login' : "Don't have an account? Register"}
            </button>
          ) : (
            <p style={{ color: 'var(--text-light)' }}>Registration is restricted for this role.</p>
          )}
        </div>

        {roleMode === 'customer' && (
          <div style={{ marginTop: '30px', textAlign: 'center' }}>
             <button onClick={handleGoogleLogin} className="btn-outline" style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px' }}>
               <img src="https://upload.wikimedia.org/wikipedia/commons/c/c1/Google_%22G%22_logo.svg" alt="Google" width="18" height="18" />
               Continue with Google
             </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default Login;
