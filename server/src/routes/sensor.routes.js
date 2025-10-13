const express = require('express');
const router = express.Router();
const sensorController = require('../controllers/sensor.controller');

/**
 * @swagger
 * /api/sensors:
 *   get:
 *     summary: Obtener todos los sensores
 *     tags: [Sensors]
 *     responses:
 *       200:
 *         description: Lista de sensores
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 sensors:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Sensor'
 *       500:
 *         description: Error del servidor
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.get('/', sensorController.getAllSensors);

/**
 * @swagger
 * /api/sensors/{id}:
 *   get:
 *     summary: Obtener un sensor por ID
 *     tags: [Sensors]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID del sensor
 *     responses:
 *       200:
 *         description: Sensor encontrado
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Sensor'
 *       404:
 *         description: Sensor no encontrado
 *       500:
 *         description: Error del servidor
 */
router.get('/:id', sensorController.getSensorById);

/**
 * @swagger
 * /api/sensors:
 *   post:
 *     summary: Crear un nuevo sensor
 *     tags: [Sensors]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - type
 *               - name
 *             properties:
 *               type:
 *                 type: string
 *                 example: environmental
 *               name:
 *                 type: string
 *                 example: Sensor Temperatura
 *               data:
 *                 type: object
 *                 example: { "location": "Lab 1" }
 *     responses:
 *       201:
 *         description: Sensor creado exitosamente
 *       400:
 *         description: Datos inválidos
 *       500:
 *         description: Error del servidor
 */
router.post('/', sensorController.createSensor);

/**
 * @swagger
 * /api/sensors/{id}:
 *   put:
 *     summary: Actualizar un sensor
 *     tags: [Sensors]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               type:
 *                 type: string
 *               name:
 *                 type: string
 *               data:
 *                 type: object
 *     responses:
 *       200:
 *         description: Sensor actualizado
 *       404:
 *         description: Sensor no encontrado
 *       500:
 *         description: Error del servidor
 */
router.put('/:id', sensorController.updateSensor);

/**
 * @swagger
 * /api/sensors/{id}:
 *   delete:
 *     summary: Eliminar un sensor
 *     tags: [Sensors]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Sensor eliminado
 *       404:
 *         description: Sensor no encontrado
 *       500:
 *         description: Error del servidor
 */
router.delete('/:id', sensorController.deleteSensor);

module.exports = router;
