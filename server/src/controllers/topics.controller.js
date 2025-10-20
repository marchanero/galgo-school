const prisma = require('../lib/prisma');
const mqttService = require('../services/mqtt.service');

class TopicsController {
  /**
   * Get all MQTT topics
   * GET /api/topics
   */
  async getAllTopics(req, res) {
    try {
      const topics = await prisma.mqtt_topics.findMany({
        orderBy: { created_at: 'desc' }
      });

      // Also get MQTT service status
      const mqttStatus = mqttService.getStatus();
      const mqttTopics = mqttService.getTopics();

      res.json({
        success: true,
        topics,
        mqtt_status: mqttStatus,
        active_subscriptions: mqttTopics
      });

    } catch (error) {
      console.error('Error in getAllTopics:', error);
      res.status(500).json({
        error: 'Internal server error',
        message: error.message
      });
    }
  }

  /**
   * Get topic by ID
   * GET /api/topics/:id
   */
  async getTopicById(req, res) {
    try {
      const { id } = req.params;

      const topic = await prisma.mqtt_topics.findUnique({
        where: { id: parseInt(id) }
      });

      if (!topic) {
        return res.status(404).json({
          error: 'Topic not found',
          message: `No topic found with ID: ${id}`
        });
      }

      res.json({
        success: true,
        topic
      });

    } catch (error) {
      console.error('Error in getTopicById:', error);
      res.status(500).json({
        error: 'Internal server error',
        message: error.message
      });
    }
  }

  /**
   * Create new topic
   * POST /api/topics
   */
  async createTopic(req, res) {
    try {
      const {
        topic,
        description,
        qos = 0,
        retain = false,
        active = true
      } = req.body;

      // Validation
      if (!topic) {
        return res.status(400).json({
          error: 'Missing required fields',
          message: 'Topic is required'
        });
      }

      // Validate topic format (basic MQTT topic validation)
      if (topic.includes('#') && !topic.endsWith('#')) {
        return res.status(400).json({
          error: 'Invalid topic format',
          message: 'Wildcard # can only be used at the end of a topic'
        });
      }

      try {
        // Create new topic
        const newTopic = await prisma.mqtt_topics.create({
          data: {
            topic,
            description: description || null,
            qos: parseInt(qos) || 0,
            retained: Boolean(retain),
            active: Boolean(active)
          }
        });

        // If active and MQTT is connected, subscribe to the topic
        if (active && mqttService.getStatus().connected) {
          mqttService.subscribe(topic, { qos: parseInt(qos) || 0 })
            .then(() => {
              console.log(`✅ Auto-subscribed to new topic: ${topic}`);
            })
            .catch((subscribeErr) => {
              console.error(`❌ Failed to auto-subscribe to topic ${topic}:`, subscribeErr);
            });
        }

        res.status(201).json({
          success: true,
          message: 'Topic created successfully',
          topic: newTopic
        });

      } catch (error) {
        if (error.code === 'P2002') {
          return res.status(409).json({
            error: 'Topic already exists',
            message: 'A topic with this name already exists'
          });
        }
        throw error;
      }

    } catch (error) {
      console.error('Error in createTopic:', error);
      res.status(500).json({
        error: 'Internal server error',
        message: error.message
      });
    }
  }

  /**
   * Update topic
   * PUT /api/topics/:id
   */
  async updateTopic(req, res) {
    try {
      const { id } = req.params;
      const {
        topic,
        description,
        qos,
        retain,
        active
      } = req.body;

      // Get existing topic
      const existingTopic = await prisma.mqtt_topics.findUnique({
        where: { id: parseInt(id) }
      });

      if (!existingTopic) {
        return res.status(404).json({
          error: 'Topic not found',
          message: `No topic found with ID: ${id}`
        });
      }

      // Update topic
      const updatedTopic = await prisma.mqtt_topics.update({
        where: { id: parseInt(id) },
        data: {
          topic: topic || undefined,
          description: description !== undefined ? description : undefined,
          qos: qos !== undefined ? parseInt(qos) : undefined,
          retained: retain !== undefined ? Boolean(retain) : undefined,
          active: active !== undefined ? Boolean(active) : undefined,
          updated_at: new Date()
        }
      });

      // Handle MQTT subscription changes
      if (mqttService.getStatus().connected) {
        const wasActive = existingTopic.active === true;
        const isActive = active === true || active === 1;

        if (!wasActive && isActive) {
          // Subscribe to topic
          mqttService.subscribe(updatedTopic.topic, { qos: updatedTopic.qos })
            .then(() => {
              console.log(`✅ Subscribed to updated topic: ${updatedTopic.topic}`);
            })
            .catch((subscribeErr) => {
              console.error(`❌ Failed to subscribe to topic ${updatedTopic.topic}:`, subscribeErr);
            });
        } else if (wasActive && !isActive) {
          // Unsubscribe from topic
          mqttService.unsubscribe(existingTopic.topic)
            .then(() => {
              console.log(`✅ Unsubscribed from topic: ${existingTopic.topic}`);
            })
            .catch((unsubscribeErr) => {
              console.error(`❌ Failed to unsubscribe from topic ${existingTopic.topic}:`, unsubscribeErr);
            });
        } else if (wasActive && isActive && existingTopic.topic !== updatedTopic.topic) {
          // Topic name changed, unsubscribe from old and subscribe to new
          mqttService.unsubscribe(existingTopic.topic)
            .then(() => {
              return mqttService.subscribe(updatedTopic.topic, { qos: updatedTopic.qos });
            })
            .then(() => {
              console.log(`✅ Updated subscription from ${existingTopic.topic} to ${updatedTopic.topic}`);
            })
            .catch((changeErr) => {
              console.error(`❌ Failed to update subscription:`, changeErr);
            });
        }
      }

      res.json({
        success: true,
        message: 'Topic updated successfully',
        topic: updatedTopic
      });

    } catch (error) {
      console.error('Error in updateTopic:', error);
      res.status(500).json({
        error: 'Internal server error',
        message: error.message
      });
    }
  }

  /**
   * Delete topic
   * DELETE /api/topics/:id
   */
  async deleteTopic(req, res) {
    try {
      const { id } = req.params;

      // Get topic
      const topic = await prisma.mqtt_topics.findUnique({
        where: { id: parseInt(id) }
      });

      if (!topic) {
        return res.status(404).json({
          error: 'Topic not found',
          message: `No topic found with ID: ${id}`
        });
      }

      // Unsubscribe from MQTT if active and connected
      if (topic.active && mqttService.getStatus().connected) {
        mqttService.unsubscribe(topic.topic)
          .then(() => {
            console.log(`✅ Unsubscribed from deleted topic: ${topic.topic}`);
          })
          .catch((unsubscribeErr) => {
            console.error(`❌ Failed to unsubscribe from topic ${topic.topic}:`, unsubscribeErr);
          });
      }

      // Delete topic
      await prisma.mqtt_topics.delete({
        where: { id: parseInt(id) }
      });

      res.json({
        success: true,
        message: `Topic "${topic.topic}" deleted successfully`
      });

    } catch (error) {
      console.error('Error in deleteTopic:', error);
      res.status(500).json({
        error: 'Internal server error',
        message: error.message
      });
    }
  }

  /**
   * Subscribe to topic via MQTT
   * POST /api/topics/:id/subscribe
   */
  async subscribeToTopic(req, res) {
    try {
      const { id } = req.params;

      // Get topic
      const topic = await prisma.mqtt_topics.findUnique({
        where: { id: parseInt(id) }
      });

      if (!topic) {
        return res.status(404).json({
          error: 'Topic not found',
          message: `No topic found with ID: ${id}`
        });
      }

      if (!mqttService.getStatus().connected) {
        return res.status(400).json({
          error: 'MQTT not connected',
          message: 'Please connect to MQTT broker first'
        });
      }

      try {
        // Subscribe to topic
        const result = await mqttService.subscribe(topic.topic, { qos: topic.qos });

        // Update topic as active in database
        await prisma.mqtt_topics.update({
          where: { id: parseInt(id) },
          data: { active: true }
        });

        res.json({
          success: true,
          message: `Successfully subscribed to topic: ${topic.topic}`,
          data: result
        });

      } catch (subscribeError) {
        res.status(500).json({
          error: 'Failed to subscribe to topic',
          message: subscribeError.message
        });
      }

    } catch (error) {
      console.error('Error in subscribeToTopic:', error);
      res.status(500).json({
        error: 'Internal server error',
        message: error.message
      });
    }
  }

  /**
   * Unsubscribe from topic via MQTT
   * POST /api/topics/:id/unsubscribe
   */
  async unsubscribeFromTopic(req, res) {
    try {
      const { id } = req.params;

      // Get topic
      const topic = await prisma.mqtt_topics.findUnique({
        where: { id: parseInt(id) }
      });

      if (!topic) {
        return res.status(404).json({
          error: 'Topic not found',
          message: `No topic found with ID: ${id}`
        });
      }

      if (!mqttService.getStatus().connected) {
        return res.status(400).json({
          error: 'MQTT not connected',
          message: 'MQTT broker is not connected'
        });
      }

      try {
        // Unsubscribe from topic
        const result = await mqttService.unsubscribe(topic.topic);

        // Update topic as inactive in database
        await prisma.mqtt_topics.update({
          where: { id: parseInt(id) },
          data: { active: false }
        });

        res.json({
          success: true,
          message: `Successfully unsubscribed from topic: ${topic.topic}`,
          data: result
        });

      } catch (unsubscribeError) {
        res.status(500).json({
          error: 'Failed to unsubscribe from topic',
          message: unsubscribeError.message
        });
      }

    } catch (error) {
      console.error('Error in unsubscribeFromTopic:', error);
      res.status(500).json({
        error: 'Internal server error',
        message: error.message
      });
    }
  }

  /**
   * Publish message to topic
   * POST /api/topics/:id/publish
   */
  async publishToTopic(req, res) {
    try {
      const { id } = req.params;
      const { message, qos, retain } = req.body;

      if (message === undefined || message === null) {
        return res.status(400).json({
          error: 'Missing message',
          message: 'Message content is required'
        });
      }

      // Get topic
      const topic = await prisma.mqtt_topics.findUnique({
        where: { id: parseInt(id) }
      });

      if (!topic) {
        return res.status(404).json({
          error: 'Topic not found',
          message: `No topic found with ID: ${id}`
        });
      }

      if (!mqttService.getStatus().connected) {
        return res.status(400).json({
          error: 'MQTT not connected',
          message: 'Please connect to MQTT broker first'
        });
      }

      try {
        // Publish message
        const result = await mqttService.publish(topic.topic, String(message), {
          qos: qos !== undefined ? parseInt(qos) : topic.qos,
          retain: retain !== undefined ? Boolean(retain) : Boolean(topic.retained)
        });

        res.json({
          success: true,
          message: `Message published to topic: ${topic.topic}`,
          data: result
        });

      } catch (publishError) {
        res.status(500).json({
          error: 'Failed to publish message',
          message: publishError.message
        });
      }

    } catch (error) {
      console.error('Error in publishToTopic:', error);
      res.status(500).json({
        error: 'Internal server error',
        message: error.message
      });
    }
  }
}

module.exports = new TopicsController();