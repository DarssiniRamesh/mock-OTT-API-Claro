const mongoose = require('mongoose');
const Schema = mongoose.Schema;

/**
 * RegionConfig Schema
 * Represents configuration settings specific to a geographical region
 */
const RegionConfigSchema = new Schema({
  region: {
    type: Schema.Types.ObjectId,
    ref: 'Region',
    required: [true, 'Region is required'],
    index: true,
  },
  configType: {
    type: String,
    required: [true, 'Configuration type is required'],
    trim: true,
    index: true,
  },
  configData: {
    type: Schema.Types.Mixed,
    required: [true, 'Configuration data is required'],
  },
  description: {
    type: String,
    trim: true,
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

// Compound index for optimized queries
RegionConfigSchema.index({ region: 1, configType: 1 });

/**
 * Static method to get configurations for a specific region
 * @param {ObjectId} regionId - The region ID
 * @returns {Promise<Array>} - Array of configurations
 */
RegionConfigSchema.statics.getConfigsByRegion = async function(regionId) {
  return this.find({ region: regionId, active: true })
    .populate('region', 'name code')
    .sort({ configType: 1 });
};

/**
 * Static method to get a specific configuration type for a region
 * @param {ObjectId} regionId - The region ID
 * @param {string} configType - The configuration type
 * @returns {Promise<Object>} - The configuration object
 */
RegionConfigSchema.statics.getConfigByType = async function(regionId, configType) {
  return this.findOne({ region: regionId, configType, active: true })
    .populate('region', 'name code');
};

/**
 * Static method to get configurations by region code
 * @param {string} regionCode - The region code
 * @returns {Promise<Array>} - Array of configurations
 */
RegionConfigSchema.statics.getConfigsByRegionCode = async function(regionCode) {
  const Region = mongoose.model('Region');
  const region = await Region.findOne({ code: regionCode.toUpperCase() });
  
  if (!region) {
    return [];
  }
  
  return this.find({ region: region._id, active: true })
    .populate('region', 'name code')
    .sort({ configType: 1 });
};

const RegionConfig = mongoose.model('RegionConfig', RegionConfigSchema);

module.exports = RegionConfig;