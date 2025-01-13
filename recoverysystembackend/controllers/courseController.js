const Course = require('../models/Course');
const Order = require('../models/Order');

// @desc    Get all courses
// @route   GET /api/courses
// @access  Public
exports.getCourses = async (req, res) => {
  try {
    console.log('Fetching courses...'); // Debug log
    const courses = await Course.find().populate('enrolledStudents', 'name email');
    console.log('Found courses:', courses); // Debug log
    res.json({ success: true, data: courses });
  } catch (error) {
    console.error('Error in getCourses:', error); // Debug log
    res.status(400).json({ success: false, message: error.message });
  }
};

// @desc    Get single course
// @route   GET /api/courses/:id
// @access  Public
exports.getCourse = async (req, res) => {
  try {
    const course = await Course.findById(req.params.id).populate('enrolledStudents', 'name email');
    if (!course) {
      return res.status(404).json({ success: false, message: 'Course not found' });
    }
    res.json({ success: true, data: course });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// @desc    Create course
// @route   POST /api/courses
// @access  Private/Admin
exports.createCourse = async (req, res) => {
  try {
    const course = await Course.create(req.body);
    res.status(201).json({ success: true, data: course });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// @desc    Update course
// @route   PUT /api/courses/:id
// @access  Private/Admin
exports.updateCourse = async (req, res) => {
  try {
    const course = await Course.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );

    if (!course) {
      return res.status(404).json({ success: false, message: 'Course not found' });
    }

    res.json({ success: true, data: course });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// @desc    Delete course
// @route   DELETE /api/courses/:id
// @access  Private/Admin
exports.deleteCourse = async (req, res) => {
  try {
    const course = await Course.findById(req.params.id);

    if (!course) {
      return res.status(404).json({ success: false, message: 'Course not found' });
    }

    // Check if there are enrolled students
    if (course.enrolledStudents.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Cannot delete course with enrolled students'
      });
    }

    await course.remove();
    res.json({ success: true, data: {} });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// @desc    Enroll in course
// @route   POST /api/courses/:id/enroll
// @access  Private
exports.enrollCourse = async (req, res) => {
  try {
    const course = await Course.findById(req.params.id);
    if (!course) {
      return res.status(404).json({ success: false, message: 'Course not found' });
    }

    // Check if course is full
    if (course.enrolledStudents.length >= course.maxStudents) {
      return res.status(400).json({ success: false, message: 'Course is full' });
    }

    // Check if student is already enrolled
    if (course.enrolledStudents.includes(req.user.id)) {
      return res.status(400).json({ success: false, message: 'Already enrolled' });
    }

    // Add payment check here
    // TODO: Implement payment verification

    course.enrolledStudents.push(req.user.id);
    await course.save();

    res.json({ success: true, data: course });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// @desc    Get enrolled courses
// @route   GET /api/courses/enrolled
// @access  Private
exports.getEnrolledCourses = async (req, res) => {
  try {
    console.log('Fetching enrolled courses for user:', req.user._id);

    // Find all orders for this user that contain courses
    const orders = await Order.find({
      'client.user': req.user._id,
      'orderType': 'course'
    })
    .populate({
      path: 'items.course',
      select: 'name description price startDate endDate instructor materials status imageUrl level category maxStudents enrolledStudents'
    })
    .sort('-createdAt');

    console.log('Found orders:', JSON.stringify(orders, null, 2));

    // Extract unique courses from orders
    const coursesMap = new Map();
    
    for (const order of orders) {
      for (const item of order.items) {
        if (item.course && !coursesMap.has(item.course._id.toString())) {
          // Get the most recent order status for this course
          const latestOrder = await Order.findOne({
            'client.user': req.user._id,
            'orderType': 'course',
            'items.course': item.course._id
          }).sort('-createdAt');

          coursesMap.set(item.course._id.toString(), {
            id: item.course._id,
            name: item.course.name,
            description: item.course.description,
            price: item.course.price,
            startDate: item.course.startDate,
            endDate: item.course.endDate,
            instructor: item.course.instructor,
            materials: item.course.materials,
            status: item.course.status,
            imageUrl: item.course.imageUrl,
            level: item.course.level,
            category: item.course.category,
            orderStatus: latestOrder.status,
            enrollmentDate: latestOrder.createdAt
          });
        }
      }
    }

    const formattedCourses = Array.from(coursesMap.values());
    console.log('Formatted courses:', formattedCourses);

    res.json({
      success: true,
      count: formattedCourses.length,
      data: formattedCourses
    });
  } catch (error) {
    console.error('Error in getEnrolledCourses:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching enrolled courses',
      error: error.message
    });
  }
};

// @desc    Create course order and enroll
// @route   POST /api/courses/order
// @access  Private
exports.createCourseOrder = async (req, res) => {
  try {
    const { items, totalAmount, client } = req.body;
    const courseId = items[0].courseId;

    // Check if course exists and has available spots
    const course = await Course.findById(courseId);
    if (!course) {
      return res.status(404).json({ 
        success: false, 
        message: 'Course not found' 
      });
    }

    // Check if course is full
    if (course.maxStudents && course.enrolledStudents.length >= course.maxStudents) {
      return res.status(400).json({ 
        success: false, 
        message: 'Course is full' 
      });
    }

    // Check if student is already enrolled by checking orders
    const existingOrder = await Order.findOne({
      'client.user': req.user._id,
      'orderType': 'course',
      'items.course': courseId
    });

    if (existingOrder) {
      return res.status(400).json({ 
        success: false, 
        message: 'You are already enrolled in this course' 
      });
    }

    // Create order
    const order = await Order.create({
      orderType: 'course',
      client: {
        name: client.name,
        email: client.email,
        phone: client.phone,
        location: client.location,
        user: req.user._id
      },
      items: [{
        course: courseId,
        quantity: 1,
        price: course.price
      }],
      totalAmount: course.price,
      status: 'processing'
    });

    // Add student to course's enrolledStudents
    if (!course.enrolledStudents.includes(req.user._id)) {
      course.enrolledStudents.push(req.user._id);
      await course.save();
    }

    // Return success response
    res.status(201).json({
      success: true,
      message: 'Successfully enrolled in course',
      data: {
        order: {
          id: order._id,
          status: order.status,
          totalAmount: order.totalAmount
        },
        course: {
          id: course._id,
          name: course.name,
          startDate: course.startDate,
          endDate: course.endDate
        }
      }
    });

  } catch (error) {
    console.error('Error in createCourseOrder:', error);
    res.status(400).json({
      success: false,
      message: 'Failed to create course order',
      error: error.message
    });
  }
};