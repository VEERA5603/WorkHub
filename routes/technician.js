// routes/technician.js - Technician routes

const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Job = require("../models/Job");
const {encodeText} = require('./ai')
const mongoose = require('mongoose');

// Middleware
const { isAuthenticated, checkRole } = require('../middleware/auth');

// Technician dashboard
router.get('/dashboard', isAuthenticated, checkRole(['technician', 'admin']),async (req, res) => {
  let jobs = [];
  jobs = await Job.find({ technicianId: req.session.user._id });
  const earnings = await Job.aggregate([
    {
      $match: {
        technicianId: new mongoose.Types.ObjectId(req.session.user._id),
        paid: true
      }
    },
    {
      $group: {
        _id: null,
        totalEarned: { $sum: "$amount" }
      }
    }
  ]);

  const total = earnings[0]?.totalEarned || 0;
  res.render('technician/dashboard', { user: req.session.user,jobs:jobs,earnings:total });
});

router.post('/update', async (req, res) => {
  const userId = req.session.user._id;

  const { name, phone, domain, description } = req.body;
  const [embedding] = await encodeText([  description]);
  try {
    await User.findByIdAndUpdate(userId, {
      name,
      phone,
      domain,
      description,
      embedding
    });

    // Update session too, if needed
    req.session.user.name = name;
    req.session.user.phone = phone;
    req.session.user.domain = domain;
    req.session.user.description = description;

    res.redirect('/technician/dashboard');
  } catch (err) {
    console.error(err);
    res.status(500).send('Error updating profile');
  }
});

// Add more technician-specific routes here
router.get('/details/:id',isAuthenticated, async (req, res) => {
  try {
    console.log(req.user);
    const technician = await User.findById(req.params.id);

    if (!technician || technician.role !== 'technician') {
      return res.status(404).send('Technician not found');
    }

    res.render('details', {
      technician,
      success: req.query.success,
      error: req.query.error,
      req:req
    });
  } catch (error) {
    console.error('Error loading technician profile:', error);
    res.status(500).send('Internal Server Error');
  }
});

router.get('/jobs/:id', async (req, res) => {
  const job = await Job.findById(req.params.id);
  // Assume `req.user` is set via session or middleware
  res.render('job', { job, user: req.session.user });
});

// Set amount by technician
router.post('/jobs/:id/amount', async (req, res) => {
  try {
    const jobId = req.params.id;
    const amount = parseFloat(req.body.amount);

    if (isNaN(amount) || amount <= 0) {
      return res.status(400).send('Invalid amount');
    }

    const job = await Job.findById(jobId);
    if (!job) return res.status(404).send('Job not found');

    job.amount = amount;
    await job.save();

    res.redirect(`/technician/jobs/${jobId}`);
  } catch (err) {
    console.error(err);
    res.status(500).send('Server error');
  }
});

router.post('/jobs/:id/pay', async (req, res) => {
  const { razorpay_payment_id, job_id } = req.body;

  try {
    const job = await Job.findById(job_id);
    if (!job) return res.status(404).send("Job not found");

    job.paid = true;
    job.paymentId = razorpay_payment_id;
    await job.save();

    res.redirect(`/technician/jobs/${job_id}`);
  } catch (err) {
    console.error("Payment error:", err);
    res.status(500).send("Payment processing failed.");
  }
});

module.exports = router;