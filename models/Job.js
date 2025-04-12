const mongoose = require('mongoose');

const jobSchema = new mongoose.Schema({
  customerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  technicianId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  status: { type: String, enum: ['pending', 'accepted', 'rejected'], default: 'pending' },
  details: { type: String },
  amount: { type:Number },
  razorpayId:{type:String},
  paid:{type:Boolean}

}, { timestamps: true });

module.exports = mongoose.model('Job', jobSchema);
