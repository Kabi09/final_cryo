import mongoose from 'mongoose';

const counterSchema = new mongoose.Schema({
  key: { type: String, required: true, unique: true },
  sequence: { type: Number, default: 0 }
});

const Counter = mongoose.model('Counter', counterSchema);

export const getNextSequence = async (prefix, digits = 4) => {
  const currentYear = new Date().getFullYear();
  const counterKey = `${prefix}-${currentYear}`;
  
  const counter = await Counter.findOneAndUpdate(
    { key: counterKey },
    { $inc: { sequence: 1 } },
    { new: true, upsert: true }
  );

  const seqStr = String(counter.sequence).padStart(digits, '0');
  return `${prefix}-${currentYear}-${seqStr}`;
};
