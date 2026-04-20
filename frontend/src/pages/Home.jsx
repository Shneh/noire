import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import axios from 'axios';
import ProductCard from '../components/ProductCard';
import { Search, Sparkles } from 'lucide-react';

function useQuery() {
  return new URLSearchParams(useLocation().search);
}

function Home() {
  const [products, setProducts] = useState([]);
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [aiMessage, setAiMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const query = useQuery();
  const genreFilter = query.get('genre');
  const categoryFilter = query.get('category');

  useEffect(() => {
    fetchProducts();
  }, []);

  useEffect(() => {
    let result = products;
    if (genreFilter) {
      result = result.filter(p => p.genre === genreFilter);
    }
    if (categoryFilter) {
      result = result.filter(p => p.category === categoryFilter);
    }
    setFilteredProducts(result);
    setAiMessage(''); // Clear AI message on normal navigation
  }, [genreFilter, categoryFilter, products]);

  const fetchProducts = async () => {
    try {
      const res = await axios.get(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/products`);
      setProducts(res.data);
      setFilteredProducts(res.data);
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
      const res = await axios.post(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/ai/search`, { query: searchQuery });
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
      {/* Hero Section */}
      <div style={{ backgroundColor: 'var(--accent)', padding: '60px 20px', textAlign: 'center', marginBottom: '40px' }}>
        <h1 style={{ fontSize: '3rem', fontWeight: 300, marginBottom: '20px', letterSpacing: '2px' }}>
          {genreFilter ? genreFilter.toUpperCase() : 'NEW ARRIVALS'}
        </h1>
        <p style={{ color: 'var(--text-light)', maxWidth: '600px', margin: '0 auto' }}>
          Discover the latest trends in Korean minimalist fashion. 
        </p>
      </div>

      <div className="container">
        {/* Search Bar */}
        <form onSubmit={handleAISearch} style={{ 
          display: 'flex', gap: '10px', marginBottom: '40px', maxWidth: '600px', margin: '0 auto 40px auto', position: 'relative'
        }}>
          <input 
            type="text" 
            placeholder="Describe what you want... (e.g. 'A black casual shirt for weekend')" 
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

        {/* Product Grid */}
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
