import mongoose from 'mongoose';

const serviceRequestSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    category: {
      type: String,
      required: true,
      trim: true,
    },
    subCategory: {
      type: String,
      default: '',
      trim: true,
    },
    title: {
      type: String,
      default: '',
      trim: true,
    },
    description: {
      type: String,
      required: true,
      trim: true,
    },
    images: [
      {
        type: String,
      },
    ],
    schedule: {
      date: {
        type: String, // e.g. "Today", "Tomorrow", "2026-09-11"
        required: true,
      },
      timeSlot: {
        type: String, // e.g. "Morning (9 AM - 12 PM)"
        required: true,
      },
    },
    address: {
      label: {
        type: String,
        default: 'Home',
      },
      street: {
        type: String,
        required: true,
      },
      city: {
        type: String,
        required: true,
      },
      pincode: {
        type: String,
        required: true,
        index: true,
      },
      location: {
        type: {
          type: String,
          enum: ['Point'],
          default: 'Point',
        },
        coordinates: {
          type: [Number], // [longitude, latitude]
          default: [0, 0],
        },
      },
    },
    status: {
      type: String,
      enum: ['pending', 'accepted', 'in_progress', 'work_started', 'completed', 'cancelled'],
      default: 'pending',
    },
    assignedVendor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    finalAmount: {
      type: Number,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

// Compound index for status and pincode fast queries
serviceRequestSchema.index({ status: 1, pincode: 1 });
// 2dsphere index for location queries
serviceRequestSchema.index({ 'address.location': '2dsphere' });

const ServiceRequest = mongoose.model('ServiceRequest', serviceRequestSchema);

export default ServiceRequest;
