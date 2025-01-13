const mongoose = require('mongoose');

const serviceSchema = new mongoose.Schema({
  name: {
    type: String,
    default: 'Solar Installation',
    immutable: true
  },
  description: {
    type: String,
    required: [true, 'Please add installation details'],
  },
  products: {
    panel: {
      product: {
        type: mongoose.Schema.ObjectId,
        ref: 'Product',
        required: [true, 'Solar panel product is required']
      },
      quantity: {
        type: Number,
        required: [true, 'Number of panels required']
      }
    },
    battery: {
      product: {
        type: mongoose.Schema.ObjectId,
        ref: 'Product',
        required: [true, 'Battery product is required']
      },
      quantity: {
        type: Number,
        required: [true, 'Number of batteries required']
      }
    },
    controller: {
      product: {
        type: mongoose.Schema.ObjectId,
        ref: 'Product',
        required: [true, 'Controller product is required']
      },
      quantity: {
        type: Number,
        required: [true, 'Number of controllers required']
      }
    },
    cable: {
      product: {
        type: mongoose.Schema.ObjectId,
        ref: 'Product',
        required: [true, 'Cable product is required']
      },
      quantity: {
        type: Number,
        required: [true, 'Cable length/quantity required']
      }
    }
  },
  laborCost: {
    type: Number,
    required: [true, 'Labor cost is required']
  },
  totalCost: {
    type: Number,
    required: true
  },
  installationDate: {
    type: Date,
    required: [true, 'Please specify installation date']
  },
  estimatedDuration: {
    type: String,
    required: [true, 'Please specify estimated installation duration']
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Calculate total cost before saving
serviceSchema.pre('save', async function(next) {
  let productsCost = 0;
  
  for (const productType of ['panel', 'battery', 'controller', 'cable']) {
    const item = this.products[productType];
    const product = await mongoose.model('Product').findById(item.product);
    if (product) {
      productsCost += product.price * item.quantity;
    }
  }
  
  this.totalCost = productsCost + this.laborCost;
  next();
});

module.exports = mongoose.model('Service', serviceSchema);