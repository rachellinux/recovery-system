const Order = require('../models/Order');
const Product = require('../models/Product');
const User = require('../models/User');

// @desc    Create cart order
// @route   POST /api/cart/checkout
// @access  Public
exports.checkout = async (req, res) => {
  try {
    const { items, name, email, phone, location } = req.body;

    // Validate cart items
    if (!items || items.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Cart is empty'
      });
    }

    // Try to find user by email if provided
    let userInfo = null;
    if (req.user || email) {
      userInfo = req.user || await User.findOne({ email });
    }

    // Validate required fields for unregistered users
    if (!userInfo && (!name || !email || !phone || !location)) {
      return res.status(400).json({
        success: false,
        message: 'Please provide all required information: name, email, phone, and location'
      });
    }

    let totalAmount = 0;
    const orderItems = [];
    const productsToUpdate = [];

    // Validate products and calculate total
    for (const item of items) {
      const product = await Product.findById(item.product);
      
      if (!product) {
        return res.status(404).json({
          success: false,
          message: `Product with id ${item.product} not found`
        });
      }

      // Check stock
      if (product.quantityInStock < item.quantity) {
        return res.status(400).json({
          success: false,
          message: `Insufficient stock for ${product.name}. Available: ${product.quantityInStock}`
        });
      }

      // Store product for later update
      productsToUpdate.push({
        product,
        quantity: item.quantity
      });

      // Prepare order item
      orderItems.push({
        product: product._id,
        quantity: item.quantity,
        price: product.price
      });

      // Calculate total
      totalAmount += product.price * item.quantity;
    }

    // Create order
    const orderData = {
      orderType: 'product',
      client: {
        name: userInfo ? userInfo.name : name,
        email: userInfo ? userInfo.email : email,
        phone: userInfo ? userInfo.phone : phone,
        location: userInfo ? userInfo.address : location,
        user: userInfo ? userInfo._id : null
      },
      items: orderItems,
      totalAmount,
      status: 'pending',
      paymentStatus: 'pending'
    };

    const order = await Order.create(orderData);

    // Update product stock one by one
    try {
      for (const { product, quantity } of productsToUpdate) {
        product.quantityInStock -= quantity;
        await product.save();
      }
    } catch (error) {
      // If stock update fails, delete the order and throw error
      await Order.findByIdAndDelete(order._id);
      throw new Error('Failed to update product stock');
    }

    // Populate product details in response
    const populatedOrder = await Order.findById(order._id)
      .populate('items.product', 'name price quantityInStock');

    res.status(201).json({
      success: true,
      data: populatedOrder,
      message: 'Order created successfully'
    });

  } catch (error) {
    console.error('Checkout Error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to process checkout'
    });
  }
};

// @desc    Get order status
// @route   GET /api/cart/order/:orderId
// @access  Public
exports.getOrderStatus = async (req, res) => {
  try {
    const order = await Order.findById(req.params.orderId)
      .populate('items.product', 'name price');

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }

    // If user is logged in, verify ownership
    if (req.user && order.client.user && order.client.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to access this order'
      });
    }

    res.json({
      success: true,
      data: {
        status: order.status,
        paymentStatus: order.paymentStatus,
        totalAmount: order.totalAmount,
        items: order.items,
        client: {
          name: order.client.name,
          email: order.client.email,
          phone: order.client.phone,
          location: order.client.location
        }
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to get order status'
    });
  }
};

// @desc    Update payment status
// @route   POST /api/cart/order/:orderId/payment
// @access  Public
exports.updatePayment = async (req, res) => {
  try {
    const { paymentMethod } = req.body;
    const order = await Order.findById(req.params.orderId);

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }

    // If user is logged in, verify ownership
    if (req.user && order.client.user && order.client.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to update this order'
      });
    }

    // Validate payment method
    if (!['cash', 'mobile_money', 'bank_transfer'].includes(paymentMethod)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid payment method'
      });
    }

    // Simulate payment processing
    order.paymentStatus = 'paid';
    order.paymentMethod = paymentMethod;
    order.status = 'processing';
    await order.save();

    res.json({
      success: true,
      data: {
        status: order.status,
        paymentStatus: order.paymentStatus,
        paymentMethod: order.paymentMethod
      },
      message: 'Payment processed successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to process payment'
    });
  }
}; 