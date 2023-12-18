import "dotenv/config";
import { scheduleJob } from "node-schedule";
import { KrollClient } from "./clients/Kroll/kroll";
import logger from "./logger";
import process from "process";
const randomFromInterval = (min: number, max: number): number => {
  // min and max included
  return Math.random() * (max - min + 1) + min;
};
const ONE_MIN_MS = 1000 * 60;

const client = new KrollClient();

const runUpdateJob = async () => {
  try {
    logger.info("Updating Kroll data");
    await client.loadRestructuringCases();
    await client.refreshCases();
    logger.info("Finished updating Kroll data");
  } catch (e) {
    logger.error(e);
  }
};

scheduleJob({ hour: 6, minute: 30 }, async () => {
  // we want to delay it so it doesnt run at exactly the same time every day
  setTimeout(runUpdateJob, ONE_MIN_MS * randomFromInterval(1, 60 * 12));
});
logger.info("Scheduled data update");
if (process.env.RUN_NOW) {
  runUpdateJob();
}
