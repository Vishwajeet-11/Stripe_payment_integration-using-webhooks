import mongoose from "mongoose";

const PaymentSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, required: true },
    amount: { type: Number, required: true },
    currency: { type: String, default: "usd" },
    paymentIntentId: { type: String, unique: true },
    payment_method: {type: String},
    status: { type: String, enum: ["pending", "succeeded", "failed"], default: "pending" },
    createdAt: { type: Date, default: Date.now },
});

export default mongoose.model("Payment", PaymentSchema);
