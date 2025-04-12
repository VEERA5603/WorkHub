const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');

// Login page
router.get('/login', (req, res) => {
  res.render('login', { error: null });
});

// Login process
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const User = req.app.locals.db.model('User');

    const user = await User.findOne({ email });
    if (!user) {
      return res.render('login', { error: 'User not found' });
    }

    // If no password set yet, redirect to create-password
    if (!user.password) {
      return res.redirect(`/create-password?email=${email}`);
    }

    const isValidPassword = await bcrypt.compare(password, user.password);
    if (!isValidPassword) {
      return res.render('login', { error: 'Invalid password' });
    }

    user.is_online = true;
    await user.save();

    req.session.user = {
      _id:user._id,
      email: user.email,
      name: user.name,
      role: user.role,
      phone:user.phone,
      description:user.description  
    };

    switch (user.role) {
      case 'admin': return res.redirect('/admin/dashboard');
      case 'technician': return res.redirect('/technician/dashboard');
      case 'customer': return res.redirect('/customer/dashboard');
      default: return res.redirect('/');
    }

  } catch (error) {
    console.error('Login error:', error);
    res.render('login', { error: 'An error occurred during login' });
  }
});

// Create password page
router.get('/create-password', (req, res) => {
  const { email } = req.query;
  if (!email) return res.redirect('/login');
  res.render('create-password', { email, error: null });
});

// Create password process
router.post('/create-password', async (req, res) => {
  try {
    const { email, password, confirmPassword } = req.body;
    const User = req.app.locals.db.model('User');

    if (password !== confirmPassword) {
      return res.render('create-password', { email, error: 'Passwords do not match' });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res.render('create-password', { email, error: 'User not found in system' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    user.password = hashedPassword;
    await user.save();

    res.redirect('/login?passwordCreated=true');
  } catch (error) {
    console.error('Create password error:', error);
    res.render('create-password', { email: req.body.email, error: 'An error occurred' });
  }
});

// Register page
router.get('/register', (req, res) => {
  res.render('register', { error: null, success: null });
});

// Registration process
router.post('/register', async (req, res) => {
  try {
    const { email } = req.body;
    const User = req.app.locals.db.model('User');

    const user = await User.findOne({ email });
    console.log(user);
    if (!user) {
      return res.render('register', {
        error: 'Email not found in our system. Please contact an administrator.',
        success: null
      });
    }

    if (user.password) {
      return res.render('register', {
        error: 'Account already registered. Please login instead.',
        success: null
      });
    }

    res.redirect(`/create-password?email=${email}`);
  } catch (error) {
    console.error('Registration error:', error);
    res.render('register', {
      error: 'An error occurred during registration check',
      success: null
    });
  }
});

// Logout
router.get('/logout', async (req, res) => {
  try {
    const User = req.app.locals.db.model('User');

    // If a user session exists, update is_online to false
    if (req.session.user) {
      await User.findByIdAndUpdate(req.session.user._id, { is_online: false });
    }

    // Destroy the session and redirect to login
    req.session.destroy(err => {
      if (err) {
        console.error('Session destroy error:', err);
        return res.redirect('/'); // fallback if session doesn't destroy
      }
      res.redirect('/login');
    });

  } catch (error) {
    console.error('Logout error:', error);
    res.redirect('/');
  }
});


module.exports = router;
