import React, { useState, useContext } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Menu, X, ShoppingBag, User } from 'lucide-react';
import { AuthContext } from '../context/AuthContext';

function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const { user, logout } = useContext(AuthContext);
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <nav className="glass" style={{ position: 'fixed', top: 0, width: '100%', zIndex: 1000 }}>
      <div className="container" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', height: '80px' }}>
        
        <Link to="/" style={{ fontSize: '1.8rem', fontWeight: 600, letterSpacing: '2px', color: 'var(--primary)' }}>
          NOIRÉ
        </Link>

        {/* Desktop Menu */}
        <div className="desktop-menu" style={{ display: 'flex', gap: '30px', alignItems: 'center' }}>
          <Link to="/?genre=men" style={{ fontWeight: 500 }}>MEN</Link>
          <Link to="/?genre=women" style={{ fontWeight: 500 }}>WOMEN</Link>
          <Link to="/?genre=unisex" style={{ fontWeight: 500 }}>UNISEX</Link>
          
          <div style={{ display: 'flex', gap: '15px', marginLeft: '20px' }}>
            <Link to="/cart">
              <ShoppingBag color="var(--primary)" size={24} />
            </Link>
            {user ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <span style={{ fontSize: '0.9rem', color: 'var(--text-light)' }}>Hi, {user.name}</span>
                {user.role === 'admin' && <Link to="/admin" style={{ fontSize: '0.8rem', backgroundColor: 'var(--primary)', color: 'white', padding: '4px 8px', borderRadius: '4px' }}>Admin</Link>}
                {user.role === 'retailer' && <Link to="/retailer" style={{ fontSize: '0.8rem', backgroundColor: 'var(--primary)', color: 'white', padding: '4px 8px', borderRadius: '4px' }}>Retailer</Link>}
                <button onClick={handleLogout} style={{ fontSize: '0.9rem', textDecoration: 'underline' }}>Logout</button>
              </div>
            ) : (
              <Link to="/login">
                <User color="var(--primary)" size={24} />
              </Link>
            )}
          </div>
        </div>

        {/* Mobile Menu Toggle */}
        <div className="mobile-toggle" style={{ display: 'none' }} onClick={() => setIsOpen(!isOpen)}>
          {isOpen ? <X size={28} /> : <Menu size={28} />}
        </div>
      </div>

      {/* Mobile Menu */}
      {isOpen && (
        <div className="mobile-menu glass" style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '20px', borderTop: '1px solid rgba(0,0,0,0.1)' }}>
          <Link to="/?genre=men" onClick={() => setIsOpen(false)}>MEN</Link>
          <Link to="/?genre=women" onClick={() => setIsOpen(false)}>WOMEN</Link>
          <Link to="/?genre=unisex" onClick={() => setIsOpen(false)}>UNISEX</Link>
          <hr style={{ border: 'none', borderTop: '1px solid var(--accent)' }} />
          <Link to="/cart" onClick={() => setIsOpen(false)}>CART</Link>
          {user ? (
             <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <span>Hi, {user.name}</span>
                {user.role === 'admin' && <Link to="/admin" onClick={() => setIsOpen(false)}>Admin Dashboard</Link>}
                {user.role === 'retailer' && <Link to="/retailer" onClick={() => setIsOpen(false)}>Retailer Dashboard</Link>}
                <button onClick={() => { handleLogout(); setIsOpen(false); }} style={{ textAlign: 'left', textDecoration: 'underline' }}>Logout</button>
             </div>
          ) : (
            <Link to="/login" onClick={() => setIsOpen(false)}>LOGIN / REGISTER</Link>
          )}
        </div>
      )}
      
      <style dangerouslySetInnerHTML={{__html: `
        @media (max-width: 768px) {
          .desktop-menu { display: none !important; }
          .mobile-toggle { display: block !important; cursor: pointer; }
        }
      `}} />
    </nav>
  );
}

export default Navbar;
