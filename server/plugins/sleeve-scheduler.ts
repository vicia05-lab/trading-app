import { definePlugin } from "nitro";
import { restoreSleeveScheduler, stopSleeveScheduler } from "../../src/desk/sleeve-scheduler";

export default definePlugin((nitroApp) => {
  const ready = restoreSleeveScheduler().catch((error) => {
    console.error("[Trading App] Scheduler startup restore failed.", error);
  });

  nitroApp.hooks.hook("request", async () => {
    await ready;
  });
  nitroApp.hooks.hook("close", () => {
    stopSleeveScheduler();
  });
});
