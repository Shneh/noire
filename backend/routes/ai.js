const express = require('express');
const router = express.Router();
const { GoogleGenerativeAI } = require('@google/generative-ai');

let genAI = null;
if (process.env.GEMINI_API_KEY) {
    genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
}

router.post('/search', async (req, res) => {
    const { query, productsData } = req.body;

    if (!query) return res.status(400).json({ error: 'Search query is required' });
    if (!productsData || !Array.isArray(productsData)) {
        return res.status(400).json({ error: 'Available products data must be provided for AI context' });
    }

    if (!genAI) {
        // Fallback rudimentary search
        const qLower = query.toLowerCase();
        const matches = productsData.filter(p => p.name.toLowerCase().includes(qLower) || p.description.toLowerCase().includes(qLower) || p.category.toLowerCase().includes(qLower));
        return res.json({ message: "Mock match due to missing AI Key", suggested_products: matches });
    }

    try {
        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
        const catalogString = JSON.stringify(productsData);

        const prompt = `
        A user is searching an online Korean fashion store. 
        Their query: "${query}"
        
        Here is the JSON of all available products:
        ${catalogString}
        
        Analyze the intent of the user's query and find the exact "id" fields of the products that best match their fashion needs.
        Return ONLY a raw JSON array of matching product IDs as strings or integers.
        If no products match, return an empty array [].
        Do not wrap the array in markdown backticks or formatting.
        `;

        const result = await model.generateContent(prompt);
        let textResult = result.response.text().trim();
        
        // Strip markdown if AI misbehaves
        if (textResult.startsWith('```json')) textResult = textResult.substring(7);
        if (textResult.endsWith('```')) textResult = textResult.substring(0, textResult.length - 3);
        textResult = textResult.trim();

        let matchingIds = [];
        try {
            matchingIds = JSON.parse(textResult);
        } catch (e) {
            console.error("AI response not valid JSON:", textResult);
        }

        // Map IDs back to full products
        matchingIds = matchingIds.map(id => String(id));
        const finalProducts = productsData.filter(p => matchingIds.includes(String(p.id)));

        res.json({
            message: "I found these pieces that match your vibe.",
            suggested_products: finalProducts
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'AI processing failed' });
    }
});

module.exports = router;
