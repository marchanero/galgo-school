const express = require('express');
const router = express.Router();
const mqttController = require('../controllers/mqtt.controller');

/**
 * @swagger
 * /api/mqtt/status:
 *   get:
 *     summary: Obtener estado de conexión MQTT
 *     tags: [MQTT]
 *     responses:
 *       200:
 *         description: Estado de MQTT
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 connected:
 *                   type: boolean
 *                 broker:
 *                   type: string
 *                 clientId:
 *                   type: string
 */
router.get('/status', mqttController.getStatus);

/**
 * @swagger
 * /api/mqtt/connect:
 *   post:
 *     summary: Conectar al broker MQTT
 *     tags: [MQTT]
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               broker:
 *                 type: string
 *                 example: mqtt://localhost:1883
 *               clientId:
 *                 type: string
 *     responses:
 *       200:
 *         description: Conexión iniciada
 */
router.post('/connect', mqttController.connect);

/**
 * @swagger
 * /api/mqtt/disconnect:
 *   post:
 *     summary: Desconectar del broker MQTT
 *     tags: [MQTT]
 *     responses:
 *       200:
 *         description: Desconectado exitosamente
 */
router.post('/disconnect', mqttController.disconnect);

/**
 * @swagger
 * /api/mqtt/topics:
 *   get:
 *     summary: Obtener todos los topics MQTT
 *     tags: [MQTT]
 *     responses:
 *       200:
 *         description: Lista de topics
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 topics:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/MQTTTopic'
 */
router.get('/topics', mqttController.getAllTopics);

/**
 * @swagger
 * /api/mqtt/topics:
 *   post:
 *     summary: Crear un nuevo topic MQTT
 *     tags: [MQTT]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - topic
 *             properties:
 *               topic:
 *                 type: string
 *                 example: sensors/temperature
 *               description:
 *                 type: string
 *                 example: Topic para sensores de temperatura
 *               qos:
 *                 type: integer
 *                 example: 0
 *               retained:
 *                 type: boolean
 *                 example: false
 *     responses:
 *       201:
 *         description: Topic creado
 *       409:
 *         description: Topic ya existe
 */
router.post('/topics', mqttController.createTopic);

/**
 * @swagger
 * /api/mqtt/topics/{id}:
 *   put:
 *     summary: Actualizar un topic MQTT
 *     tags: [MQTT]
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
 *               topic:
 *                 type: string
 *               description:
 *                 type: string
 *               qos:
 *                 type: integer
 *               retained:
 *                 type: boolean
 *               active:
 *                 type: boolean
 *     responses:
 *       200:
 *         description: Topic actualizado
 *       404:
 *         description: Topic no encontrado
 */
router.put('/topics/:id', mqttController.updateTopic);

/**
 * @swagger
 * /api/mqtt/topics/{id}:
 *   delete:
 *     summary: Eliminar un topic MQTT
 *     tags: [MQTT]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Topic eliminado
 *       404:
 *         description: Topic no encontrado
 */
router.delete('/topics/:id', mqttController.deleteTopic);

/**
 * @swagger
 * /api/mqtt/publish:
 *   post:
 *     summary: Publicar un mensaje MQTT
 *     tags: [MQTT]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - topic
 *               - message
 *             properties:
 *               topic:
 *                 type: string
 *                 example: sensors/temperature
 *               message:
 *                 type: string
 *                 example: "25.5"
 *               qos:
 *                 type: integer
 *                 example: 0
 *               retain:
 *                 type: boolean
 *                 example: false
 *     responses:
 *       200:
 *         description: Mensaje publicado
 *       400:
 *         description: Datos inválidos
 *       503:
 *         description: Cliente MQTT no conectado
 */
router.post('/publish', mqttController.publish);

/**
 * @swagger
 * /api/mqtt/messages:
 *   get:
 *     summary: Obtener historial de mensajes MQTT
 *     tags: [MQTT]
 *     parameters:
 *       - in: query
 *         name: topic
 *         schema:
 *           type: string
 *         description: Filtrar por topic
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 50
 *         description: Número máximo de mensajes
 *     responses:
 *       200:
 *         description: Lista de mensajes
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 messages:
 *                   type: array
 *                   items:
 *                     type: object
 */
router.get('/messages', mqttController.getMessages);

module.exports = router;
