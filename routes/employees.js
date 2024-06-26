const express = require('express')
const router = express.Router()
const multer = require('multer')
const User = require('../models/User.js')
const cloudinary = require('../utils/cloudinary.js') // Import Cloudinary SDK

const storage = multer.diskStorage({}) // You can customize this storage as needed
const parser = multer({ storage: storage })

router.post('/add-user', parser.single('image'), async (req, res) => {
  const {
    username,
    password,
    firstname,
    lastname,
    email,
    phone,
    address,
    role,
  } = req.body

  try {
    const existingUser = await User.findOne({ username })
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'ชื่อผู้ใช้นี้ถูกใช้แล้ว โปรดเลือกชื่อผู้ใช้อื่น',
        data: null,
      })
    }

    let imageUrl = ''
    let publicId = ''
    if (req.file) {
      // Upload image to Cloudinary
      const result = await cloudinary.uploader.upload(req.file.path, {
        folder: 'users',
      })
      imageUrl = result.secure_url
      publicId = result.public_id
    }

    const newUser = new User({
      username,
      password,
      firstname,
      lastname,
      email,
      phone,
      address,
      role,
      image: imageUrl,
      cloudinaryPublicId: publicId, // Save public id in user model
    })
    const savedUser = await newUser.save()

    res.json({
      success: true,
      message: `User registration successful for ${username}`,
      data: savedUser,
    })
  } catch (error) {
    console.error(error)
    res
      .status(500)
      .json({ success: false, message: 'Server error', data: null })
  }
})

router.post('/update-profile', parser.single('image'), async (req, res) => {
  const updateP_id = req.body.updateP_id
  const { firstname, lastname, email, phone, address, role } = req.body

  try {
    // Initialize update data object
    let updateData = {
      ...(firstname && { firstname }),
      ...(lastname && { lastname }),
      ...(email && { email }),
      ...(phone && { phone }),
      ...(address && { address }),
      ...(role && { role }),
    }

    // Check if a file is uploaded
    if (req.file) {
      // Find the user by ID
      const user = await User.findById(updateP_id)

      // Check if the user has a Cloudinary public ID
      if (user && user.cloudinaryPublicId) {
        // Delete the old image from Cloudinary using the public ID
        await cloudinary.uploader.destroy(user.cloudinaryPublicId)
      }

      // Upload the new image to Cloudinary
      const result = await cloudinary.uploader.upload(req.file.path, {
        folder: 'users',
      })
      updateData.image = result.secure_url

      // Update the user's Cloudinary public ID with the new one
      updateData.cloudinaryPublicId = result.public_id
    }

    // Update the user's profile with the new data
    const updatedUser = await User.findByIdAndUpdate(updateP_id, updateData, {
      new: true,
      runValidators: true,
    })

    // Check if the user is found
    if (!updatedUser) {
      return res.status(404).send('User not found')
    }

    // Return the updated user
    res.json(updatedUser)
  } catch (error) {
    console.error('Error updating user:', error)
    res.status(500).send('Internal Server Error')
  }
})

module.exports = router
