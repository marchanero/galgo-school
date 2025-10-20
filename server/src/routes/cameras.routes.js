const express = require('express');
const router = express.Router();
const cameraController = require('../controllers/camera.controller');

/**
 * @swagger
 * /api/cameras:
 *   get:
 *     summary: Obtener todas las cámaras configuradas
 *     tags: [Cameras]
 *     responses:
 *       200:
 *         description: Lista de cámaras obtenida exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 cameras:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: integer
 *                       name:
 *                         type: string
 *                       ip:
 *                         type: string
 *                       port:
 *                         type: integer
 *                       path:
 *                         type: string
 *                       active:
 *                         type: boolean
 *                       connection_status:
 *                         type: string
 *                 count:
 *                   type: integer
 *       500:
 *         description: Error interno del servidor
 */
router.get('/', cameraController.getAllCameras.bind(cameraController));

/**
 * @swagger
 * /api/cameras/{id}:
 *   get:
 *     summary: Obtener una cámara específica
 *     tags: [Cameras]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Cámara obtenida exitosamente
 *       404:
 *         description: Cámara no encontrada
 *       500:
 *         description: Error interno del servidor
 */
router.get('/:id', cameraController.getCamera.bind(cameraController));

/**
 * @swagger
 * /api/cameras:
 *   post:
 *     summary: Crear una nueva cámara
 *     tags: [Cameras]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - ip
 *             properties:
 *               name:
 *                 type: string
 *                 example: Cámara Principal
 *               ip:
 *                 type: string
 *                 example: 192.168.1.100
 *               port:
 *                 type: integer
 *                 example: 554
 *               username:
 *                 type: string
 *                 example: admin
 *               password:
 *                 type: string
 *                 example: password123
 *               path:
 *                 type: string
 *                 example: /stream
 *     responses:
 *       201:
 *         description: Cámara creada exitosamente
 *       400:
 *         description: Datos inválidos
 *       409:
 *         description: Cámara con ese nombre ya existe
 *       500:
 *         description: Error interno del servidor
 */
router.post('/', cameraController.createCamera.bind(cameraController));

/**
 * @swagger
 * /api/cameras/{id}:
 *   put:
 *     summary: Actualizar una cámara
 *     tags: [Cameras]
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
 *               name:
 *                 type: string
 *               ip:
 *                 type: string
 *               port:
 *                 type: integer
 *               username:
 *                 type: string
 *               password:
 *                 type: string
 *               path:
 *                 type: string
 *               active:
 *                 type: boolean
 *     responses:
 *       200:
 *         description: Cámara actualizada exitosamente
 *       404:
 *         description: Cámara no encontrada
 *       500:
 *         description: Error interno del servidor
 */
router.put('/:id', cameraController.updateCamera.bind(cameraController));

/**
 * @swagger
 * /api/cameras/{id}:
 *   delete:
 *     summary: Eliminar una cámara
 *     tags: [Cameras]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Cámara eliminada exitosamente
 *       404:
 *         description: Cámara no encontrada
 *       500:
 *         description: Error interno del servidor
 */
router.delete('/:id', cameraController.deleteCamera.bind(cameraController));

/**
 * @swagger
 * /api/cameras/{id}/test:
 *   post:
 *     summary: Probar conexión a una cámara
 *     tags: [Cameras]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Prueba de conexión completada
 *       404:
 *         description: Cámara no encontrada
 *       500:
 *         description: Error interno del servidor
 */
router.post('/:id/test', cameraController.testCameraConnection.bind(cameraController));

module.exports = router;
