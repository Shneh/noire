import React, { useState, useContext } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { AuthContext } from '../context/AuthContext';

function useQuery() {
  return new URLSearchParams(useLocation().search);
}

function Login() {
  const query = useQuery();
  const roleMode = query.get('role') || 'customer';
  const redirectParams = query.get('redirect');
  const navigate = useNavigate();
  const { login } = useContext(AuthContext);

  const [isRegister, setIsRegister] = useState(false);
  const [formData, setFormData] = useState({ name: '', email: '', password: '' });
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    const endpoint = isRegister ? 'register' : 'login';
    const payload = isRegister ? { ...formData, role: roleMode } : { email: formData.email, password: formData.password };

    try {
      const res = await axios.post(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/auth/${endpoint}`, payload);
      login(res.data.user, res.data.token);
      
      if (redirectParams === 'cart') navigate('/cart');
      else if (res.data.user.role === 'admin') navigate('/admin');
      else if (res.data.user.role === 'retailer') navigate('/retailer');
      else navigate('/');
    } catch (err) {
      setError(err.response?.data?.error || 'Authentication failed');
    }
  };

  return (
    <div className="container" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
      <div className="glass" style={{ width: '100%', maxWidth: '400px', padding: '40px', borderRadius: '8px' }}>
        <h2 style={{ textAlign: 'center', marginBottom: '20px', fontWeight: 500, letterSpacing: '1px', textTransform: 'uppercase' }}>
          {isRegister ? 'Register' : 'Login'} {roleMode !== 'customer' && `as ${roleMode}`}
        </h2>

        {error && <div style={{ backgroundColor: 'var(--danger)', color: 'white', padding: '10px', borderRadius: '4px', marginBottom: '20px', fontSize: '0.9rem' }}>{error}</div>}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
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
          <button onClick={() => setIsRegister(!isRegister)} style={{ textDecoration: 'underline', color: 'var(--text-light)' }}>
            {isRegister ? 'Already have an account? Login' : "Don't have an account? Register"}
          </button>
        </div>

        {/* Note on Google Login required by prompt: "It would be better if the login is provided for Google Google oriented also." */}
        <div style={{ marginTop: '30px', textAlign: 'center' }}>
           <button className="btn-outline" style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px' }} onClick={() => alert("Google Auth placeholder. Needs OAuth Client ID config.")}>
             <img src="https://upload.wikimedia.org/wikipedia/commons/c/c1/Google_%22G%22_logo.svg" alt="Google" width="18" height="18" />
             Continue with Google
           </button>
        </div>
      </div>
    </div>
  );
}

export default Login;
