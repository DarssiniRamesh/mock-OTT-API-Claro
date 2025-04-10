const mongoose = require('mongoose');
const Schema = mongoose.Schema;

/**
 * City Schema
 * Represents a city with relationship to Country and geospatial support
 */
const CitySchema = new Schema({
  name: {
    type: String,
    required: [true, 'City name is required'],
    trim: true,
    index: true,
  },
  country: {
    type: Schema.Types.ObjectId,
    ref: 'Country',
    required: [true, 'Country is required'],
    index: true,
  },
  location: {
    // GeoJSON Point
    type: {
      type: String,
      enum: ['Point'],
      required: true,
      default: 'Point',
    },
    coordinates: {
      type: [Number], // [longitude, latitude]
      required: true,
      validate: {
        validator: function(v) {
          return v.length === 2 && 
                 v[0] >= -180 && v[0] <= 180 && 
                 v[1] >= -90 && v[1] <= 90;
        },
        message: 'Coordinates must be valid [longitude, latitude] pairs'
      }
    }
  },
  population: {
    type: Number,
    default: 0,
    min: [0, 'Population cannot be negative'],
  },
  isCapital: {
    type: Boolean,
    default: false,
  },
  timezone: {
    type: String,
    trim: true,
  },
  elevation: {
    type: Number,
    default: 0,
  },
  postalCodes: [{
    type: String,
    trim: true,
  }],
  active: {
    type: Boolean,
    default: true,
  },
  metadata: {
    type: Map,
    of: Schema.Types.Mixed,
    default: {},
  }
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

// Create a 2dsphere index for geospatial queries
CitySchema.index({ location: '2dsphere' });

// Compound indexes for optimized queries
CitySchema.index({ country: 1, name: 1 });
CitySchema.index({ name: 'text' }); // Text index for search

/**
 * Static method to find cities near a point
 * @param {Array} coordinates [longitude, latitude]
 * @param {Number} maxDistance Maximum distance in meters
 * @param {Number} limit Maximum number of results
 */
CitySchema.statics.findNearby = async function(coordinates, maxDistance = 10000, limit = 10) {
  return this.find({
    location: {
      $near: {
        $geometry: {
          type: 'Point',
          coordinates: coordinates
        },
        $maxDistance: maxDistance
      }
    }
  })
  .populate('country')
  .limit(limit);
};

/**
 * Static method to find cities within a bounding box
 * @param {Array} box [[minLng, minLat], [maxLng, maxLat]]
 */
CitySchema.statics.findWithinBox = async function(box) {
  return this.find({
    location: {
      $geoWithin: {
        $box: box
      }
    }
  }).populate('country');
};

/**
 * Static method to find cities by country
 * @param {ObjectId} countryId Country ID
 */
CitySchema.statics.findByCountry = async function(countryId) {
  return this.find({ country: countryId })
    .sort({ name: 1 })
    .populate('country');
};

/**
 * Static method to get city statistics by country
 */
CitySchema.statics.getCityStatsByCountry = async function() {
  return this.aggregate([
    {
      $group: {
        _id: '$country',
        cityCount: { $sum: 1 },
        totalPopulation: { $sum: '$population' },
        avgElevation: { $avg: '$elevation' },
        cities: { $push: { name: '$name', population: '$population' } }
      }
    },
    {
      $lookup: {
        from: 'countries',
        localField: '_id',
        foreignField: '_id',
        as: 'countryData'
      }
    },
    {
      $project: {
        _id: 0,
        country: { $arrayElemAt: ['$countryData', 0] },
        cityCount: 1,
        totalPopulation: 1,
        avgElevation: 1,
        topCities: { $slice: ['$cities', 5] }
      }
    },
    { $sort: { 'country.name': 1 } }
  ]);
};

const City = mongoose.model('City', CitySchema);

module.exports = City;