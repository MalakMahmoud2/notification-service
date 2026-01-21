const { sendEmail } = require("../services/email.service");
const { sendInAppNotification } = require("../services/inApp.service");
const { logSystemMessage } = require("../services/systemMessage.service");

async function consumeTicketNotifications(channel, exchange) {
  const q = await channel.assertQueue("ticket.notification.queue", {
  durable: true
});

  await channel.bindQueue(q.queue, exchange, "ticket.notification.*");

  channel.consume(q.queue, async (msg) => {
    if (!msg) return;

    const routingKey = msg.fields.routingKey;
    const event = JSON.parse(msg.content.toString());

    // 1️Ticket Assigned
    if (routingKey === "ticket.notification.assigned") {
      const { ticket, technician, admin } = event;

      // In-App notifi.
      await sendInAppNotification(
        technician.id,
        `A new ticket has been assigned to you (Ticket ID: ${ticket.id}, Title: ${ticket.title}).`
      );

     
      if (technician.email) {
        await sendEmail(
          technician.email,
          "New Ticket Assigned",
          `Hello ${technician.name},\n\n` +
            `You have been assigned a new ticket.\n\n` +
            `Ticket ID: ${ticket.id}\nTitle: ${ticket.title}`
        );
      }

      await sendInAppNotification(
        admin.id,
        `Ticket "${ticket.title}" (ID: ${ticket.id}) assigned to ${technician.name}`
      );


      if (admin.email) {
        await sendEmail(
          admin.email,
          "Ticket Assignment Notification",
          `Hello ${admin.name},\n\n` +
            `The following ticket has been assigned:\n\n` +
            `Ticket ID: ${ticket.id}\nTitle: ${ticket.title}\n` +
            `Assigned Technician: ${technician.name}`
        );
      }

      await logSystemMessage(
        `Ticket ${ticket.id} assigned to Technician ${technician.name} [ID: ${technician.id}] - Admin: ${admin.name} [ID: ${admin.id}]`
      );
    }

    // 2️ SLA Breached
    if (routingKey === "ticket.notification.slaBreached") {
      const { ticket, technician, admin } = event;

      await sendInAppNotification(
        technician.id,
        `SLA breached for Ticket ID: ${ticket.id}, Title: ${ticket.title}.`
      );

      if (technician.email) {
        await sendEmail(
          technician.email,
          "SLA Breach Alert",
          `Hello ${technician.name},\n\n` +
            `SLA has been breached.\n\n` +
            `Ticket ID: ${ticket.id}\nTitle: ${ticket.title}`
        );
      }

      await sendInAppNotification(
        admin.id,
        `SLA breached for Ticket ID: ${ticket.id}, Title: ${ticket.title}.`
      );

      if (admin.email) {
        await sendEmail(
          admin.email,
          "SLA Breach Alert",
          `Hello ${admin.name},\n\n` +
            `SLA has been breached.\n\n` +
            `Ticket ID: ${ticket.id}\nTitle: ${ticket.title}\n` +
            `Assigned Technician: ${technician.name}`
        );
      }

      await logSystemMessage(
        `SLA breached for Ticket ${ticket.id} (Notified: ${technician.name} [ID: ${technician.id}] + Admin: ${admin.name} [ID: ${admin.id}])`
      );
    }

    // 3️Ticket Resolved
    if (routingKey === "ticket.notification.resolved") {
      const { ticket, technician, endUser, admin } = event;
      await sendInAppNotification(
        endUser.id,
        `Ticket #${ticket.id} - ${ticket.title} has been resolved.`
      );

      if (endUser.email) {
        await sendEmail(
          endUser.email,
          "Your Ticket Has Been Resolved",
          `Hello ${endUser.name},\n\n` +
            `Your ticket has been resolved successfully.\n\n` +
            `Ticket ID: ${ticket.id}\nTitle: ${ticket.title}`
        );
      }

      await sendInAppNotification(
        technician.id,
        `Ticket #${ticket.id} (${ticket.title}) has been resolved.`
      );
      await sendInAppNotification(
        admin.id,
        `Ticket #${ticket.id} (${ticket.title}) has been resolved by ${technician.name}.`
      );

      if (admin.email) {
        await sendEmail(
          admin.email,
          "Ticket Resolved Notification",
          `Hello ${admin.name},\n\n` +
            `Ticket #${ticket.id} has been resolved.\n\n` +
            `Title: ${ticket.title}\nResolved by: ${technician.name}`
        );
      }

      await logSystemMessage(
        `Ticket ${ticket.id} resolved by Technician ${technician.name} [ID: ${technician.id}] (Admin: ${admin.name} [ID: ${admin.id}])`
      );
    }

    channel.ack(msg);
  });
}

module.exports = consumeTicketNotifications;
