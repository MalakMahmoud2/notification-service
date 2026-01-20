const amqp = require("amqplib");

const EXCHANGE_NAME = "opsmind.events";
const EXCHANGE_TYPE = "topic";


async function connectRabbitMQ(retries = 10, delay = 5000) {
  for (let i = 0; i < retries; i++) {
    try {
      console.log(`Trying to connect to RabbitMQ (${i + 1}/${retries})...`);
      const connection = await amqp.connect(process.env.RABBITMQ_URL);
      const channel = await connection.createChannel();

      await channel.assertExchange(EXCHANGE_NAME, EXCHANGE_TYPE, {
        durable: true
      });

      console.log(" Connected to RabbitMQ successfully");
      return { channel, EXCHANGE_NAME };
    } catch (err) {
      console.warn(`RabbitMQ not ready. Retry in ${delay / 1000}s...`);
      await new Promise(res => setTimeout(res, delay));
    }
  }
  throw new Error(" Unable to connect to RabbitMQ after many retries");
}

module.exports = connectRabbitMQ;
