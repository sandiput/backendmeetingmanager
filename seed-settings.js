const { Settings } = require("./models");

(async () => {
  try {
    await Settings.create({ whatsapp_connected: false });
    console.log("✅ Settings record created");
    process.exit(0);
  } catch (err) {
    console.error("❌ Error:", err);
    process.exit(1);
  }
})();
