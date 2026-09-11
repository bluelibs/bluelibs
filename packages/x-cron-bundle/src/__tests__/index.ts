import { ecosystem } from "./ecosystem";
import { CronService } from "../services/CronService";
import { ContainerInstance } from "@bluelibs/core";

test("crons do run", async () => {
  const eco = await ecosystem;
  const cronService = eco.container.get(CronService);
  let inJob = false;
  cronService.add({
    name: "test",
    schedule(parser) {
      return parser.text("every 1 second");
    },
    job(container) {
      expect(container).toBeInstanceOf(ContainerInstance);
      inJob = true;
    },
  });

  await new Promise<void>((resolve) => {
    setTimeout(() => {
      resolve();
    }, 1500);
  });

  expect(inJob).toBe(true);
});
