const express = require('express');
const router = express.Router();
const User = require('../models/User'); // Assuming your Mongoose model is here
const {encodeText} = require('./ai');
// Middleware
const { isAuthenticated, checkRole } = require('../middleware/auth');

// Admin dashboard
router.get('/dashboard', isAuthenticated, checkRole(['admin']), (req, res) => {
  res.render('admin/dashboard', { user: req.session.user });
});

// Admin users list
router.get('/users', isAuthenticated, checkRole(['admin']), async (req, res) => {
  try {
    const users = await User.find({}, '-password'); // Exclude password from response
    res.render('admin/users', { user: req.session.user, users });
  } catch (error) {
    console.error('Error fetching users:', error);
    res.render('error', { message: 'Error fetching users' });
  }
});

// Add user form
router.get('/add-user', isAuthenticated, checkRole(['admin']), (req, res) => {
  res.render('admin/add-user', { user: req.session.user, error: null, success: null });
});

// Add user process
router.post('/add-user', isAuthenticated, checkRole(['admin']), async (req, res) => {
  const { email, name, phone_number, address, role, description } = req.body;

  if (!['admin', 'technician', 'customer'].includes(role)) {
    return res.render('admin/add-user', {
      user: req.session.user,
      error: 'Invalid role',
      success: null
    });
  }

  try {
    const existingUser = await User.findOne({ email });

    if (existingUser) {
      return res.render('admin/add-user', {
        user: req.session.user,
        error: 'User already exists',
        success: null
      });
    }
    
    let embedding = [];

    if (role === 'technician') {
      const [result] = await encodeText([description || ""]);
      embedding = result;
    }
    const newUser = new User({
      email,
      name,
      phone_number,
      address,
      description,
      role,
      registration_date: new Date(),
      embedding
      // password will be added by the user later
    });

    await newUser.save();

    res.render('admin/add-user', {
      user: req.session.user,
      error: null,
      success: `User ${email} added successfully. They can now create a password.`
    });
  } catch (error) {
    console.error('Add user error:', error);
    res.render('admin/add-user', {
      user: req.session.user,
      error: 'An error occurred while adding the user',
      success: null
    });
  }
});

module.exports = router;
