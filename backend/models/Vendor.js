import mongoose from 'mongoose';

const vendorSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    mobileNumber: { type: String, required: true, unique: true, trim: true },
    email: { type: String, required: true, trim: true, lowercase: true },
    profileImage: { type: String, default: '' },
    businessName: { type: String, required: true, trim: true },
    category: { type: String, required: true }, // e.g. 'Electrician', 'Plumber'
    subServices: [{ type: String }],            // e.g. ['Wiring', 'Fan Repair']
    experienceYears: { type: String, required: true }, // e.g. '3-5 Years'
    pincodes: [{ type: String, required: true }],      // e.g. ['395007', '395001']
    baseVisitingCharge: { type: Number, default: 150 },
    isOnline: { type: Boolean, default: false },
    rating: { type: Number, default: 5.0 },
    completedJobsCount: { type: Number, default: 0 },
    upiId: { type: String, default: '' },
    role: { type: String, default: 'vendor' },
    serviceRadiusKm: { type: Number, default: 10 },
    address: {
      street: { type: String, default: '' },
      area: { type: String, default: '' },
      city: { type: String, default: '' },
      pincode: { type: String, default: '' },
      location: {
        type: { type: String, enum: ['Point'], default: 'Point' },
        coordinates: { type: [Number], default: [0, 0] },
      }
    }
  },
  { timestamps: true }
);

vendorSchema.index({ category: 1, pincodes: 1, isOnline: 1 });

const Vendor = mongoose.model('Vendor', vendorSchema);
export default Vendor;
