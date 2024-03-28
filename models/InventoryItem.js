// อย่าลืมนำเข้า mongoose และกำหนด schema ของคุณ
const mongoose = require('mongoose')

const inventoryItemSchema = new mongoose.Schema({
  order: { type: Number }, // เพิ่มฟิลด์นี้เพื่อเก็บลำดับ
  name: { type: String, required: true },
  unit: {
    type: String,
    required: true,
    enum: ['กรัม', 'มิลลิลิตร', 'ชิ้น', 'ซอง'],
  },
  realquantity: { type: Number, required: true },
  quantityInStock: { type: Number, required: true },
  unitPrice: { type: Number, required: true },
})

// เพิ่ม method สำหรับการปรับปรุงสต็อก
inventoryItemSchema.methods.adjustStock = async function (amount) {
  this.quantityInStock += amount
  await this.save()
}

module.exports = mongoose.model('InventoryItem', inventoryItemSchema)
