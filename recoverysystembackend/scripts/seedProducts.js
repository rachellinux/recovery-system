const mongoose = require('mongoose');
const Product = require('../models/Product');
require('dotenv').config();

const products = [
  {
    name: "250W Solar Panel",
    category: "panel",
    description: "High-efficiency monocrystalline solar panel",
    specifications: {
      wattage: "250W",
      voltage: "24V",
      dimensions: "1640x992x35mm",
      weight: "18kg"
    },
    price: 150000,
    quantityInStock: 20
  },
  {
    name: "200Ah Battery",
    category: "battery",
    description: "Deep cycle lithium battery",
    specifications: {
      capacity: "200Ah",
      chemistry: "Lithium-ion",
      voltage: "12V",
      weight: "22kg"
    },
    price: 450000,
    quantityInStock: 15
  }
];

const seedProducts = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to MongoDB');

    // Clear existing products
    await Product.deleteMany({});
    console.log('Cleared existing products');

    // Insert new products
    const result = await Product.insertMany(products);
    console.log('Products seeded successfully:', result);

    mongoose.connection.close();
  } catch (error) {
    console.error('Error seeding products:', error);
    process.exit(1);
  }
};

seedProducts(); 