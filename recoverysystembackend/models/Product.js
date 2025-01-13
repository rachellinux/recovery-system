const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Please add a product name'],
    trim: true,
    maxlength: [100, 'Name cannot be more than 100 characters']
  },
  description: {
    type: String,
    required: [true, 'Please add a description'],
    maxlength: [500, 'Description cannot be more than 500 characters']
  },
  category: {
    type: String,
    required: [true, 'Please select a category'],
    enum: {
      values: ['Solar Panel', 'Battery', 'Controller', 'Cable', 'Other'],
      message: '{VALUE} is not a valid category'
    }
  },
  price: {
    type: Number,
    required: [true, 'Please add a price'],
    min: [0, 'Price cannot be negative']
  },
  quantity: {
    type: Number,
    required: [true, 'Please add quantity'],
    min: [0, 'Quantity cannot be negative']
  },
  specifications: {
    // Base specifications for all products
    manufacturer: {
      type: String,
      required: [true, 'Please add manufacturer']
    },
    model: {
      type: String,
      required: [true, 'Please add model number']
    },
    warranty: {
      type: String,
      required: [true, 'Please add warranty information']
    },
    // Category specific specifications
    // Solar Panel specifications
    wattage: {
      type: Number,
      required: function() { return this.category === 'Solar Panel'; }
    },
    voltage: {
      type: Number,
      required: function() { 
        return ['Solar Panel', 'Battery', 'Controller'].includes(this.category); 
      }
    },
    dimensions: {
      type: String,
      required: function() { return this.category === 'Solar Panel'; }
    },
    // Battery specifications
    capacity: {
      type: Number,
      required: function() { return this.category === 'Battery'; }
    },
    type: {
      type: String,
      required: function() { return this.category === 'Battery'; }
    },
    // Controller specifications
    maxCurrent: {
      type: Number,
      required: function() { return this.category === 'Controller'; }
    },
    features: {
      type: String,
      required: function() { return this.category === 'Controller'; }
    },
    // Cable specifications
    length: {
      type: Number,
      required: function() { return this.category === 'Cable'; }
    },
    gauge: {
      type: String,
      required: function() { return this.category === 'Cable'; }
    },
    material: {
      type: String,
      required: function() { return this.category === 'Cable'; }
    }
  },
  images: [{
    type: String
  }],
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Product', productSchema); 