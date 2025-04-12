const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  email: { type: String, required: true},
  name: String,
  phone: String,
  address: String,
  role: { type: String, enum: ['admin', 'technician', 'customer'], required: true },
  password: String,
  registration_date: { type: Date, default: Date.now },
  description:String,
  embedding: { type: [Number] },
  avg_rating: { type: Number, default: 0 },
  total_ratings: { type: Number, default: 0 },
  is_online:{type:Boolean}
});
    
module.exports = mongoose.model('User', userSchema);
