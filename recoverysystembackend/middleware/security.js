const helmet = require('helmet');
const xss = require('xss-clean');
const hpp = require('hpp');

const securityMiddleware = [
  helmet(), // Set security headers
  xss(), // Prevent XSS attacks
  hpp(), // Prevent HTTP Parameter Pollution
];

module.exports = securityMiddleware; 