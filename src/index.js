require("dotenv").config();

process.on("unhandledRejection", (err) => {
  console.error("Unhandled Rejection:", err);
});

process.on("uncaughtException", (err) => {
  console.error("Uncaught Exception:", err);
});

const express = require("express");
const connectRabbitMQ = require("./config/rabbitmq");
const consumeTicketNotifications = require("./consumers/ticketNotification.consumer");
const createNotificationAPI = require("./api/notification.api");

(async () => {
  try {
    const app = express();
    app.use(express.json());

    const { channel, EXCHANGE_NAME } = await connectRabbitMQ();
    await consumeTicketNotifications(channel, EXCHANGE_NAME);

    app.use("/api/notifications", createNotificationAPI(channel, EXCHANGE_NAME));

    const PORT = process.env.PORT || 3000;

    app.listen(PORT, "0.0.0.0", () => {
      console.log(`Notification Service running on port ${PORT}`);
    });

  } catch (err) {
    console.error("Fatal startup error:", err);
    process.exit(1);
  }
})();
