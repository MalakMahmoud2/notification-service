const express = require("express");

function setNotificationAPI(channel, exchange) {
  const router = express.Router();

  // Health api
  router.get("/health", (req, res) => {
    res.json({ service: "Notification Service", status: "UP" });
  });

  router.post("/events", (req, res) => {
    const { routingKey, payload } = req.body;

    // check for routingkey
    if (!routingKey || typeof routingKey !== "string") {
      return res.status(422).json({ error: "Missing (or) invalid routingKey" });
    }

    // check for payload
    if (!payload) {
      return res.status(422).json({ error: "Missing in payload" });
    }

    try {
      const messageBuffer = Buffer.from(JSON.stringify(payload));

      channel.publish(exchange, routingKey, messageBuffer, {
        contentType: "application/json"
      });

      res.json({ message: "Event published successfully", routingKey });
    } catch (err) {
      console.error("Failed to publish event:", err);
      res.status(502).json({ error: "Failed to publish event" });
    }
  });

  return router;
}

module.exports = setNotificationAPI;
