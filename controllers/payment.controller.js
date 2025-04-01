import 'dotenv/config'; // Load environment variables first
import Stripe from 'stripe';
import Payment from '../models/payments.js';

// Initialize Stripe with your secret key
const stripeInstance = new Stripe(process.env.STRIPE_SECRET_KEY);

export const createPayment = async (req, res) => {
    try {
        const { amount, currency, userId, paymentMethodId } = req.body;

        if (!amount || !currency || !paymentMethodId) {
            return res.status(400).json({ error: "Amount, currency, and paymentMethodId are required" });
        }

        const paymentIntent = await stripeInstance.paymentIntents.create({
            amount: Number(amount),
            currency: currency.toLowerCase(),
            payment_method: paymentMethodId, // Provided by the frontend
            confirmation_method: "manual", // Manual confirmation to process the payment in two steps
            confirm: false, // Do not confirm immediately
        });

        const savedData = await Payment.create({
            paymentIntentId: paymentIntent.id,
            amount,
            currency,
            userId,
            payment_method: paymentMethodId,
            status: "pending", // Set status to pending before confirmation
        });

        res.status(200).json({ clientSecret: paymentIntent.client_secret, paymentIntentId: paymentIntent.id });
    } catch (error) {
        console.error("Stripe Error:", error);
        res.status(500).json({ error: error.message });
    }
};


export const confirmPayment = async (req, res) => {
    try {
        const { paymentIntentId } = req.body;

        const paymentIntent = await stripeInstance.paymentIntents.confirm(paymentIntentId);

        if (paymentIntent.status === "requires_action") {
            return res.status(400).json({
                error: "Authentication required",
                nextAction: paymentIntent.next_action,
            });
        }

        // Update DB status after successful payment
        await Payment.findOneAndUpdate(
            { paymentIntentId },
            { status: "succeeded" },
            { new: true }
        );

        res.status(200).json({ message: "Payment confirmed", paymentIntent });
    } catch (error) {
        console.error("Payment Confirmation Error:", error);
        res.status(500).json({ error: error.message });
    }
};


export const refundPayment = async (req, res) => {
    try {
        const { paymentIntentId } = req.body;

        const paymentIntent = await stripeInstance.paymentIntents.retrieve(paymentIntentId);

        if (!paymentIntent) {
            return res.status(404).json({ error: "PaymentIntent not found" });
        }

        if (paymentIntent.status !== "succeeded") {
            return res.status(400).json({ error: "Payment was not successful, so no refund is possible." });
        }

        // Create a refund using the paymentIntent ID
        const refund = await stripeInstance.refunds.create({
            payment_intent: paymentIntentId, // Directly use the PaymentIntent ID
        });

        res.status(200).json(refund);
    } catch (error) {
        console.error("Refund Error:", error);
        res.status(500).json({ error: error.message });
    }
};

export const stripeWebhook = async (req, res) => {
    let event;

    try {
        event = stripe.webhooks.constructEvent(
            req.body,
            req.headers["stripe-signature"],
            process.env.STRIPE_WEBHOOK_SECRET
        );
    } catch (err) {
        console.error("Webhook Error:", err.message);
        return res.status(400).send(`Webhook Error: ${err.message}`);
    }

    if (event.type === "payment_intent.succeeded") {
        const paymentIntent = event.data.object;

        await Payment.findOneAndUpdate(
            { paymentIntentId: paymentIntent.id },
            { status: "succeeded" },
            { new: true }
        );
    }

    res.status(200).json({ received: true });
};

