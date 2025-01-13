const Order = require('../models/Order');
const Course = require('../models/Course');
const Product = require('../models/Product');
const Service = require('../models/Service');

// @desc    Get all orders (admin)
// @route   GET /api/orders
// @access  Private/Admin
exports.getOrders = async (req, res) => {
  try {
    const orders = await Order.find()
      .populate('items.product', 'name price category description quantity')
      .populate('items.course', 'name price description')
      .populate('items.service')
      .populate('client.user', 'name email phone')
      .sort('-createdAt');

    // Format orders to include all necessary information
    const formattedOrders = orders.map(order => ({
      _id: order._id,
      orderId: order._id,
      createdAt: order.createdAt,
      status: order.status,
      paymentStatus: order.paymentStatus,
      totalAmount: order.totalAmount,
      items: order.items.map(item => ({
        product: item.product ? {
          _id: item.product._id,
          name: item.product.name,
          price: item.product.price,
          category: item.product.category,
          description: item.product.description,
          quantity: item.product.quantity
        } : null,
        course: item.course,
        service: item.service,
        quantity: item.quantity
      })),
      client: {
        user: order.client.user ? {
          name: order.client.user.name,
          email: order.client.user.email,
          phone: order.client.user.phone
        } : null,
        shippingAddress: order.client.shippingAddress
      }
    }));

    res.json({
      success: true,
      data: formattedOrders
    });
  } catch (error) {
    console.error('Error fetching orders:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching orders'
    });
  }
};

// @desc    Get single order
// @route   GET /api/orders/:id
// @access  Private/Admin
exports.getOrder = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id)
      .populate('items.product', 'name price')
      .populate('items.course', 'name price');

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }

    const formattedOrder = {
      orderId: order._id,
      orderDate: order.createdAt,
      customerName: order.client.name,
      customerPhone: order.client.phone,
      customerLocation: order.client.location,
      items: order.items.map(item => ({
        name: item.product?.name || item.course?.name,
        quantity: item.quantity || 1,
        pricePerUnit: item.product?.price || item.course?.price,
        totalPrice: (item.product?.price || item.course?.price) * (item.quantity || 1)
      })),
      totalAmount: order.totalAmount,
      status: order.status,
      paymentStatus: order.paymentStatus
    };

    res.json({
      success: true,
      data: formattedOrder
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to fetch order'
    });
  }
};

// @desc    Create product order
// @route   POST /api/orders/products
// @access  Public
exports.createProductOrder = async (req, res) => {
  try {
    let totalAmount = 0;
    const orderItems = [];

    // Validate products and calculate total
    for (const item of req.body.items) {
      const product = await Product.findById(item.product);
      if (!product) {
        return res.status(404).json({
          success: false,
          message: `Product with id ${item.product} not found`,
        });
      }

      // Check stock
      if (product.quantityInStock < item.quantity) {
        return res.status(400).json({
          success: false,
          message: `Insufficient stock for product ${product.name}`,
        });
      }

      totalAmount += product.price * item.quantity;
      orderItems.push({
        product: product._id,
        quantity: item.quantity,
      });

      // Update stock
      product.quantityInStock -= item.quantity;
      await product.save();
    }

    // Get client info from user session if available
    const clientInfo = req.user ? {
      name: req.user.name,
      email: req.user.email,
      phone: req.user.phone,
      location: req.user.address,
      user: req.user._id // Store reference to user
    } : {
      name: req.body.name,
      email: req.body.email,
      phone: req.body.phone,
      location: req.body.location
    };

    // Validate client info
    if (!clientInfo.name || !clientInfo.email || !clientInfo.phone || !clientInfo.location) {
      return res.status(400).json({
        success: false,
        message: 'Please provide all required client information'
      });
    }

    const order = await Order.create({
      orderType: 'product',
      client: clientInfo,
      items: orderItems,
      totalAmount,
    });

    res.status(201).json({ success: true, data: order });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// @desc    Create course order
// @route   POST /api/orders/courses
// @access  Private
exports.createCourseOrder = async (req, res) => {
  try {
    const course = await Course.findById(req.body.courseId);
    if (!course) {
      return res.status(404).json({
        success: false,
        message: 'Course not found',
      });
    }

    // Check if course is full
    if (course.enrolledStudents.length >= course.maxStudents) {
      return res.status(400).json({
        success: false,
        message: 'Course is full',
      });
    }

    const order = await Order.create({
      orderType: 'course',
      client: {
        name: req.user.name,
        email: req.user.email,
        phone: req.user.phone,
        location: req.user.address,
        user: req.user._id
      },
      items: [{
        course: course._id,
      }],
      totalAmount: course.price,
    });

    // Add student to course after successful payment
    if (order.paymentStatus === 'completed') {
      course.enrolledStudents.push(req.user._id);
      await course.save();
    }

    res.status(201).json({ success: true, data: order });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// @desc    Update order status
// @route   PUT /api/orders/:id/status
// @access  Private/Admin
exports.updateOrderStatus = async (req, res) => {
  try {
    const order = await Order.findByIdAndUpdate(
      req.params.id,
      { status: req.body.status },
      { new: true }
    )
    .populate('items.product', 'name price')
    .populate('items.course', 'name price');

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }

    const formattedOrder = {
      orderId: order._id,
      orderDate: order.createdAt,
      customerName: order.client.name,
      customerPhone: order.client.phone,
      customerLocation: order.client.location,
      items: order.items.map(item => ({
        name: item.product?.name || item.course?.name,
        quantity: item.quantity || 1,
        pricePerUnit: item.product?.price || item.course?.price,
        totalPrice: (item.product?.price || item.course?.price) * (item.quantity || 1)
      })),
      totalAmount: order.totalAmount,
      status: order.status,
      paymentStatus: order.paymentStatus
    };

    res.json({
      success: true,
      data: formattedOrder
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to update order status'
    });
  }
};

// @desc    Update payment status
// @route   PUT /api/orders/:id/payment
// @access  Private/Admin
exports.updatePaymentStatus = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);
    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }

    order.paymentStatus = req.body.paymentStatus;
    await order.save();

    res.json({ success: true, data: order });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// @desc    Get my orders
// @route   GET /api/orders/my-orders
// @access  Private
exports.getMyOrders = async (req, res) => {
  try {
    const orders = await Order.find({ 'client.user': req.user._id })
      .populate({
        path: 'items.product',
        select: 'name description price images category specifications quantity'
      })
      .populate({
        path: 'items.course',
        select: 'name description price startDate endDate imageUrl category'
      })
      .populate({
        path: 'items.service',
        select: 'name description price specifications'
      })
      .sort('-createdAt');

    // Format orders with additional details
    const formattedOrders = orders.map(order => ({
      _id: order._id,
      orderId: order._id,
      status: order.status,
      paymentStatus: order.paymentStatus,
      totalAmount: order.totalAmount,
      createdAt: order.createdAt,
      items: order.items.map(item => ({
        product: item.product ? {
          _id: item.product._id,
          name: item.product.name,
          description: item.product.description,
          price: item.product.price,
          category: item.product.category,
          specifications: item.product.specifications,
          quantity: item.product.quantity
        } : null,
        course: item.course,
        service: item.service,
        quantity: item.quantity
      }))
    }));

    res.json({
      success: true,
      data: formattedOrders
    });
  } catch (error) {
    console.error('Error fetching my orders:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch orders'
    });
  }
};

// @desc    Get my purchases
// @route   GET /api/orders/my-purchases
// @access  Private
exports.getMyPurchases = async (req, res) => {
  try {
    const orders = await Order.find({
      'client.user': req.user._id,
      status: 'completed',
      paymentStatus: 'paid'
    })
    .populate('items.product')
    .sort('-createdAt');

    // Extract unique products from completed orders
    const purchasedProducts = orders.reduce((acc, order) => {
      order.items.forEach(item => {
        if (item.product && !acc.find(p => p._id.toString() === item.product._id.toString())) {
          acc.push(item.product);
        }
      });
      return acc;
    }, []);

    res.json({
      success: true,
      data: purchasedProducts
    });
  } catch (error) {
    console.error('Error in getMyPurchases:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch purchases'
    });
  }
};

// @desc    Get orders by product
// @route   GET /api/orders/product/:productId
// @access  Private/Admin
exports.getOrdersByProduct = async (req, res) => {
  try {
    const orders = await Order.find({
      'items.product': req.params.productId
    })
    .populate('client.user', 'name email phone')
    .populate('items.product', 'name price category specifications')
    .sort('-createdAt');

    // Format the orders to include customer details
    const formattedOrders = orders.map(order => {
      const productItem = order.items.find(
        item => item.product && item.product._id.toString() === req.params.productId
      );

      return {
        _id: order._id,
        customer: {
          name: order.client.user.name,
          email: order.client.user.email,
          phone: order.client.user.phone
        },
        shippingAddress: order.shippingAddress,
        quantity: productItem ? productItem.quantity : 0,
        totalAmount: productItem ? productItem.quantity * productItem.product.price : 0,
        createdAt: order.createdAt,
        status: order.status,
        paymentStatus: order.paymentStatus
      };
    });

    res.json({
      success: true,
      data: formattedOrders
    });
  } catch (error) {
    console.error('Error fetching orders by product:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching orders by product'
    });
  }
};