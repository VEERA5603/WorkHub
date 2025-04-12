const mongoose = require('mongoose');

const RatingSchema = new mongoose.Schema({
    technician_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    customer_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    rating: { type: Number, min: 1, max: 5 },
    comment: String,
    created_at: { type: Date, default: Date.now }
  });
  
module.exports = mongoose.model('Rating', RatingSchema);