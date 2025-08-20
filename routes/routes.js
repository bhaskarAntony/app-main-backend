const express = require('express');
const Route = require('../models/Route');
const { auth, authorize } = require('../middleware/auth');

const router = express.Router();

/**
 * @swagger
 * /api/routes:
 *   get:
 *     summary: Get all routes
 *     tags: [Routes]
 *     responses:
 *       200:
 *         description: List of routes
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Route'
 *       500:
 *         description: Server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
// Get all routes
router.get('/', auth, async (req, res) => {
  try {
    const routes = await Route.find({ isActive: true })
      .populate('assignedDrivers', 'name email')
      .populate('assignedVehicles', 'name numberPlate')
      .sort({ createdAt: -1 });

    res.json(routes);
  } catch (error) {
    console.error('Get routes error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

/**
 * @swagger
 * /api/routes/driver/{driverId}:
 *   get:
 *     summary: Get routes by driver ID
 *     tags: [Routes]
 *     parameters:
 *       - in: path
 *         name: driverId
 *         required: true
 *         schema:
 *           type: string
 *         description: Driver ID
 *     responses:
 *       200:
 *         description: List of routes assigned to driver
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Route'
 *       500:
 *         description: Server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
// Get routes by driver ID
router.get('/driver/:driverId', auth, async (req, res) => {
  try {
    const routes = await Route.find({ 
      assignedDrivers: req.params.driverId,
      isActive: true 
    }).populate('assignedVehicles', 'name numberPlate');

    res.json(routes);
  } catch (error) {
    console.error('Get driver routes error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

/**
 * @swagger
 * /api/routes:
 *   post:
 *     summary: Create route (Travel Admin only)
 *     tags: [Routes]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [name, pickupPoints, dropPoints]
 *             properties:
 *               name:
 *                 type: string
 *                 example: Office to Residential Area Route
 *               description:
 *                 type: string
 *                 example: Daily commute route for employees
 *               pickupPoints:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     name:
 *                       type: string
 *                       example: Office Main Gate
 *                     address:
 *                       type: string
 *                       example: Tech Park, Bangalore
 *                     lat:
 *                       type: number
 *                       example: 12.9716
 *                     lng:
 *                       type: number
 *                       example: 77.5946
 *                     order:
 *                       type: number
 *                       example: 1
 *               dropPoints:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     name:
 *                       type: string
 *                       example: Residential Complex
 *                     address:
 *                       type: string
 *                       example: Koramangala, Bangalore
 *                     lat:
 *                       type: number
 *                       example: 12.9352
 *                     lng:
 *                       type: number
 *                       example: 77.6245
 *                     order:
 *                       type: number
 *                       example: 1
 *               assignedDrivers:
 *                 type: array
 *                 items:
 *                   type: string
 *                   example: 507f1f77bcf86cd799439013
 *               assignedVehicles:
 *                 type: array
 *                 items:
 *                   type: string
 *                   example: 507f1f77bcf86cd799439012
 *               schedule:
 *                 type: object
 *                 properties:
 *                   days:
 *                     type: array
 *                     items:
 *                       type: string
 *                       enum: [Monday, Tuesday, Wednesday, Thursday, Friday, Saturday, Sunday]
 *                   startTime:
 *                     type: string
 *                     example: "09:00"
 *                   endTime:
 *                     type: string
 *                     example: "18:00"
 *     responses:
 *       201:
 *         description: Route created successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Route'
 *       403:
 *         description: Access denied
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       500:
 *         description: Server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
// Create route (Travel Admin only)
router.post('/', auth, authorize(['travel-admin']), async (req, res) => {
  try {
    const route = new Route(req.body);
    await route.save();
    
    const populatedRoute = await Route.findById(route._id)
      .populate('assignedDrivers', 'name email')
      .populate('assignedVehicles', 'name numberPlate');

    res.status(201).json(populatedRoute);
  } catch (error) {
    console.error('Create route error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

/**
 * @swagger
 * /api/routes/{id}:
 *   put:
 *     summary: Update route (Travel Admin only)
 *     tags: [Routes]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Route ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Route'
 *     responses:
 *       200:
 *         description: Route updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Route'
 *       404:
 *         description: Route not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       403:
 *         description: Access denied
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       500:
 *         description: Server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
// Update route (Travel Admin only)
router.put('/:id', auth, authorize(['travel-admin']), async (req, res) => {
  try {
    const route = await Route.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    ).populate('assignedDrivers', 'name email')
     .populate('assignedVehicles', 'name numberPlate');

    if (!route) {
      return res.status(404).json({ message: 'Route not found' });
    }

    res.json(route);
  } catch (error) {
    console.error('Update route error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

/**
 * @swagger
 * /api/routes/{id}:
 *   delete:
 *     summary: Delete route (Travel Admin only)
 *     tags: [Routes]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Route ID
 *     responses:
 *       200:
 *         description: Route deleted successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Route deleted successfully
 *       404:
 *         description: Route not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       403:
 *         description: Access denied
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       500:
 *         description: Server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
// Delete route (Travel Admin only)
router.delete('/:id', auth, authorize(['travel-admin']), async (req, res) => {
  try {
    const route = await Route.findByIdAndUpdate(
      req.params.id,
      { isActive: false },
      { new: true }
    );

    if (!route) {
      return res.status(404).json({ message: 'Route not found' });
    }

    res.json({ message: 'Route deleted successfully' });
  } catch (error) {
    console.error('Delete route error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;