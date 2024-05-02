const mongoose = require("mongoose");

const inventoryItemSchema = new mongoose.Schema({
  name: { type: String, required: true },
  type: {
    type: String,
    enum: [
      "ถุง",
      "กระปุก",
      "ทั่วไป",
      "กระป๋อง",
      "แก้ว",
      "ทั่วไป",
      "ขวด",
      "ถัง",
    ],
  },
  unit: {
    type: String,
    enum: ["กรัม", "มิลลิลิตร", "ชิ้น", "ซอง", "ทั่วไป"],
  },
  // received: { type: Date, default: Date.now },
  islower: { type: Number },
  realquantity: { type: Number, required: true },
  quantityInStock: { type: Number, required: true },
  useInStock: { type: Number, required: true, default: 0 },
  unitPrice: { type: Number, required: true },
  description: { type: String },
  status: {
    type: String,
    enum: ["pending", "withdrawn"],
    default: "pending",
  },
});

module.exports = mongoose.model("InventoryItem", inventoryItemSchema);
