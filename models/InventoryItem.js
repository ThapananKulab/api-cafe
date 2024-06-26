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
  islower: { type: Number },
  realquantity: { type: Number, required: true },
  quantityInStock: { type: Number, required: true },
  useInStock: { type: Number, required: true, default: 0 },
  unitPrice: { type: Number, required: true },
  costPerUnit: { type: Number },
  description: { type: String },
  status: {
    type: String,
    enum: ["pending", "withdrawn"],
    default: "pending",
  },
});

inventoryItemSchema.pre("save", function (next) {
  this.costPerUnit =
    (this.unitPrice / this.realquantity) * this.quantityInStock;
  next();
});

module.exports = mongoose.model("InventoryItem", inventoryItemSchema);
