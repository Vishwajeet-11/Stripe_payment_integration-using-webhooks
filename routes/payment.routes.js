import express from "express";
import { confirmPayment, createPayment, refundPayment, stripeWebhook } from "../controllers/payment.controller.js";

const payment = express.Router();

payment.post("/create-payment-intent", createPayment);
payment.post("/refund", refundPayment);
payment.post("/confirm", confirmPayment);

payment.post("/webhook", express.raw({ type: "application/json" }), stripeWebhook);

export { payment };
