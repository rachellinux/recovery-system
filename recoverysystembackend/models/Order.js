const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema({
  orderType: {
    type: String,
    required: true,
    enum: ['product', 'service', 'course']
  },
  client: {
    name: {
      type: String,
      required: true
    },
    email: {
      type: String,
      required: true
    },
    phone: {
      type: String,
      required: true
    },
    location: {
      type: String,
      required: true
    },
    user: {
      type: mongoose.Schema.ObjectId,
      ref: 'User'
    }
  },
  items: [{
    product: {
      type: mongoose.Schema.ObjectId,
      ref: 'Product'
    },
    service: {
      type: mongoose.Schema.ObjectId,
      ref: 'Service'
    },
    course: {
      type: mongoose.Schema.ObjectId,
      ref: 'Course'
    },
    quantity: {
      type: Number,
      required: true,
      min: 1
    }
  }],
  totalAmount: {
    type: Number,
    required: true
  },
  preferredDates: {
    startDate: {
      type: Date,
      required: function() {
        return this.orderType === 'service';
      }
    },
    endDate: {
      type: Date,
      required: function() {
        return this.orderType === 'service';
      }
    }
  },
  status: {
    type: String,
    enum: ['pending', 'processing', 'confirmed', 'completed', 'cancelled'],
    default: 'pending'
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Order', orderSchema); 