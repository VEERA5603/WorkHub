// routes/customer.js - Customer routes
const mongoose = require('mongoose');
const express = require('express');
const router = express.Router();
const User = require("../models/User");
const Rating = require("../models/Rating");
const Job = require("../models/Job");
// Middleware
const { isAuthenticated, checkRole } = require('../middleware/auth');

// Customer dashboard
router.get('/dashboard', isAuthenticated, checkRole(['customer', 'admin']),async (req, res) => {
  let jobs = [];
  jobs = await Job.find({ customerId: req.session.user._id });
  res.render('customer/dashboard', { user: req.session.user,jobs:jobs });
});


router.post('/rate-technician', isAuthenticated, checkRole(['customer', 'admin']), async (req, res) => {
  const { technician_id, rating, comment } = req.body;
  const customer_id = req.session.user._id;

  if (!technician_id || !rating) {
    return res.status(400).json({ error: 'Technician and rating are required' });
  }

  try {
    // Save rating
    await Rating.create({ technician_id, customer_id, rating, comment });

    // Recalculate average rating
    const agg = await Rating.aggregate([
      { $match: { technician_id: new mongoose.Types.ObjectId(technician_id) } },
      {
        $group: {
          _id: "$technician_id",
          avgRating: { $avg: "$rating" },
          totalRatings: { $sum: 1 }
        }
      }
    ]);

    const { avgRating, totalRatings } = agg[0];

    // Update technician
    await User.findByIdAndUpdate(technician_id, {
      avg_rating: avgRating,
      total_ratings: totalRatings
    });

    // res.json({ message: 'Rating submitted successfully!' });
    res.redirect(`/technician/details/${technician_id}`);

  } catch (err) {
    console.error('Rating error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Add more customer-specific routes here

module.exports = router;