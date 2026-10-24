import mongoose from 'mongoose';

const productSchema = new mongoose.Schema({}, {
  strict: false,
  versionKey: false,
  timestamps: false
});
productSchema.index({ id: 1 }, { unique: true });
export default mongoose.models.Product || mongoose.model('Product', productSchema);
