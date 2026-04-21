import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { db } from '../firebase';
import { collection, getDocs, query, where } from 'firebase/firestore';
import axios from 'axios';
import ProductCard from '../components/ProductCard';
import { Search, Sparkles } from 'lucide-react';

function useURLQuery() {
  return new URLSearchParams(useLocation().search);
}

function Home() {
  const [products, setProducts] = useState([]);
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [aiMessage, setAiMessage] = useState('');
  const [loading, setLoading] = useState(false);
  
  const urlQuery = useURLQuery();
  const genreFilter = urlQuery.get('genre');
  const categoryFilter = urlQuery.get('category');

  useEffect(() => {
    fetchProducts();
  }, []);

  useEffect(() => {
    let result = products;
    if (genreFilter) result = result.filter(p => p.genre === genreFilter);
    if (categoryFilter) result = result.filter(p => p.category === categoryFilter);
    
    setFilteredProducts(result);
    setAiMessage('');
  }, [genreFilter, categoryFilter, products]);

  const fetchProducts = async () => {
    try {
      const snapshot = await getDocs(collection(db, 'products'));
      const productList = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setProducts(productList);
    } catch (err) {
      console.error('Failed to fetch products', err);
    }
  };

  const handleAISearch = async (e) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;

    setLoading(true);
    setAiMessage('');
    try {
      // Send the current available products to the backend so the AI can filter them without a DB connection
      const res = await axios.post(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/ai/search`, { 
        query: searchQuery, 
        productsData: products 
      });
      setAiMessage(res.data.message);
      setFilteredProducts(res.data.suggested_products);
    } catch (err) {
      console.error('AI search failed', err);
      // Fallback to basic search
      const basicSearch = products.filter(p => p.name.toLowerCase().includes(searchQuery.toLowerCase()) || p.description.toLowerCase().includes(searchQuery.toLowerCase()));
      setFilteredProducts(basicSearch);
      setAiMessage('We could not reach the AI, but here are some basic text matches.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <div style={{ backgroundColor: 'var(--accent)', padding: '60px 20px', textAlign: 'center', marginBottom: '40px' }}>
        <h1 style={{ fontSize: '3rem', fontWeight: 300, marginBottom: '20px', letterSpacing: '2px' }}>
          {genreFilter ? genreFilter.toUpperCase() : 'NEW ARRIVALS'}
        </h1>
        <p style={{ color: 'var(--text-light)', maxWidth: '600px', margin: '0 auto' }}>
          Discover the latest trends in Korean minimalist fashion. 
        </p>
      </div>

      <div className="container">
        <form onSubmit={handleAISearch} style={{ display: 'flex', gap: '10px', marginBottom: '40px', maxWidth: '600px', margin: '0 auto 40px auto', position: 'relative' }}>
          <input 
            type="text" 
            placeholder="Describe what you want..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{ paddingLeft: '45px', borderRadius: '30px' }}
          />
          <Search color="var(--text-light)" size={20} style={{ position: 'absolute', left: '15px', top: '14px' }} />
          <button type="submit" className="btn-primary" style={{ borderRadius: '30px', display: 'flex', alignItems: 'center', gap: '10px' }} disabled={loading}>
             {loading ? 'Thinking...' : <><Sparkles size={16} /> AI Search</>}
          </button>
        </form>

        {aiMessage && (
          <div style={{ backgroundColor: 'var(--white)', padding: '20px', borderRadius: '8px', marginBottom: '30px', borderLeft: '4px solid var(--primary)' }}>
            <p style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <Sparkles size={20} color="var(--primary)" /> 
              {aiMessage}
            </p>
          </div>
        )}

        <div className="grid grid-cols-4">
          {filteredProducts.map(product => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
        
        {filteredProducts.length === 0 && !loading && (
          <div style={{ textAlign: 'center', padding: '60px 0', color: 'var(--text-light)' }}>
            <h2>No products found</h2>
            <p>Try a different search or category.</p>
          </div>
        )}
      </div>
    </div>
  );
}

export default Home;
