import { body, param, query, validationResult } from 'express-validator';
import { STUDENT_ID_REGEX } from "../services/student.service.js";

// Middleware to check validation results
export const validate = (validations) => {
  return async (req, res, next) => {
    await Promise.all(validations.map(validation => validation.run(req)));

    const errors = validationResult(req);
    if (errors.isEmpty()) {
      return next();
    }

    return res.status(400).json({
      status: 400,
      message: 'Validation failed',
      errors: errors.array().map(err => ({
        field: err.path,
        message: err.msg,
        value: err.value
      }))
    });
  };
};

// Student validation rules
export const studentValidations = {
  register: [
    body('studentId')
      .notEmpty().withMessage('Student ID is required')
      .matches(STUDENT_ID_REGEX).withMessage('Invalid student ID format'),
    
    body('fullName')
      .notEmpty().withMessage('Full name is required')
      .isLength({ min: 3, max: 255 }).withMessage('Full name must be between 3 and 255 characters')
      .matches(/^[a-zA-Z\s]+$/).withMessage('Full name can only contain letters and spaces'),
    
    body('yearOfEntry')
      .notEmpty().withMessage('Year of entry is required')
      .isInt({ min: 2000, max: new Date().getFullYear() + 1 })
      .withMessage(`Year of entry must be between 2000 and ${new Date().getFullYear() + 1}`),
    
    body('gender')
      .optional()
      .isIn(['male', 'female', 'other']).withMessage('Gender must be male, female, or other'),
    
    body('department')
      .notEmpty().withMessage('Department is required')
      .isLength({ min: 2, max: 100 }).withMessage('Department must be between 2 and 100 characters'),
    
    body('email')
      .optional()
      .isEmail().withMessage('Invalid email format')
      .normalizeEmail(),
    
    body('phone')
      .optional()
      .matches(/^\+?[0-9]{10,15}$/).withMessage('Phone number must be 10-15 digits, optionally starting with +'),
  ],

  update: [
    param('studentId')
      .notEmpty().withMessage('Student ID is required')
      .matches(STUDENT_ID_REGEX).withMessage('Invalid student ID format'),
    
    body('fullName')
      .optional()
      .isLength({ min: 3, max: 255 }).withMessage('Full name must be between 3 and 255 characters')
      .matches(/^[a-zA-Z\s]+$/).withMessage('Full name can only contain letters and spaces'),
    
    body('yearOfEntry')
      .optional()
      .isInt({ min: 2000, max: new Date().getFullYear() + 1 })
      .withMessage(`Year of entry must be between 2000 and ${new Date().getFullYear() + 1}`),
    
    body('department')
      .optional()
      .isLength({ min: 2, max: 100 }).withMessage('Department must be between 2 and 100 characters'),
  ],

  getByStudentId: [
    param('studentId')
      .notEmpty().withMessage('Student ID is required')
      .matches(STUDENT_ID_REGEX).withMessage('Invalid student ID format'),
  ],

  list: [
    query('page')
      .optional()
      .isInt({ min: 1 }).withMessage('Page must be a positive integer')
      .toInt(),
    
    query('limit')
      .optional()
      .isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100')
      .toInt(),
    
    query('department')
      .optional()
      .isLength({ min: 2, max: 100 }).withMessage('Department must be between 2 and 100 characters'),
    
    query('yearOfEntry')
      .optional()
      .isInt({ min: 2000, max: new Date().getFullYear() + 1 })
      .withMessage('Invalid year of entry')
      .toInt(),
    
    query('isActive')
      .optional()
      .isBoolean().withMessage('isActive must be a boolean')
      .toBoolean(),
  ],

  search: [
    query('q')
      .optional()
      .isLength({ min: 2, max: 100 }).withMessage('Search query must be between 2 and 100 characters'),
    
    query('page')
      .optional()
      .isInt({ min: 1 }).withMessage('Page must be a positive integer')
      .toInt(),
    
    query('limit')
      .optional()
      .isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100')
      .toInt(),
  ],
};

// Laptop validation rules
export const laptopValidations = {
  register: [
    param('studentId')
      .notEmpty().withMessage('Student ID is required')
      .matches(STUDENT_ID_REGEX).withMessage('Invalid student ID format'),
    
    body('brand')
      .notEmpty().withMessage('Brand is required')
      .isLength({ min: 2, max: 100 }).withMessage('Brand must be between 2 and 100 characters'),
    
    body('model')
      .notEmpty().withMessage('Model is required')
      .isLength({ min: 2, max: 100 }).withMessage('Model must be between 2 and 100 characters'),
    
    body('serialNumber')
      .notEmpty().withMessage('Serial number is required')
      .isLength({ min: 5, max: 100 }).withMessage('Serial number must be between 5 and 100 characters')
      .matches(/^[a-zA-Z0-9-]+$/).withMessage('Serial number can only contain letters, numbers, and hyphens'),
    
    body('macAddress')
      .optional()
      .matches(/^([0-9A-Fa-f]{2}:){5}[0-9A-Fa-f]{2}$/).withMessage('Invalid MAC address format (e.g., 00:1A:2B:3C:4D:5E)'),
    
    body('purchaseYear')
      .optional()
      .isInt({ min: 1990, max: new Date().getFullYear() })
      .withMessage(`Purchase year must be between 1990 and ${new Date().getFullYear()}`)
      .toInt(),
  ],

  getBySerial: [
    param('serialNumber')
      .notEmpty().withMessage('Serial number is required')
      .isLength({ min: 5, max: 100 }).withMessage('Serial number must be between 5 and 100 characters'),
  ],

  update: [
    param('laptopId')
      .notEmpty().withMessage('Laptop ID is required')
      .isUUID().withMessage('Invalid laptop ID format'),
    
    body('brand')
      .optional()
      .isLength({ min: 2, max: 100 }).withMessage('Brand must be between 2 and 100 characters'),
    
    body('model')
      .optional()
      .isLength({ min: 2, max: 100 }).withMessage('Model must be between 2 and 100 characters'),
  ],
};

// Authentication validation rules
export const authValidations = {
  register: [
    body('username')
      .notEmpty().withMessage('Username is required')
      .isLength({ min: 3, max: 50 }).withMessage('Username must be between 3 and 50 characters')
      .matches(/^[a-zA-Z0-9_]+$/).withMessage('Username can only contain letters, numbers, and underscores'),
    
    body('email')
      .notEmpty().withMessage('Email is required')
      .isEmail().withMessage('Invalid email format')
      .normalizeEmail(),
    
    body('password')
      .notEmpty().withMessage('Password is required')
      .isLength({ min: 8 }).withMessage('Password must be at least 8 characters')
      .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/)
      .withMessage('Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character'),
    
    body('role')
      .notEmpty().withMessage('Role is required')
      .isIn(['admin', 'security']).withMessage('Role must be admin or security'),
    
    body('fullName')
      .optional()
      .isLength({ min: 3, max: 255 }).withMessage('Full name must be between 3 and 255 characters'),
  ],

  login: [
    body('email')
      .notEmpty().withMessage('Email is required')
      .isEmail().withMessage('Invalid email format')
      .normalizeEmail(),
    
    body('password')
      .notEmpty().withMessage('Password is required'),
  ],

  changePassword: [
    body('currentPassword')
      .notEmpty().withMessage('Current password is required'),
    
    body('newPassword')
      .notEmpty().withMessage('New password is required')
      .isLength({ min: 8 }).withMessage('New password must be at least 8 characters')
      .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/)
      .withMessage('New password must contain at least one uppercase letter, one lowercase letter, one number, and one special character'),
  ],

  bootstrapAdmin: [
    body('username')
      .notEmpty().withMessage('Username is required')
      .isLength({ min: 3, max: 50 }).withMessage('Username must be between 3 and 50 characters'),
    
    body('email')
      .notEmpty().withMessage('Email is required')
      .isEmail().withMessage('Invalid email format'),
    
    body('password')
      .notEmpty().withMessage('Password is required')
      .isLength({ min: 8 }).withMessage('Password must be at least 8 characters'),
  ],
};

// Verification validation rules
export const verificationValidations = {
  scan: [
    body('studentId')
      .notEmpty().withMessage('Student ID is required')
      .matches(STUDENT_ID_REGEX).withMessage('Invalid student ID format'),
    
    body('scannerType')
      .optional()
      .isIn(['barcode', 'qr', 'rfid', 'manual', 'unknown'])
      .withMessage('Scanner type must be barcode, qr, rfid, manual, or unknown'),
    
    body('gateLocation')
      .optional()
      .isLength({ max: 100 }).withMessage('Gate location too long'),
  ],

  check: [
    param('studentId')
      .notEmpty().withMessage('Student ID is required')
      .matches(STUDENT_ID_REGEX).withMessage('Invalid student ID format'),
  ],
};

// Alert validation rules
export const alertValidations = {
  list: [
    query('page')
      .optional()
      .isInt({ min: 1 }).withMessage('Page must be a positive integer')
      .toInt(),
    
    query('limit')
      .optional()
      .isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100')
      .toInt(),
    
    query('type')
      .optional()
      .isIn(['unregistered_id', 'no_laptop', 'suspicious_activity'])
      .withMessage('Invalid alert type'),
    
    query('status')
      .optional()
      .isIn(['active', 'resolved', 'false_alarm'])
      .withMessage('Invalid alert status'),
  ],

  resolve: [
    param('alertId')
      .notEmpty().withMessage('Alert ID is required')
      .isUUID().withMessage('Invalid alert ID format'),
    
    body('notes')
      .notEmpty().withMessage('Resolution notes are required')
      .isLength({ min: 5, max: 1000 }).withMessage('Notes must be between 5 and 1000 characters'),
  ],

  addNote: [
    param('alertId')
      .notEmpty().withMessage('Alert ID is required')
      .isUUID().withMessage('Invalid alert ID format'),
    
    body('note')
      .notEmpty().withMessage('Note is required')
      .isLength({ min: 5, max: 1000 }).withMessage('Note must be between 5 and 1000 characters'),
  ],
};

// User management validation rules
export const userValidations = {
  create: [
    body('username')
      .notEmpty().withMessage('Username is required')
      .isLength({ min: 3, max: 50 }).withMessage('Username must be between 3 and 50 characters'),
    
    body('email')
      .notEmpty().withMessage('Email is required')
      .isEmail().withMessage('Invalid email format'),
    
    body('role')
      .notEmpty().withMessage('Role is required')
      .isIn(['admin', 'security']).withMessage('Role must be admin or security'),
    
    body('fullName')
      .optional()
      .isLength({ min: 3, max: 255 }).withMessage('Full name must be between 3 and 255 characters'),
  ],

  updateStatus: [
    param('userId')
      .notEmpty().withMessage('User ID is required')
      .isUUID().withMessage('Invalid user ID format'),
    
    body('isActive')
      .notEmpty().withMessage('isActive is required')
      .isBoolean().withMessage('isActive must be a boolean'),
    
    body('deactivationReason')
      .if(body('isActive').equals('false'))
      .notEmpty().withMessage('Deactivation reason is required when deactivating a user')
      .isLength({ min: 5, max: 500 }).withMessage('Deactivation reason must be between 5 and 500 characters'),
  ],
};

// Settings validation rules
export const settingsValidations = {
  department: {
    create: [
      body('name')
        .notEmpty().withMessage('Department name is required')
        .isLength({ min: 2, max: 255 }).withMessage('Department name must be between 2 and 255 characters'),
      
      body('code')
        .notEmpty().withMessage('Department code is required')
        .isLength({ min: 2, max: 50 }).withMessage('Department code must be between 2 and 50 characters')
        .matches(/^[A-Z0-9_]+$/).withMessage('Department code can only contain uppercase letters, numbers, and underscores'),
    ],
  },

  gate: {
    create: [
      body('name')
        .notEmpty().withMessage('Gate name is required')
        .isLength({ min: 2, max: 100 }).withMessage('Gate name must be between 2 and 100 characters'),
      
      body('scannerType')
        .notEmpty().withMessage('Scanner type is required')
        .isIn(['barcode', 'qr', 'rfid', 'manual']).withMessage('Invalid scanner type'),
      
      body('ipAddress')
        .optional()
        .isIP().withMessage('Invalid IP address format'),
    ],
  },
};