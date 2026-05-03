const express = require('express');
const router = express.Router();
const nodemailer = require('nodemailer');

router.post('/', async (req, res) => {
    try {
        const { cartItems, user, address, phone, retailerEmails } = req.body;

        if (!cartItems || !user || !address || !phone) {
            return res.status(400).json({ error: 'Missing required checkout information.' });
        }

        const adminEmail = process.env.ADMIN_EMAIL || 'admin@example.com'; 
        
        // Setup Nodemailer transporter
        // NOTE: Make sure to set EMAIL_USER and EMAIL_PASS in your .env file
        const transporter = nodemailer.createTransport({
            service: 'gmail', // Change if using a different provider
            auth: {
                user: process.env.EMAIL_USER,
                pass: process.env.EMAIL_PASS
            }
        });

        const total = cartItems.reduce((sum, item) => sum + item.price, 0);

        // Generate email content
        const orderHtml = `
            <h2>New Order Placed!</h2>
            <h3>Customer Details:</h3>
            <p><strong>Name:</strong> ${user.name}</p>
            <p><strong>Email:</strong> ${user.email}</p>
            <p><strong>Verified Phone:</strong> ${phone}</p>
            
            <h3>Delivery Address:</h3>
            <p>${address}</p>

            <h3>Order Summary:</h3>
            <ul>
                ${cartItems.map(item => `<li>${item.name} (${item.category}) - ₹${item.price.toFixed(2)}</li>`).join('')}
            </ul>
            <h3><strong>Total: ₹${total.toFixed(2)}</strong></h3>
        `;

        // Send to Admin
        if (process.env.EMAIL_USER && process.env.EMAIL_PASS) {
            try {
                await transporter.sendMail({
                    from: `"Noiré Store" <${process.env.EMAIL_USER}>`,
                    to: adminEmail,
                    subject: 'New Order Received',
                    html: orderHtml
                });

                // Send to respective retailers
                if (retailerEmails && retailerEmails.length > 0) {
                    for (const retailerEmail of retailerEmails) {
                        if (retailerEmail) {
                            await transporter.sendMail({
                                from: `"Noiré Store" <${process.env.EMAIL_USER}>`,
                                to: retailerEmail,
                                subject: 'New Order Contains Your Products',
                                html: orderHtml
                            });
                        }
                    }
                }
            } catch (mailError) {
                console.error("Error sending email:", mailError);
                // Continue even if mail fails, so the user sees success
            }
        } else {
            console.warn("Nodemailer not configured. Please set EMAIL_USER and EMAIL_PASS in backend environment variables.");
        }

        res.json({ success: true, message: 'Order placed successfully!' });

    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to process checkout.' });
    }
});

module.exports = router;
