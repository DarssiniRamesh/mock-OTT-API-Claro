const mongoose = require('mongoose');
const Schema = mongoose.Schema;

/**
 * Country Schema
 * Represents a country with relationship to Region
 */
const CountrySchema = new Schema({
  name: {
    type: String,
    required: [true, 'Country name is required'],
    trim: true,
    unique: true,
    index: true,
  },
  code: {
    type: String,
    required: [true, 'Country code is required'],
    trim: true,
    unique: true,
    uppercase: true,
    minlength: [2, 'Country code must be at least 2 characters'],
    maxlength: [3, 'Country code cannot exceed 3 characters'],
    index: true,
  },
  region: {
    type: Schema.Types.ObjectId,
    ref: 'Region',
    required: [true, 'Region is required'],
    index: true,
  },
  capital: {
    type: String,
    trim: true,
  },
  currency: {
    code: {
      type: String,
      trim: true,
      uppercase: true,
    },
    name: {
      type: String,
      trim: true,
    },
    symbol: {
      type: String,
      trim: true,
    }
  },
  languages: [{
    type: String,
    trim: true,
  }],
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
  flag: {
    type: String,
    trim: true,
  },
  active: {
    type: Boolean,
    default: true,
  },
  timezone: {
    type: String,
    trim: true,
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

// Virtual for cities in this country
CountrySchema.virtual('cities', {
  ref: 'City',
  localField: '_id',
  foreignField: 'country',
  justOne: false,
});

// Compound indexes for optimized queries
CountrySchema.index({ name: 1, code: 1 });
CountrySchema.index({ region: 1, name: 1 });

// Pre-save hook to ensure code is uppercase
CountrySchema.pre('save', function(next) {
  if (this.code) {
    this.code = this.code.toUpperCase();
  }
  if (this.currency && this.currency.code) {
    this.currency.code = this.currency.code.toUpperCase();
  }
  next();
});

/**
 * Static method to get countries with city counts
 */
CountrySchema.statics.getCountriesWithCityCounts = async function() {
  return this.aggregate([
    {
      $lookup: {
        from: 'cities',
        localField: '_id',
        foreignField: 'country',
        as: 'cities'
      }
    },
    {
      $lookup: {
        from: 'regions',
        localField: 'region',
        foreignField: '_id',
        as: 'regionData'
      }
    },
    {
      $project: {
        name: 1,
        code: 1,
        capital: 1,
        currency: 1,
        languages: 1,
        population: 1,
        area: 1,
        flag: 1,
        active: 1,
        timezone: 1,
        cityCount: { $size: '$cities' },
        region: { $arrayElemAt: ['$regionData', 0] },
        createdAt: 1,
        updatedAt: 1
      }
    },
    { $sort: { name: 1 } }
  ]);
};

const Country = mongoose.model('Country', CountrySchema);

module.exports = Country;