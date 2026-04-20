import React from 'react';
import { Link } from 'react-router-dom';

function Footer() {
  return (
    <footer style={{ backgroundColor: 'var(--primary)', color: 'var(--secondary)', padding: '60px 0 20px 0', marginTop: 'auto' }}>
      <div className="container grid grid-cols-3" style={{ borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '40px', marginBottom: '20px' }}>
        
        <div>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 600, letterSpacing: '2px', marginBottom: '20px' }}>NOIRÉ</h2>
          <p style={{ color: 'var(--text-light)', fontSize: '0.9rem' }}>
            Aesthetic Korean fashion brought to you. Minimal, elegant, and timeless.
          </p>
        </div>

        <div>
          <h3 style={{ fontSize: '1rem', marginBottom: '20px', textTransform: 'uppercase', letterSpacing: '1px' }}>Shop</h3>
          <ul style={{ display: 'flex', flexDirection: 'column', gap: '10px', color: 'var(--text-light)', fontSize: '0.9rem' }}>
            <li><Link to="/?genre=men" className="hover-white">Men</Link></li>
            <li><Link to="/?genre=women" className="hover-white">Women</Link></li>
            <li><Link to="/?genre=unisex" className="hover-white">Unisex</Link></li>
            <li><Link to="/?category=clothing" className="hover-white">Clothing</Link></li>
            <li><Link to="/?category=jewellery" className="hover-white">Jewellery</Link></li>
          </ul>
        </div>

        <div>
          <h3 style={{ fontSize: '1rem', marginBottom: '20px', textTransform: 'uppercase', letterSpacing: '1px' }}>Help</h3>
          <ul style={{ display: 'flex', flexDirection: 'column', gap: '10px', color: 'var(--text-light)', fontSize: '0.9rem' }}>
            <li><Link to="#" className="hover-white">FAQ</Link></li>
            <li><Link to="#" className="hover-white">Shipping</Link></li>
            <li><Link to="#" className="hover-white">Returns</Link></li>
          </ul>
        </div>

      </div>

      <div className="container" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: 'var(--text-light)', fontSize: '0.8rem' }}>
        <p>&copy; {new Date().getFullYear()} Noiré. All rights reserved.</p>
        <div style={{ display: 'flex', gap: '15px' }}>
          {/* Admin and Retailer hidden links as requested */}
          <Link to="/login?role=retailer" style={{ opacity: 0.5 }} className="hover-white">Retailer Login</Link>
          <Link to="/login?role=admin" style={{ opacity: 0.5 }} className="hover-white">Admin Login</Link>
        </div>
      </div>
      
      <style dangerouslySetInnerHTML={{__html: `
        .hover-white:hover { color: var(--white); transition: color 0.3s; }
      `}} />
    </footer>
  );
}

export default Footer;
