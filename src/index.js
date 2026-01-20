require("dotenv").config();
const express = require("express");
const connectRabbitMQ = require("./config/rabbitmq");
const consumeTicketNotifications = require("./consumers/ticketNotification.consumer");
const createNotificationAPI = require("./api/notification.api");

(async () => {
  const app = express();
  app.use(express.json());

  const { channel, EXCHANGE_NAME } = await connectRabbitMQ();

  await consumeTicketNotifications(channel, EXCHANGE_NAME);

  app.use("/api/notifications", createNotificationAPI(channel, EXCHANGE_NAME));

  app.listen(process.env.PORT, () => {
    console.log(" Notification Service running on Cloud");
  });
})();
