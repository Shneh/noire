import React, { createContext, useState, useEffect } from 'react';
import axios from 'axios';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [token, setToken] = useState(localStorage.getItem('noire_token') || null);

    useEffect(() => {
        if (token) {
            axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
            // Optional: Implement a /me route to fetch user profile, for now we will just keep whatever is in localStorage or decode JWT.
            const storedUser = localStorage.getItem('noire_user');
            if (storedUser) setUser(JSON.parse(storedUser));
        } else {
            delete axios.defaults.headers.common['Authorization'];
            setUser(null);
        }
    }, [token]);

    const login = (userData, jwtToken) => {
        setToken(jwtToken);
        setUser(userData);
        localStorage.setItem('noire_token', jwtToken);
        localStorage.setItem('noire_user', JSON.stringify(userData));
    };

    const logout = () => {
        setToken(null);
        setUser(null);
        localStorage.removeItem('noire_token');
        localStorage.removeItem('noire_user');
    };

    return (
        <AuthContext.Provider value={{ user, token, login, logout }}>
            {children}
        </AuthContext.Provider>
    );
};
