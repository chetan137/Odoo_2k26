const DriverModel = require('../models/driverModel');

// ─────────────────────────────────────────────────────────────────────────────
// @route  GET /api/admin/drivers
// @desc   List all drivers with optional filters
// @access ADMIN, MANAGER
// ─────────────────────────────────────────────────────────────────────────────
const listDrivers = async (req, res) => {
  try {
    const page    = parseInt(req.query.page, 10)  || 1;
    const limit   = parseInt(req.query.limit, 10) || 20;
    const { status, isApproved, vehicleCategory } = req.query;

    const filters = {};
    if (status)          filters.status = status;
    if (vehicleCategory) filters.vehicleCategory = vehicleCategory;
    if (isApproved !== undefined) filters.isApproved = isApproved === 'true';

    const result      = await DriverModel.findAll({ page, limit, ...filters });
    const byStatus    = await DriverModel.countByStatus();
    const byApproval  = await DriverModel.countByApproval();

    return res.status(200).json({
      success: true,
      data: result,
      stats: {
        byStatus:   byStatus.reduce((a, s)  => ({ ...a, [s.status]:     s._count._all }), {}),
        byApproval: byApproval.reduce((a, s) => ({ ...a, [String(s.isApproved)]: s._count._all }), {}),
      },
    });
  } catch (error) {
    console.error('Admin listDrivers error:', error);
    return res.status(500).json({ success: false, message: 'Failed to fetch drivers.' });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// @route  GET /api/admin/drivers/:id
// @access ADMIN, MANAGER
// ─────────────────────────────────────────────────────────────────────────────
const getDriver = async (req, res) => {
  try {
    const driver = await DriverModel.findById(req.params.id);
    if (!driver) return res.status(404).json({ success: false, message: 'Driver not found.' });
    return res.status(200).json({ success: true, driver });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Failed to fetch driver.' });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// @route  PATCH /api/admin/drivers/:id/approve
// @desc   Approve or revoke a driver — ADMIN only
// @access ADMIN
// ─────────────────────────────────────────────────────────────────────────────
const approveDriver = async (req, res) => {
  try {
    const { isApproved } = req.body;

    if (typeof isApproved !== 'boolean') {
      return res.status(400).json({ success: false, message: 'isApproved must be a boolean.', field: 'isApproved' });
    }

    const driver = await DriverModel.findById(req.params.id);
    if (!driver) return res.status(404).json({ success: false, message: 'Driver not found.' });

    const updated = await DriverModel.setApproval(req.params.id, isApproved);

    return res.status(200).json({
      success: true,
      message: `Driver ${isApproved ? 'approved' : 'approval revoked'} successfully.`,
      driver: updated,
    });
  } catch (error) {
    console.error('Admin approveDriver error:', error);
    return res.status(500).json({ success: false, message: 'Failed to update driver approval.' });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// @route  PATCH /api/admin/drivers/:id/status
// @desc   Update driver operational status
// @access ADMIN, MANAGER
// ─────────────────────────────────────────────────────────────────────────────
const updateDriverStatus = async (req, res) => {
  try {
    const { status } = req.body;

    const VALID_STATUSES = ['AVAILABLE', 'ON_TRIP', 'INACTIVE'];
    if (!status || !VALID_STATUSES.includes(status)) {
      return res.status(400).json({ success: false, message: 'Status must be AVAILABLE, ON_TRIP, or INACTIVE.', field: 'status' });
    }

    const driver = await DriverModel.findById(req.params.id);
    if (!driver) return res.status(404).json({ success: false, message: 'Driver not found.' });

    const updated = await DriverModel.setStatus(req.params.id, status);
    return res.status(200).json({
      success: true,
      message: `Driver status updated to ${status}.`,
      driver: updated,
    });
  } catch (error) {
    console.error('Admin updateDriverStatus error:', error);
    return res.status(500).json({ success: false, message: 'Failed to update driver status.' });
  }
};

module.exports = { listDrivers, getDriver, approveDriver, updateDriverStatus };
