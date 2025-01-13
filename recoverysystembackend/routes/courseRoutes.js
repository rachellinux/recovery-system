const express = require('express');
const router = express.Router();
const {
  getCourses,
  getCourse,
  createCourse,
  updateCourse,
  deleteCourse,
  enrollCourse,
  getEnrolledCourses,
  createCourseOrder
} = require('../controllers/courseController');
const { protect, authorize } = require('../middleware/auth');

// Place specific routes before parameterized routes
router.route('/enrolled').get(protect, getEnrolledCourses);
router.route('/order').post(protect, createCourseOrder);

router
  .route('/')
  .get(getCourses)
  .post(protect, authorize('admin'), createCourse);

router
  .route('/:id')
  .get(getCourse)
  .put(protect, authorize('admin'), updateCourse)
  .delete(protect, authorize('admin'), deleteCourse);

router.route('/:id/enroll').post(protect, enrollCourse);

module.exports = router; 