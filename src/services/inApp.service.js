// handel inapp
async function sendInAppNotification(userId, message) {
  console.log(`In-App → User ${userId}: ${message}`);
}

module.exports = { sendInAppNotification };
