require('dotenv').config();
const { Pool } = require('pg');
const pool = new Pool({ connectionString: process.env.DATABASE_URL });

// ─── internal helper: log a history record ───────────────────────────────────
async function logHistory(client, {
  vehicleId, eventType, title, description,
  serviceDate = null, cost = null,
  previousValue = null, newValue = null,
  performedBy = 'Admin',
}) {
  await client.query(
    `INSERT INTO vehicle_history
       (vehicle_id, event_type, title, description, service_date, cost, previous_value, new_value, performed_by)
     VALUES ($1, $2::"VehicleEventType", $3, $4, $5, $6, $7, $8, $9)`,
    [vehicleId, eventType, title, description, serviceDate || null, cost || null, previousValue || null, newValue || null, performedBy]
  );
}

// ─── helper: build dimensionLabel ────────────────────────────────────────────
function buildDimensionLabel(l, w, h) {
  if (!l || !w || !h) return '';
  return `${parseFloat(l).toFixed(1)}ft x ${parseFloat(w).toFixed(1)}ft x ${parseFloat(h).toFixed(1)}ft`;
}

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/admin/vehicles — list all vehicles
// ─────────────────────────────────────────────────────────────────────────────
const listVehicles = async (req, res) => {
  try {
    const { status, category } = req.query;
    let where = 'WHERE 1=1';
    const params = [];
    if (status)   { params.push(status);   where += ` AND v.status = $${params.length}::"VehicleStatus"`; }
    if (category) { params.push(category); where += ` AND v.category = $${params.length}::"VehicleCategory"`; }

    const result = await pool.query(
      `SELECT id, vehicle_id, vehicle_name, license_plate, category::text,
              max_capacity, current_odometer, status::text,
              acquisition_cost::float,
              length_ft::float, width_ft::float, height_ft::float, dimension_label,
              created_at
       FROM vehicles v ${where}
       ORDER BY vehicle_id ASC`,
      params
    );

    const stats    = await pool.query(`SELECT status::text, COUNT(*)::int AS cnt FROM vehicles GROUP BY status;`);
    const catStats = await pool.query(`SELECT category::text, COUNT(*)::int AS cnt FROM vehicles GROUP BY category;`);
    const byStatus   = stats.rows.reduce((a, r) => ({ ...a, [r.status]: r.cnt }), {});
    const byCategory = catStats.rows.reduce((a, r) => ({ ...a, [r.category]: r.cnt }), {});

    return res.json({
      success: true,
      data: { vehicles: result.rows, total: result.rowCount },
      stats: { byStatus, byCategory },
    });
  } catch (err) {
    console.error('listVehicles error:', err);
    return res.status(500).json({ success: false, message: 'Failed to fetch vehicles.' });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/admin/vehicles — add a new vehicle
// ─────────────────────────────────────────────────────────────────────────────
const createVehicle = async (req, res) => {
  const client = await pool.connect();
  try {
    const {
      vehicleName, licensePlate, category, maxCapacity,
      currentOdometer, acquisitionCost,
      lengthFt, widthFt, heightFt,
    } = req.body;

    if (!vehicleName || !licensePlate || !category || !maxCapacity || !acquisitionCost) {
      return res.status(400).json({ success: false, message: 'All required fields must be filled.' });
    }
    if (parseFloat(lengthFt) <= 0 || parseFloat(widthFt) <= 0 || parseFloat(heightFt) <= 0) {
      return res.status(400).json({ success: false, message: 'Cargo dimensions must be greater than 0.' });
    }

    const dimLabel = buildDimensionLabel(lengthFt, widthFt, heightFt);

    // Auto-generate vehicleId (VHL-XXXX)
    const countRes = await client.query(`SELECT COUNT(*)::int AS cnt FROM vehicles;`);
    const next = (countRes.rows[0].cnt + 1).toString().padStart(4, '0');
    const vehicleId = `VHL-${next}`;

    await client.query('BEGIN');

    const result = await client.query(
      `INSERT INTO vehicles
         (id, vehicle_id, vehicle_name, license_plate, category, max_capacity,
          current_odometer, status, acquisition_cost,
          length_ft, width_ft, height_ft, dimension_label,
          created_at, updated_at)
       VALUES
         (gen_random_uuid(), $1, $2, $3, $4::"VehicleCategory", $5,
          $6, 'AVAILABLE'::"VehicleStatus", $7,
          $8, $9, $10, $11,
          now(), now())
       RETURNING id, vehicle_id, vehicle_name, license_plate, category::text,
                 max_capacity, current_odometer, status::text, acquisition_cost::float,
                 length_ft::float, width_ft::float, height_ft::float, dimension_label`,
      [
        vehicleId, vehicleName.trim(), licensePlate.trim().toUpperCase(), category,
        parseInt(maxCapacity), parseInt(currentOdometer || 0), parseFloat(acquisitionCost),
        parseFloat(lengthFt), parseFloat(widthFt), parseFloat(heightFt), dimLabel,
      ]
    );

    const vehicle = result.rows[0];
    const performedBy = req.user?.name || 'Admin';

    await logHistory(client, {
      vehicleId: vehicle.id,
      eventType: 'CREATED',
      title: `${vehicleId} Added to Fleet`,
      description: `${vehicleName} registered with category ${category}, capacity ${maxCapacity} kg, dimensions ${dimLabel}, acquisition cost ₹${parseFloat(acquisitionCost).toLocaleString('en-IN')}.`,
      performedBy,
    });

    await client.query('COMMIT');
    return res.status(201).json({ success: true, message: 'Vehicle added successfully!', vehicle });
  } catch (err) {
    await client.query('ROLLBACK');
    if (err.code === '23505') {
      return res.status(409).json({ success: false, message: 'A vehicle with this license plate already exists.', field: 'licensePlate' });
    }
    console.error('createVehicle error:', err);
    return res.status(500).json({ success: false, message: 'Failed to create vehicle.' });
  } finally {
    client.release();
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// PATCH /api/admin/vehicles/:id/status — update vehicle status
// ─────────────────────────────────────────────────────────────────────────────
const updateVehicleStatus = async (req, res) => {
  const client = await pool.connect();
  try {
    const { id } = req.params;
    const { status } = req.body;
    const valid = ['AVAILABLE', 'ON_TRIP', 'IN_SHOP'];
    if (!valid.includes(status)) {
      return res.status(400).json({ success: false, message: 'Invalid status.' });
    }

    // Get current status
    const cur = await client.query(`SELECT vehicle_id, vehicle_name, status::text AS status FROM vehicles WHERE id = $1`, [id]);
    if (!cur.rows.length) return res.status(404).json({ success: false, message: 'Vehicle not found.' });
    const { vehicle_name, vehicle_id, status: oldStatus } = cur.rows[0];

    await client.query('BEGIN');
    await client.query(`UPDATE vehicles SET status = $1::"VehicleStatus", updated_at = now() WHERE id = $2`, [status, id]);

    await logHistory(client, {
      vehicleId: id,
      eventType: 'STATUS_CHANGE',
      title: `Status Changed: ${oldStatus} → ${status}`,
      description: `${vehicle_name} (${vehicle_id}) status changed from ${oldStatus} to ${status}.`,
      previousValue: oldStatus,
      newValue: status,
      performedBy: req.user?.name || 'Admin',
    });

    await client.query('COMMIT');
    return res.json({ success: true, message: `Status updated to ${status}.` });
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('updateVehicleStatus error:', err);
    return res.status(500).json({ success: false, message: 'Failed to update status.' });
  } finally {
    client.release();
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// PATCH /api/admin/vehicles/:id — update vehicle details (dimensions, capacity, odometer)
// ─────────────────────────────────────────────────────────────────────────────
const updateVehicle = async (req, res) => {
  const client = await pool.connect();
  try {
    const { id } = req.params;
    const { maxCapacity, currentOdometer, acquisitionCost, lengthFt, widthFt, heightFt } = req.body;

    const cur = await client.query(
      `SELECT vehicle_id, vehicle_name, max_capacity, current_odometer,
              acquisition_cost::float, length_ft::float, width_ft::float, height_ft::float, dimension_label
       FROM vehicles WHERE id = $1`, [id]
    );
    if (!cur.rows.length) return res.status(404).json({ success: false, message: 'Vehicle not found.' });
    const old = cur.rows[0];

    const newLen  = lengthFt        ? parseFloat(lengthFt)        : old.length_ft;
    const newWid  = widthFt         ? parseFloat(widthFt)         : old.width_ft;
    const newHgt  = heightFt        ? parseFloat(heightFt)        : old.height_ft;
    const newCap  = maxCapacity     ? parseInt(maxCapacity)       : old.max_capacity;
    const newOdo  = currentOdometer !== undefined ? parseInt(currentOdometer) : old.current_odometer;
    const newCost = acquisitionCost ? parseFloat(acquisitionCost) : old.acquisition_cost;
    const newDimLabel = buildDimensionLabel(newLen, newWid, newHgt);

    const changes = [];
    if (newCap  !== old.max_capacity)      changes.push(`capacity: ${old.max_capacity} kg → ${newCap} kg`);
    if (newOdo  !== old.current_odometer)  changes.push(`odometer: ${old.current_odometer} km → ${newOdo} km`);
    if (newCost !== old.acquisition_cost)  changes.push(`cost: ₹${old.acquisition_cost} → ₹${newCost}`);
    if (newLen  !== old.length_ft || newWid !== old.width_ft || newHgt !== old.height_ft) {
      changes.push(`dimensions: ${old.dimension_label || 'N/A'} → ${newDimLabel}`);
    }
    if (!changes.length) {
      return res.json({ success: true, message: 'No changes detected.' });
    }

    await client.query('BEGIN');
    const result = await client.query(
      `UPDATE vehicles SET
         max_capacity = $1, current_odometer = $2, acquisition_cost = $3,
         length_ft = $4, width_ft = $5, height_ft = $6, dimension_label = $7,
         updated_at = now()
       WHERE id = $8
       RETURNING id, vehicle_id, vehicle_name, license_plate, category::text,
                 max_capacity, current_odometer, status::text, acquisition_cost::float,
                 length_ft::float, width_ft::float, height_ft::float, dimension_label`,
      [newCap, newOdo, newCost, newLen, newWid, newHgt, newDimLabel, id]
    );

    await logHistory(client, {
      vehicleId: id,
      eventType: 'UPDATED',
      title: `Vehicle Details Updated`,
      description: `${old.vehicle_name} (${old.vehicle_id}) was updated. Changes: ${changes.join('; ')}.`,
      previousValue: `cap:${old.max_capacity}, odo:${old.current_odometer}, dim:${old.dimension_label}`,
      newValue: `cap:${newCap}, odo:${newOdo}, dim:${newDimLabel}`,
      performedBy: req.user?.name || 'Admin',
    });

    await client.query('COMMIT');
    return res.json({ success: true, message: 'Vehicle updated.', vehicle: result.rows[0] });
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('updateVehicle error:', err);
    return res.status(500).json({ success: false, message: 'Failed to update vehicle.' });
  } finally {
    client.release();
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/admin/vehicles/:id/service — log a service event
// ─────────────────────────────────────────────────────────────────────────────
const addServiceRecord = async (req, res) => {
  const client = await pool.connect();
  try {
    const { id } = req.params;
    const { eventType, title, description, serviceDate, cost, performedBy } = req.body;
    const validServiceTypes = ['SERVICE', 'OIL_CHANGE', 'TYRE_CHANGE', 'MAINTENANCE', 'EXPENSE_ADDED'];
    if (!validServiceTypes.includes(eventType)) {
      return res.status(400).json({ success: false, message: 'Invalid service event type.' });
    }
    if (!title || !description) {
      return res.status(400).json({ success: false, message: 'Title and description are required.' });
    }

    const veh = await client.query(`SELECT vehicle_name, vehicle_id FROM vehicles WHERE id = $1`, [id]);
    if (!veh.rows.length) return res.status(404).json({ success: false, message: 'Vehicle not found.' });

    await client.query('BEGIN');
    await logHistory(client, {
      vehicleId: id,
      eventType,
      title,
      description,
      serviceDate: serviceDate || new Date().toISOString().split('T')[0],
      cost: cost ? parseFloat(cost) : null,
      performedBy: performedBy || req.user?.name || 'Admin',
    });
    await client.query('COMMIT');
    return res.status(201).json({ success: true, message: `${eventType} record added successfully.` });
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('addServiceRecord error:', err);
    return res.status(500).json({ success: false, message: 'Failed to add service record.' });
  } finally {
    client.release();
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/admin/vehicles/:id/history — fetch history timeline
// ─────────────────────────────────────────────────────────────────────────────
const getVehicleHistory = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query(
      `SELECT id, event_type::text, title, description,
              service_date, cost::float, previous_value, new_value, performed_by, created_at
       FROM vehicle_history
       WHERE vehicle_id = $1
       ORDER BY created_at DESC`,
      [id]
    );
    return res.json({ success: true, data: result.rows, total: result.rowCount });
  } catch (err) {
    console.error('getVehicleHistory error:', err);
    return res.status(500).json({ success: false, message: 'Failed to fetch vehicle history.' });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/admin/vehicles/:id — single vehicle detail
// ─────────────────────────────────────────────────────────────────────────────
const getVehicle = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query(
      `SELECT id, vehicle_id, vehicle_name, license_plate, category::text,
              max_capacity, current_odometer, status::text, acquisition_cost::float,
              length_ft::float, width_ft::float, height_ft::float, dimension_label, created_at
       FROM vehicles WHERE id = $1`, [id]
    );
    if (!result.rows.length) return res.status(404).json({ success: false, message: 'Vehicle not found.' });
    return res.json({ success: true, vehicle: result.rows[0] });
  } catch (err) {
    console.error('getVehicle error:', err);
    return res.status(500).json({ success: false, message: 'Failed to fetch vehicle.' });
  }
};

module.exports = {
  listVehicles, createVehicle, getVehicle,
  updateVehicleStatus, updateVehicle,
  addServiceRecord, getVehicleHistory,
};
