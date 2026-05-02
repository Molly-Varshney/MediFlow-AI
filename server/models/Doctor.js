const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const DoctorSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Doctor name is required'],
      trim: true,
    },
    specialization: {
      type: String,
      required: [true, 'Specialization is required'],
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    password: {
      type: String,
      required: [true, 'Password is required'],
      minlength: [6, 'Password must be at least 6 characters'],
      select: false,
    },
    phone: {
      type: String,
      required: true,
    },
    qualification: {
      type: String,
      default: '',
    },
    experience: {
      type: Number, // years
      default: 0,
    },
    department: {
      type: String,
      default: '',
    },
    // Availability
    isAvailable: {
      type: Boolean,
      default: true,
    },
    availableDays: {
      type: [String],
      enum: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'],
      default: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
    },
    availableTimeFrom: {
      type: String,
      default: '09:00',
    },
    availableTimeTo: {
      type: String,
      default: '17:00',
    },
    // Consultation fee
    consultationFee: {
      type: Number,
      default: 500,
    },
    // Linked user account
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    bio: {
      type: String,
      default: '',
    },
    rating: {
      type: Number,
      min: 0,
      max: 5,
      default: 4.5,
    },
    totalPatients: {
      type: Number,
      default: 0,
    },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

// Hash password before saving
DoctorSchema.pre('save', async function () {
  if (!this.isModified('password')) return;
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
});

// Method to compare passwords
DoctorSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

module.exports = mongoose.model('Doctor', DoctorSchema);
