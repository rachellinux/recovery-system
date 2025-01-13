const Product = require('../models/Product');
const Order = require('../models/Order');

// @desc    Get all products
// @route   GET /api/products
// @access  Public
exports.getProducts = async (req, res) => {
  try {
    const products = await Product.find();
    res.json(products);
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// @desc    Get single product
// @route   GET /api/products/:id
// @access  Public
exports.getProduct = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }
    res.json({ success: true, data: product });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// @desc    Create product
// @route   POST /api/products
// @access  Private/Admin
exports.createProduct = async (req, res) => {
  try {
    // Check if product with same name already exists
    const existingProduct = await Product.findOne({ 
      name: { $regex: new RegExp(`^${req.body.name}$`, 'i') } 
    });

    if (existingProduct) {
      return res.status(400).json({
        success: false,
        message: 'A product with this name already exists'
      });
    }

    // Clean up specifications based on category
    const { category } = req.body;
    let specs = { ...req.body.specifications };

    // Remove irrelevant specifications based on category
    if (category === 'panel') {
      delete specs.capacity;
      delete specs.chemistry;
      delete specs.maxCurrent;
      delete specs.systemVoltage;
      delete specs.wireGauge;
    } else if (category === 'battery') {
      delete specs.wattage;
      delete specs.dimensions;
      delete specs.weight;
      delete specs.maxCurrent;
      delete specs.systemVoltage;
      delete specs.length;
      delete specs.wireGauge;
    } else if (category === 'controller') {
      delete specs.wattage;
      delete specs.dimensions;
      delete specs.weight;
      delete specs.capacity;
      delete specs.chemistry;
      delete specs.length;
      delete specs.wireGauge;
    } else if (category === 'cable') {
      delete specs.wattage;
      delete specs.voltage;
      delete specs.dimensions;
      delete specs.weight;
      delete specs.capacity;
      delete specs.chemistry;
      delete specs.maxCurrent;
      delete specs.systemVoltage;
    }

    // Remove any null or undefined values from specifications
    Object.keys(specs).forEach(key => {
      if (specs[key] === null || specs[key] === undefined || specs[key] === '') {
        delete specs[key];
      }
      if (typeof specs[key] === 'object') {
        Object.keys(specs[key]).forEach(subKey => {
          if (specs[key][subKey] === null || specs[key][subKey] === undefined || specs[key][subKey] === '') {
            delete specs[key][subKey];
          }
        });
        if (Object.keys(specs[key]).length === 0) {
          delete specs[key];
        }
      }
    });

    // Create product with cleaned data
    const productData = {
      ...req.body,
      specifications: specs
    };

    const product = await Product.create(productData);
    res.status(201).json(product);

  } catch (error) {
    console.error('Product creation error:', error);

    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({
        success: false,
        message: messages.join(', ')
      });
    }

    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: 'A product with this name already exists'
      });
    }

    return res.status(500).json({
      success: false,
      message: 'Failed to create product',
      error: error.message
    });
  }
};

// @desc    Update product
// @route   PUT /api/products/:id
// @access  Private/Admin
exports.updateProduct = async (req, res) => {
  try {
    const product = await Product.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );

    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }

    res.json({ success: true, data: product });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// @desc    Delete product
// @route   DELETE /api/products/:id
// @access  Private/Admin
exports.deleteProduct = async (req, res) => {
  try {
    const product = await Product.findByIdAndDelete(req.params.id);

    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }

    res.json({ success: true, data: {} });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// @desc    Update product stock
// @route   PUT /api/products/:id/stock
// @access  Private/Admin
exports.updateStock = async (req, res) => {
  try {
    const { quantityInStock, operation } = req.body;
    const product = await Product.findById(req.params.id);

    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }

    // Handle different stock operations
    if (operation === 'set') {
      product.quantityInStock = quantityInStock;
    } else if (operation === 'add') {
      product.quantityInStock += quantityInStock;
    } else if (operation === 'subtract') {
      if (product.quantityInStock < quantityInStock) {
        return res.status(400).json({ 
          success: false, 
          message: 'Insufficient stock' 
        });
      }
      product.quantityInStock -= quantityInStock;
    }

    // Check low stock threshold
    if (product.quantityInStock <= product.lowStockThreshold) {
      // TODO: Implement notification system for low stock
      console.log(`Low stock alert for product: ${product.name}`);
    }

    await product.save();
    res.json({ success: true, data: product });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// @desc    Get low stock products
// @route   GET /api/products/low-stock
// @access  Private/Admin
exports.getLowStockProducts = async (req, res) => {
  try {
    const products = await Product.find({
      $expr: {
        $lte: ['$quantityInStock', '$lowStockThreshold']
      }
    });

    res.json({ success: true, data: products });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// Add this new controller method for user purchases
exports.getUserPurchases = async (req, res) => {
  try {
    const userId = req.params.userId;
    
    // Ensure user can only access their own purchases
    if (req.user._id.toString() !== userId) {
      return res.status(403).json({
        success: false,
        message: "You can only view your own purchases"
      });
    }

    const orders = await Order.find({ 
      user: userId,
      status: 'completed' // Only get completed orders
    }).populate('items.product');

    // Extract unique products from orders
    const purchasedProducts = orders.reduce((acc, order) => {
      order.items.forEach(item => {
        if (!acc.find(p => p._id.toString() === item.product._id.toString())) {
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
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};