const mongoose = require("mongoose");

const purchaseReceiptSchema = new mongoose.Schema({
  items: [
    {
      item: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "InventoryItem",
        required: true,
      },
      name: { type: Number },
      quantity: { type: Number },
      unitPrice: { type: Number },
      realquantity: { type: Number },
      quantityInStock: { type: Number },
      quantityCount: { type: Number },
      status: {
        type: String,
        enum: ["pending", "withdrawn"],
        default: "pending",
      },
      received: { type: Date, default: Date.now, required: true },
      withdrawner: { type: String },
    },
  ],
  total: { type: Number, required: true },
  received: { type: Date, default: Date.now },
  supplier: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Supplier",
    required: true,
  },
  status: {
    type: String,
    enum: ["pending", "completed", "cancelled"],
    default: "pending",
  },
});

module.exports = mongoose.model("PurchaseReceipt", purchaseReceiptSchema);
