import { defineNitroPlugin } from "nitro/runtime";
import { restoreSleeveScheduler, stopSleeveScheduler } from "../../src/desk/sleeve-scheduler";

export default defineNitroPlugin(async (nitroApp) => {
  await restoreSleeveScheduler();
  nitroApp.hooks.hook("close", () => {
    stopSleeveScheduler();
  });
});
