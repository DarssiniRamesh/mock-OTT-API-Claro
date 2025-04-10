const mongoose = require('mongoose');
const Schema = mongoose.Schema;

/**
 * Region Schema
 * Represents a geographical region or continent
 */
const RegionSchema = new Schema({
  name: {
    type: String,
    required: [true, 'Region name is required'],
    trim: true,
    unique: true,
    index: true,
  },
  code: {
    type: String,
    required: [true, 'Region code is required'],
    trim: true,
    unique: true,
    uppercase: true,
    minlength: [2, 'Region code must be at least 2 characters'],
    maxlength: [3, 'Region code cannot exceed 3 characters'],
    index: true,
  },
  description: {
    type: String,
    trim: true,
  },
  population: {
    type: Number,
    default: 0,
    min: [0, 'Population cannot be negative'],
  },
  area: {
    type: Number,
    default: 0,
    min: [0, 'Area cannot be negative'],
  },
  active: {
    type: Boolean,
    default: true,
  },
}, {
  timestamps: true,
  toJSON: {
    virtuals: true,
    transform: function(doc, ret) {
      ret.id = ret._id;
      delete ret._id;
      delete ret.__v;
      return ret;
    }
  },
  toObject: {
    virtuals: true,
    transform: function(doc, ret) {
      ret.id = ret._id;
      delete ret._id;
      delete ret.__v;
      return ret;
    }
  }
});

// Virtual for countries in this region
RegionSchema.virtual('countries', {
  ref: 'Country',
  localField: '_id',
  foreignField: 'region',
  justOne: false,
});

// Compound index for optimized queries
RegionSchema.index({ name: 1, code: 1 });

// Pre-save hook to ensure code is uppercase
RegionSchema.pre('save', function(next) {
  if (this.code) {
    this.code = this.code.toUpperCase();
  }
  next();
});

/**
 * Static method to get regions with country counts
 */
RegionSchema.statics.getRegionsWithCountryCounts = async function() {
  return this.aggregate([
    {
      $lookup: {
        from: 'countries',
        localField: '_id',
        foreignField: 'region',
        as: 'countries'
      }
    },
    {
      $project: {
        name: 1,
        code: 1,
        description: 1,
        countryCount: { $size: '$countries' },
        active: 1,
        createdAt: 1,
        updatedAt: 1
      }
    },
    { $sort: { name: 1 } }
  ]);
};

const Region = mongoose.model('Region', RegionSchema);

module.exports = Region;