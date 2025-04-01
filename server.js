import dotenv from "dotenv";
import express from "express";
import { connectDB } from "./dbConnection.js";
import { payment } from "./routes/payment.routes.js";
dotenv.config();

const app = express();
// const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

app.use(express.json());
connectDB();

app.use("/payments", payment);

app.listen(3000, () => console.log("Server running on port 3000"));
