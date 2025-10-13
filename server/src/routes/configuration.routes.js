const express = require('express');
const router = express.Router();
const configurationController = require('../controllers/configuration.controller');

/**
 * @swagger
 * /api/configurations:
 *   get:
 *     summary: Obtener todas las configuraciones del sistema
 *     tags: [Configurations]
 *     responses:
 *       200:
 *         description: Configuraciones obtenidas exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 configurations:
 *                   type: object
 *                   properties:
 *                     general:
 *                       type: object
 *                       properties:
 *                         theme:
 *                           type: string
 *                           example: light
 *                         recordingAutoStart:
 *                           type: boolean
 *                           example: false
 *                         language:
 *                           type: string
 *                           example: es
 *                         timezone:
 *                           type: string
 *                           example: America/Mexico_City
 *                     recordings:
 *                       type: object
 *                       properties:
 *                         directory:
 *                           type: string
 *                           example: /home/roberto/galgo-recordings
 *                         format:
 *                           type: string
 *                           example: MP4 (H.264)
 *                         maxDuration:
 *                           type: number
 *                           example: 60
 *                         quality:
 *                           type: string
 *                           example: Alta (1080p)
 *                     mqtt:
 *                       type: object
 *                       properties:
 *                         defaultBroker:
 *                           type: string
 *                           example: EMQX Local (localhost:1883)
 *                         host:
 *                           type: string
 *                           example: localhost
 *                         port:
 *                           type: number
 *                           example: 1883
 *                         username:
 *                           type: string
 *                           example: ""
 *                         password:
 *                           type: string
 *                           example: ""
 *                         ssl:
 *                           type: boolean
 *                           example: false
 *                     cameras:
 *                       type: object
 *                       properties:
 *                         defaultRtspPort:
 *                           type: number
 *                           example: 554
 *                         defaultRtspPath:
 *                           type: string
 *                           example: /stream
 *                         connectionTimeout:
 *                           type: number
 *                           example: 10
 *                         defaultQuality:
 *                           type: string
 *                           example: 1080p (Alta)
 *                         defaultFrameRate:
 *                           type: string
 *                           example: 30 FPS
 *                         autoReconnect:
 *                           type: boolean
 *                           example: true
 *                         videoBuffer:
 *                           type: boolean
 *                           example: true
 *                         bufferSize:
 *                           type: number
 *                           example: 5
 *                         cameraIPs:
 *                           type: array
 *                           items:
 *                             type: object
 *                     sensors:
 *                       type: object
 *                       properties:
 *                         autoLoad:
 *                           type: boolean
 *                           example: true
 *                         defaultActive:
 *                           type: boolean
 *                           example: true
 *                         refreshInterval:
 *                           type: number
 *                           example: 30
 *                         sensors:
 *                           type: array
 *                           items:
 *                             type: object
 *                             properties:
 *                               id:
 *                                 type: integer
 *                                 example: 1
 *                               type:
 *                                 type: string
 *                                 example: rtsp
 *                               name:
 *                                 type: string
 *                                 example: Cámara Principal
 *                               data:
 *                                 type: object
 *                                 example: { "host": "192.168.1.100" }
 *                               created_at:
 *                                 type: string
 *                                 example: "2023-10-13T10:00:00.000Z"
 *                     topics:
 *                       type: object
 *                       properties:
 *                         autoSubscribe:
 *                           type: boolean
 *                           example: true
 *                         defaultQos:
 *                           type: integer
 *                           example: 0
 *                         defaultRetained:
 *                           type: boolean
 *                           example: false
 *                         topics:
 *                           type: array
 *                           items:
 *                             type: object
 *                             properties:
 *                               id:
 *                                 type: integer
 *                                 example: 1
 *                               topic:
 *                                 type: string
 *                                 example: sensors/temperature
 *                               description:
 *                                 type: string
 *                                 example: Topic para temperatura
 *                               qos:
 *                                 type: integer
 *                                 example: 0
 *                               retained:
 *                                 type: boolean
 *                                 example: false
 *                               active:
 *                                 type: boolean
 *                                 example: true
 *                               created_at:
 *                                 type: string
 *                                 example: "2023-10-13T10:00:00.000Z"
 *       500:
 *         description: Error interno del servidor
 */
router.get('/', configurationController.getConfigurations);

/**
 * @swagger
 * /api/configurations:
 *   post:
 *     summary: Guardar una configuración individual
 *     tags: [Configurations]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - category
 *               - key
 *               - value
 *             properties:
 *               category:
 *                 type: string
 *                 example: general
 *               key:
 *                 type: string
 *                 example: theme
 *               value:
 *                 type: string
 *                 example: dark
 *     responses:
 *       200:
 *         description: Configuración guardada exitosamente
 *       400:
 *         description: Datos inválidos
 *       500:
 *         description: Error interno del servidor
 */
router.post('/', configurationController.saveConfiguration);

/**
 * @swagger
 * /api/configurations/bulk:
 *   put:
 *     summary: Guardar todas las configuraciones
 *     tags: [Configurations]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - configurations
 *             properties:
 *               configurations:
 *                 type: object
 *                 description: Objeto completo de configuraciones
 *     responses:
 *       200:
 *         description: Todas las configuraciones guardadas exitosamente
 *       400:
 *         description: Datos inválidos
 *       500:
 *         description: Error interno del servidor
 */
router.put('/bulk', configurationController.saveAllConfigurations);

/**
 * @swagger
 * /api/configurations/sync-sensors:
 *   put:
 *     summary: Sincronizar sensores desde configuraciones
 *     tags: [Configurations]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - sensors
 *             properties:
 *               sensors:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     type:
 *                       type: string
 *                       example: rtsp
 *                     name:
 *                       type: string
 *                       example: Cámara Principal
 *                     data:
 *                       type: object
 *                       example: { "host": "192.168.1.100", "port": 554 }
 *     responses:
 *       200:
 *         description: Sensores sincronizados exitosamente
 *       400:
 *         description: Datos inválidos
 *       500:
 *         description: Error interno del servidor
 */
router.put('/sync-sensors', configurationController.syncSensorsFromConfig);

/**
 * @swagger
 * /api/configurations/sync-topics:
 *   put:
 *     summary: Sincronizar topics MQTT desde configuraciones
 *     tags: [Configurations]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - topics
 *             properties:
 *               topics:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     topic:
 *                       type: string
 *                       example: sensors/temperature
 *                     description:
 *                       type: string
 *                       example: Topic para temperatura
 *                     qos:
 *                       type: integer
 *                       example: 0
 *                     retained:
 *                       type: boolean
 *                       example: false
 *                     active:
 *                       type: boolean
 *                       example: true
 *     responses:
 *       200:
 *         description: Topics sincronizados exitosamente
 *       400:
 *         description: Datos inválidos
 *       500:
 *         description: Error interno del servidor
 */
router.put('/sync-topics', configurationController.syncTopicsFromConfig);

module.exports = router;