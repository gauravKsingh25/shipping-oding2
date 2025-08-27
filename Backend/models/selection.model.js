const mongoose = require('mongoose');

const Schema = mongoose.Schema;

const selectionSchema = new Schema({
  vendorName: { type: String, required: true, trim: true },
  providerName: { type: String, required: true, trim: true },
  total: { type: Number, required: true },
  date: { type: Date, required: true },
}, {
  timestamps: true,
});

const Selection = mongoose.model('Selection', selectionSchema);

module.exports = Selection;
