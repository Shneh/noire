const express = require('express');
const router = express.Router();
const { GoogleGenerativeAI } = require('@google/generative-ai');
const db = require('../db/database');

const apiKey = process.env.GEMINI_API_KEY;
let genAI = null;

if (apiKey) {
    genAI = new GoogleGenerativeAI(apiKey);
} else {
    console.warn('GEMINI_API_KEY is not set. AI Features will work in mock mode.');
}

// Get all products wrapper for AI context
const getAllProducts = () => new Promise((resolve, reject) => {
    db.all('SELECT id, name, description, genre, category, price FROM products', [], (err, rows) => {
        if (err) reject(err);
        else resolve(rows);
    });
});

router.post('/search', async (req, res) => {
    try {
        const { query } = req.body;
        if (!query) return res.status(400).json({ error: 'Search query is required' });

        const products = await getAllProducts();

        if (!genAI) {
            // Mock AI behavior if no key
            const results = products.filter(p => 
                p.name.toLowerCase().includes(query.toLowerCase()) || 
                p.description.toLowerCase().includes(query.toLowerCase())
            );
            return res.json({ 
                message: "Here are some mock suggestions based on a basic text match.", 
                suggested_products: results 
            });
        }

        const model = genAI.getGenerativeModel({ model: "gemini-1.5-pro" });

        const prompt = `
            You are a stylish AI assistant for Noiré, a Korean Fashion E-commerce platform.
            The user searched for: "${query}"
            
            Here is the JSON list of available products on our platform:
            ${JSON.stringify(products)}

            Based on the user's search and the available products, please return:
            1. A friendly, aesthetic suggested message (like a shopping assistant).
            2. A JSON array of the recommended 'id' integers from the available products.

            Return the response strictly in this exact JSON format, no markdown outside of the JSON:
            {
                "message": "Assistant's friendly message",
                "recommended_ids": [1, 2, 4]
            }
        `;

        const result = await model.generateContent(prompt);
        const textResponse = result.response.text();
        
        // Clean markdown backticks if any
        let cleanJson = textResponse.replace(/```json/g, '').replace(/```/g, '').trim();
        
        try {
            const parsedAiResult = JSON.parse(cleanJson);
            const suggested_products = products.filter(p => parsedAiResult.recommended_ids.includes(p.id));

            res.json({
                message: parsedAiResult.message,
                suggested_products
            });
        } catch (parseError) {
            console.error('Failed to parse AI response:', cleanJson);
            res.status(500).json({ error: 'AI failed to process the request logically', parsedText: cleanJson });
        }

    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
