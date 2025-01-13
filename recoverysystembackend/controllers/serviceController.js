const Service = require('../models/Service');
const Product = require('../models/Product');
const Order = require('../models/Order');
const User = require('../models/User');

// @desc    Get all services with products
// @route   GET /api/services
// @access  Public
exports.getServices = async (req, res) => {
  try {
    const services = await Service.find()
      .populate('products.panel.product')
      .populate('products.battery.product')
      .populate('products.controller.product')
      .populate('products.cable.product');
    res.json({ success: true, data: services });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// @desc    Get available products for service creation
// @route   GET /api/services/available-products
// @access  Private/Admin
exports.getAvailableProducts = async (req, res) => {
  try {
    // Add console.log to debug the query
    console.log('Fetching available products...');
    
    const products = await Product.find({ 
      quantity: { $gt: 0 },
      category: { 
        $in: ['Solar Panel', 'Battery', 'Controller', 'Cable'] 
      }
    }).select('name price specifications quantity category');
    
    // Log the found products
    console.log('Found products:', products);
    
    const formattedProducts = products.map(product => ({
      _id: product._id,
      name: product.name,
      price: product.price,
      quantity: product.quantity,
      category: product.category,
      specifications: product.specifications
    }));

    // Log the formatted response
    console.log('Sending response:', formattedProducts);

    res.json({ 
      success: true, 
      data: formattedProducts
    });
  } catch (error) {
    console.error('Error fetching products:', error);
    res.status(400).json({ success: false, message: error.message });
  }
};

// @desc    Create service
// @route   POST /api/services
// @access  Private/Admin
exports.createService = async (req, res) => {
  try {
    let totalProductsCost = 0;
    
    // Calculate total products cost
    for (const type of ['panel', 'battery', 'controller', 'cable']) {
      const item = req.body.products[type];
      const product = await Product.findById(item.product);
      
      if (!product) {
        return res.status(404).json({
          success: false,
          message: `${type} product not found`
        });
      }
      
      if (product.quantity < item.quantity) {
        return res.status(400).json({
          success: false,
          message: `Insufficient quantity for ${type}`
        });
      }
      
      totalProductsCost += product.price * item.quantity;
    }

    // Add total cost to request body
    req.body.totalCost = totalProductsCost + parseFloat(req.body.laborCost);

    const service = await Service.create(req.body);
    
    // Populate the service before sending response
    const populatedService = await Service.findById(service._id)
      .populate('products.panel.product')
      .populate('products.battery.product')
      .populate('products.controller.product')
      .populate('products.cable.product');

    res.status(201).json({ success: true, data: populatedService });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// @desc    Update service
// @route   PUT /api/services/:id
// @access  Private/Admin
exports.updateService = async (req, res) => {
  try {
    console.log('Updating service:', req.params.id);
    console.log('Update data:', req.body);

    const service = await Service.findById(req.params.id);
    if (!service) {
      return res.status(404).json({ success: false, message: 'Service not found' });
    }

    let totalProductsCost = 0;
    
    // Calculate new total cost
    for (const type of ['panel', 'battery', 'controller', 'cable']) {
      const item = req.body.products[type];
      const product = await Product.findById(item.product);
      
      if (!product) {
        return res.status(404).json({
          success: false,
          message: `${type} product not found`
        });
      }
      
      totalProductsCost += product.price * item.quantity;
    }

    // Add total cost to request body
    req.body.totalCost = totalProductsCost + parseFloat(req.body.laborCost);

    const updatedService = await Service.findByIdAndUpdate(
      req.params.id,
      req.body,
      {
        new: true,
        runValidators: true
      }
    );

    // Populate the service before sending response
    const populatedService = await Service.findById(updatedService._id)
      .populate('products.panel.product')
      .populate('products.battery.product')
      .populate('products.controller.product')
      .populate('products.cable.product');

    console.log('Service updated successfully');
    res.json({ success: true, data: populatedService });
  } catch (error) {
    console.error('Update error:', error);
    res.status(400).json({ success: false, message: error.message });
  }
};

// @desc    Delete service
// @route   DELETE /api/services/:id
// @access  Private/Admin
exports.deleteService = async (req, res) => {
  try {
    console.log('Deleting service with ID:', req.params.id);
    
    const service = await Service.findByIdAndDelete(req.params.id);
    if (!service) {
      console.log('Service not found');
      return res.status(404).json({ success: false, message: 'Service not found' });
    }
    
    console.log('Service deleted successfully');
    res.json({ success: true, data: {} });
  } catch (error) {
    console.error('Delete error:', error);
    res.status(400).json({ success: false, message: error.message });
  }
};

// @desc    Request service installation
// @route   POST /api/services/:id/request
// @access  Public
exports.requestService = async (req, res) => {
  try {
    console.log('Requesting service:', req.params.id);
    console.log('Request body:', req.body);

    const service = await Service.findById(req.params.id)
      .populate('products.panel.product')
      .populate('products.battery.product')
      .populate('products.controller.product')
      .populate('products.cable.product');
    
    if (!service) {
      return res.status(404).json({ 
        success: false, 
        message: 'Service not found' 
      });
    }

    let clientData = {};
    
    // If user is authenticated, get their information
    if (req.user) {
      const user = await User.findById(req.user._id);
      clientData = {
        name: user.name,
        email: user.email,
        phone: user.phone,
        location: user.location,
        user: user._id
      };
    } else {
      // Validate required client information for non-authenticated users
      const requiredFields = ['name', 'email', 'phone', 'location'];
      for (const field of requiredFields) {
        if (!req.body[field]) {
          return res.status(400).json({
            success: false,
            message: `Please provide ${field}`
          });
        }
      }
      clientData = {
        name: req.body.name,
        email: req.body.email,
        phone: req.body.phone,
        location: req.body.location
      };
    }

    // Create order for the service
    const order = await Order.create({
      orderType: 'service',
      client: clientData,
      items: [{
        service: service._id,
        quantity: 1
      }],
      totalAmount: service.totalCost,
      preferredDates: {
        startDate: req.body.startDate,
        endDate: req.body.endDate
      },
      status: 'pending'
    });

    console.log('Order created:', order);

    res.status(201).json({ 
      success: true, 
      message: 'Service request submitted successfully',
      data: order 
    });
  } catch (error) {
    console.error('Service request error:', error);
    res.status(400).json({ 
      success: false, 
      message: error.message || 'Failed to submit service request' 
    });
  }
}; 