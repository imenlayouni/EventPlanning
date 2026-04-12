const express = require("express");
const router = express.Router();
const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);
const isAuthenticated = require("../middleware/isAuthenticated");

router.post("/create-checkout-session", isAuthenticated, async (req, res) => {
    try {
        const { services } = req.body; // array of { title, price, quantity }

        const lineItems = services.map(s => ({
            price_data: {
                currency: "usd",
                product_data: {
                    name: s.title,
                },
                unit_amount: Math.round(parseFloat(String(s.price).replace(/[^0-9.]/g, '')) * 100),
            },
            quantity: s.quantity || 1,
        }));

        const session = await stripe.checkout.sessions.create({
            payment_method_types: ["card"],
            line_items: lineItems,
            mode: "payment",
            success_url: "http://localhost:5000/payment-success",
            cancel_url: "http://localhost:5000/user/dashboard",
        });

        res.json({ url: session.url });
    } catch (err) {
        console.error("Stripe error:", err);
        res.status(500).json({ message: "Payment failed" });
    }
});

module.exports = router;