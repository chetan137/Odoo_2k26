const bcrypt = require('bcryptjs');
const DriverModel = require('../models/driverModel');
const { generateDriverToken, setDriverTokenCookie, clearDriverTokenCookie, verifyDriverToken } = require('../utils/driverJwtHelper');
const { uploadToCloudinary } = require('../config/cloudinary');
const { validatePassword } = require('../utils/passwordValidator');

const VALID_VEHICLE_CATEGORIES = ['BIKE', 'LIGHT', 'MEDIUM', 'HEAVY', 'EXTRA_HEAVY', 'CONTAINER'];

// ─────────────────────────────────────────────────────────────────────────────
// @route  POST /api/drivers/register
// @desc   Driver self-registration
// @access Public
// ─────────────────────────────────────────────────────────────────────────────
const registerDriver = async (req, res) => {
  try {
    const {
      name, email, password, confirmPassword,
      phoneNumber, licenseNumber, licenseExpiryDate,
      vehicleCategory, yearsOfExperience,
    } = req.body;

    // ── 1. Name ────────────────────────────────────────────────────────────────
    if (!name || name.trim().length < 3) {
      return res.status(400).json({ success: false, message: 'Full name must be at least 3 characters.', field: 'name' });
    }

    // ── 2. Email ───────────────────────────────────────────────────────────────
    if (!email || !/\S+@\S+\.\S+/.test(email)) {
      return res.status(400).json({ success: false, message: 'A valid email is required.', field: 'email' });
    }

    // ── 3. Password ────────────────────────────────────────────────────────────
    const pwCheck = validatePassword(password);
    if (!pwCheck.valid) {
      return res.status(400).json({ success: false, message: pwCheck.message, field: 'password' });
    }
    if (password !== confirmPassword) {
      return res.status(400).json({ success: false, message: 'Passwords do not match.', field: 'confirmPassword' });
    }

    // ── 4. Phone ───────────────────────────────────────────────────────────────
    if (!phoneNumber || !/^\d{10,15}$/.test(phoneNumber.replace(/[\s\-\+]/g, ''))) {
      return res.status(400).json({ success: false, message: 'Phone number must be 10–15 digits.', field: 'phoneNumber' });
    }

    // ── 5. License number ──────────────────────────────────────────────────────
    if (!licenseNumber || licenseNumber.trim().length < 5) {
      return res.status(400).json({ success: false, message: 'License number must be at least 5 characters.', field: 'licenseNumber' });
    }

    // ── 6. License expiry — must be a future date ──────────────────────────────
    const expiryDate = new Date(licenseExpiryDate);
    if (isNaN(expiryDate.getTime()) || expiryDate <= new Date()) {
      return res.status(400).json({ success: false, message: 'License expiry date must be a valid future date.', field: 'licenseExpiryDate' });
    }

    // ── 7. Vehicle category ───────────────────────────────────────────────────
    if (!vehicleCategory || !VALID_VEHICLE_CATEGORIES.includes(vehicleCategory.toUpperCase())) {
      return res.status(400).json({ success: false, message: 'Vehicle category must be LIGHT, MEDIUM, HEAVY, EXTRA_HEAVY, or CONTAINER.', field: 'vehicleCategory' });
    }

    // ── 8. Years of experience ────────────────────────────────────────────────
    const experience = parseInt(yearsOfExperience, 10);
    if (isNaN(experience) || experience < 0) {
      return res.status(400).json({ success: false, message: 'Years of experience must be 0 or more.', field: 'yearsOfExperience' });
    }

    // ── 9. Uniqueness checks ──────────────────────────────────────────────────
    const [existingEmail, existingLicense] = await Promise.all([
      DriverModel.findByEmail(email),
      DriverModel.findByLicense(licenseNumber.trim().toUpperCase()),
    ]);

    if (existingEmail) {
      return res.status(409).json({ success: false, message: 'A driver account with this email already exists.', field: 'email' });
    }
    if (existingLicense) {
      return res.status(409).json({ success: false, message: 'This license number is already registered.', field: 'licenseNumber' });
    }

    // ── 10. Cloudinary upload (if file attached) ──────────────────────────────
    let licensePhotoUrl = null;
    if (req.file) {
      // Server-side MIME validation (never trust req.body)
      const allowedMimes = ['image/jpeg', 'image/png', 'application/pdf'];
      if (!allowedMimes.includes(req.file.mimetype)) {
        return res.status(400).json({ success: false, message: 'File must be JPG, PNG or PDF.', field: 'licensePhoto' });
      }
      if (req.file.size > 5 * 1024 * 1024) {
        return res.status(400).json({ success: false, message: 'File size must not exceed 5MB.', field: 'licensePhoto' });
      }
      try {
        const resourceType = req.file.mimetype === 'application/pdf' ? 'raw' : 'image';
        const result = await uploadToCloudinary(req.file.buffer, 'fleet/licenses', resourceType);
        licensePhotoUrl = result.secure_url;
      } catch (uploadErr) {
        console.error('Cloudinary upload error:', uploadErr.message);
        return res.status(500).json({ success: false, message: 'Failed to upload license photo. Please try again.' });
      }
    }

    // ── 11. Hash password & create ────────────────────────────────────────────
    const hashedPassword = await bcrypt.hash(password, 12);
    const driver = await DriverModel.create({
      name, email, hashedPassword,
      phoneNumber: phoneNumber.replace(/[\s\-]/g, ''),
      licenseNumber, licenseExpiryDate,
      vehicleCategory: vehicleCategory.toUpperCase(),
      yearsOfExperience: experience,
      licensePhotoUrl,
    });

    return res.status(201).json({
      success: true,
      message: 'Registration successful! Your account is pending admin approval. You will be notified once approved.',
      driver: {
        id:         driver.id,
        driverId:   driver.driverId,
        name:       driver.name,
        email:      driver.email,
        isApproved: driver.isApproved,
        status:     driver.status,
      },
    });
  } catch (error) {
    console.error('Driver registration error:', error);
    return res.status(500).json({ success: false, message: 'An internal server error occurred.' });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// @route  POST /api/drivers/login
// @desc   Driver login — only approved drivers can log in
// @access Public
// ─────────────────────────────────────────────────────────────────────────────
const loginDriver = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Email and password are required.' });
    }

    // 1. Find driver (full record with password)
    const driver = await DriverModel.findByEmailWithPassword(email);
    if (!driver) {
      return res.status(404).json({ success: false, message: 'No driver account found with this email.', field: 'email' });
    }

    // 2. Verify password
    const isPasswordValid = await bcrypt.compare(password, driver.password);
    if (!isPasswordValid) {
      return res.status(401).json({ success: false, message: 'Invalid password.', field: 'password' });
    }

    // 3. Inactive account
    if (driver.status === 'INACTIVE') {
      return res.status(403).json({
        success: false,
        message: 'Your driver account has been deactivated. Contact fleet management.',
        code: 'DRIVER_INACTIVE',
      });
    }

    // 4. Approval gate — only approved drivers can log in
    if (!driver.isApproved) {
      return res.status(403).json({
        success: false,
        message: 'Your account is pending approval. Please wait for an administrator to review your application.',
        code: 'DRIVER_PENDING_APPROVAL',
        pendingApproval: true,
      });
    }

    // 5. Generate driver JWT (separate secret from system users)
    const token = generateDriverToken({ driverId: driver.id });
    setDriverTokenCookie(res, token);

    return res.status(200).json({
      success: true,
      message: `Welcome back, ${driver.name}! Drive safe 🚛`,
      driver: {
        id:               driver.id,
        driverId:         driver.driverId,
        name:             driver.name,
        email:            driver.email,
        phoneNumber:      driver.phoneNumber,
        licenseNumber:    driver.licenseNumber,
        vehicleCategory:  driver.vehicleCategory,
        status:           driver.status,
        isApproved:       driver.isApproved,
      },
      token,
    });
  } catch (error) {
    console.error('Driver login error:', error);
    return res.status(500).json({ success: false, message: 'An internal server error occurred.' });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// @route  POST /api/drivers/logout
// @access Private (driver)
// ─────────────────────────────────────────────────────────────────────────────
const logoutDriver = (req, res) => {
  clearDriverTokenCookie(res);
  return res.status(200).json({ success: true, message: 'Logged out successfully.' });
};

// ─────────────────────────────────────────────────────────────────────────────
// @route  GET /api/drivers/me
// @access Private (driver)
// ─────────────────────────────────────────────────────────────────────────────
const getDriverMe = async (req, res) => {
  try {
    return res.status(200).json({ success: true, driver: req.driver });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'An internal server error occurred.' });
  }
};

module.exports = { registerDriver, loginDriver, logoutDriver, getDriverMe };
