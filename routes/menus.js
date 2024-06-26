const express = require("express");
const router = express.Router();
const Menu = require("../models/Menu.js");
const InventoryItem = require("../models/InventoryItem");
const Recipe = require("../models/Recipe.js");
const cloudinary = require("../utils/cloudinary.js");
const multer = require("multer");

const { notifyLine } = require("../function/notify.js");
const tokenline = "DWTW5lpLAyy8v2zXVMeKaLenXJZBei9Zs7YXeoDqdxO";

const storage = multer.diskStorage({});
const parser = multer({ storage: storage });

router.post("/addMenu", parser.single("image"), async (req, res) => {
  const {
    name,
    description,
    price,
    sweetLevel,
    type,
    recipe,
    cost,
    glassSize,
  } = req.body;

  if (!req.file) {
    return res
      .status(400)
      .json({ success: false, message: "No image file provided." });
  }

  const imageUrl = req.file.path;

  try {
    const result = await cloudinary.uploader.upload(imageUrl, {
      folder: "menus",
    });

    const menuItem = new Menu({
      name,
      description,
      price,
      sweetLevel,
      type,
      recipe,
      image: result.secure_url,
      cost,
      glassSize,
    });

    const savedItem = await menuItem.save();
    // ส่งข้อมูลการเพิ่มรายการเมนูไปยัง Line Notify
    const text = `รายการเมนู "${savedItem.name}" ถูกเพิ่มแล้ว\n
    ราคา: ${savedItem.price} บาท\n
    ระดับความหวาน: ${savedItem.sweetLevel}\n
    ประเภท: ${savedItem.type}\n
    ขนาดแก้ว: ${savedItem.glassSize}\n
    ราคาขาย: ${savedItem.cost} บาท`;
    await notifyLine(tokenline, text);

    res.status(201).json({
      success: true,
      menuItem: savedItem,
    });
  } catch (error) {
    console.error(error);
    res.status(400).json({ success: false, message: "Error adding menu item" });
  }
});

router.get("/allMenus", async (req, res) => {
  try {
    const menuItems = await Menu.find().populate("recipe");
    res.status(200).json(menuItems);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// DELETE a menu item by ID
router.delete("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const deletedItem = await Menu.findByIdAndDelete(id);

    if (!deletedItem) {
      return res
        .status(404)
        .json({ success: false, message: "Menu item not found" });
    }

    // สร้างข้อความแจ้งเตือน
    const text = `รายการ "${deletedItem.name}" ถูกลบ`;
    // ส่งข้อความไปยัง Line Notify
    await notifyLine(tokenline, text);

    res.json({
      success: true,
      message: "Menu item deleted successfully",
      deletedItem: deletedItem,
    });
  } catch (error) {
    console.error(error);
    res
      .status(500)
      .json({ success: false, message: "Error deleting menu item" });
  }
});

router.get("/checkName", async (req, res) => {
  try {
    const { name } = req.query; // รับชื่อเมนูจาก query parameter
    const menuItem = await Menu.findOne({ name }); // ค้นหาเมนูที่มีชื่อตรงกับที่ระบุ

    if (menuItem) {
      // ถ้าพบเมนูนี้ในฐานข้อมูล
      res.json({
        exists: true,
        message: "A menu item with this name already exists.",
      });
    } else {
      // ถ้าไม่พบ
      res.json({ exists: false, message: "Name is available." });
    }
  } catch (error) {
    console.error(error);
    res
      .status(500)
      .json({ success: false, message: "Error checking menu name" });
  }
});

router.put("/:id", parser.single("image"), async (req, res) => {
  const { id } = req.params;
  const {
    name,
    description,
    price,
    sweetLevel,
    type,
    recipe,
    glassSize,
    cost,
  } = req.body;

  try {
    // ค้นหาข้อมูลเก่าก่อนการอัปเดต
    const oldItem = await Menu.findById(id);
    if (!oldItem) {
      return res
        .status(404)
        .json({ success: false, message: "Menu item not found" });
    }

    let updatedData = {
      name,
      description,
      price,
      sweetLevel,
      type,
      recipe,
      glassSize,
      cost, // ตรวจสอบให้แน่ใจว่ามีบรรทัดนี้
    };

    if (req.file) {
      const imageUrl = req.file.path;
      const result = await cloudinary.uploader.upload(imageUrl, {
        folder: "menus",
      });
      updatedData.image = result.secure_url;
    }

    const updatedItem = await Menu.findByIdAndUpdate(id, updatedData, {
      new: true,
    });
    if (!updatedItem) {
      return res
        .status(404)
        .json({ success: false, message: "Menu item not found" });
    }

    // ตรวจสอบและกำหนดข้อมูลที่ถูกแก้ไข
    let changes = [];
    if (oldItem.name !== updatedItem.name) {
      changes.push(`ชื่อ: ${oldItem.name} เป็น ${updatedItem.name}`);
    }
    if (oldItem.description !== updatedItem.description) {
      changes.push(
        `คำอธิบาย: ${oldItem.description} เป็น ${updatedItem.description}`
      );
    }
    if (oldItem.sweetLevel !== updatedItem.sweetLevel) {
      changes.push(
        `ระดับความหวาน: ${oldItem.sweetLevel} เป็น ${updatedItem.sweetLevel}`
      );
    }
    if (oldItem.type !== updatedItem.type) {
      changes.push(`ประเภท: ${oldItem.type} เป็น ${updatedItem.type}`);
    }
    if (oldItem.glassSize !== updatedItem.glassSize) {
      changes.push(
        `ขนาดแก้ว: ${oldItem.glassSize} เป็น ${updatedItem.glassSize}`
      );
    }
    if (oldItem.price !== updatedItem.price) {
      changes.push(`ราคา: ${oldItem.price} เป็น ${updatedItem.price}`);
    }
    if (oldItem.cost !== updatedItem.cost) {
      changes.push(`ต้นทุน: ${oldItem.cost} เป็น ${updatedItem.cost}`);
    }

    if (changes.length > 0) {
      const text = `เมนู"${updatedItem.name}" ถูกแก้ไข:\n${changes.join("\n")}`;
      await notifyLine(tokenline, text);
    }

    res.json({
      success: true,
      message: "Menu item updated successfully",
      menuItem: updatedItem,
      changes: changes,
    });
  } catch (error) {
    console.error(error);
    res
      .status(500)
      .json({ success: false, message: "Error updating menu item" });
  }
});

router.get("/menu/:id", async (req, res) => {
  const { id } = req.params; // Extract the ID from the request parameters

  try {
    const menuItem = await Menu.findById(id).populate("recipe"); // Assuming 'recipe' is a reference in your Menu model that you want populated

    if (!menuItem) {
      return res
        .status(404)
        .json({ success: false, message: "Menu item not found" });
    }

    res.status(200).json(menuItem);
  } catch (error) {
    console.error(error);
    res
      .status(500)
      .json({ success: false, message: "Error fetching menu item details" });
  }
});

router.post("/checkIngredients", async (req, res) => {
  try {
    const { id, quantityToAdd } = req.body;
    console.log("Received ID:", id, "Quantity to add:", quantityToAdd);

    const menuItem = await Menu.findById(id).populate("recipe");
    console.log("Menu Item:", menuItem);

    if (!menuItem) {
      return res
        .status(404)
        .json({ success: false, message: "Menu item not found" });
    }

    if (!menuItem.recipe) {
      return res.status(400).json({
        success: false,
        message: "No recipe found for this menu item",
      });
    }

    const ingredients = menuItem.recipe.ingredients;
    const unavailableIngredients = [];

    for (const ingredient of ingredients) {
      const inventoryItem = await InventoryItem.findById(
        ingredient.inventoryItemId
      );
      console.log("Ingredient:", ingredient);
      console.log("Inventory Item:", inventoryItem);
      if (
        !inventoryItem ||
        inventoryItem.quantityInStock < ingredient.quantity * quantityToAdd
      ) {
        unavailableIngredients.push({
          ingredientId: ingredient.inventoryItemId,
          ingredientName: inventoryItem
            ? inventoryItem.name
            : "Unnamed Ingredient",
          quantityRequired: ingredient.quantity * quantityToAdd,
          quantityInStock: inventoryItem ? inventoryItem.quantityInStock : 0,
        });
      }
    }

    if (unavailableIngredients.length > 0) {
      // Return the list of unavailable ingredients along with the response
      return res.status(400).json({
        success: false,
        unavailableIngredients,
      });
    } else {
      // All ingredients are available, return success
      return res
        .status(200)
        .json({ success: true, message: "Ingredients are available" });
    }
  } catch (error) {
    console.error("Error checking ingredients availability:", error);
    return res.status(500).json({
      success: false,
      message: "Error checking ingredients availability",
    });
  }
});

router.get("/menu/:id", async (req, res) => {
  const { id } = req.params;

  try {
    const menuItem = await Menu.findById(id).populate({
      path: "recipe",
      populate: {
        path: "ingredients.inventoryItemId",
        model: "InventoryItem",
        select: "name",
      },
    });

    if (!menuItem) {
      return res
        .status(404)
        .json({ success: false, message: "Menu item not found" });
    }

    // Return the populated menuItem
    res.status(200).json({ success: true, menuItem });
  } catch (error) {
    console.error(error);
    res
      .status(500)
      .json({ success: false, message: "Error fetching menu item details" });
  }
});

module.exports = router;
