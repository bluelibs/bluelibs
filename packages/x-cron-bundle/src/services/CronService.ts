import { Service, Inject, ContainerInstance } from "@bluelibs/core";
import { ICronConfig, ICronEntry } from "../defs";
import { CronsCollection } from "../collections/Crons.collection";
import { parse, schedule, ScheduleData, date } from "later";
import { LoggerService } from "@bluelibs/logger-bundle";

type IntentFunction = (intendedAt: Date) => any;

@Service()
export class CronService {
  cronfigs: ICronConfig[] = [];
  running: boolean = false;

  constructor(
    protected cronsCollection: CronsCollection,
    protected logger: LoggerService,
    protected container: ContainerInstance
  ) {
    date.UTC();
  }

  add(config: ICronConfig) {
    if (config.persist === undefined) {
      config.persist = true;
    }
    this.cronfigs.push(config);

    if (this.running) {
      this.scheduleEntry(config);
    }
  }

  start() {
    this.cronfigs.forEach((cronfig) => {
      this.scheduleEntry(cronfig);
    });
    this.running = true;
  }

  pause() {
    if (this.running) {
      this.cronfigs.forEach((cronfig) => {
        cronfig._timer && cronfig._timer.clear();
      });
      this.running = false;
    }
  }

  /**
   * This makes the entry run
   * @param cronfig
   */
  scheduleEntry(cronfig: ICronConfig) {
    const cronSchedule = cronfig.schedule(parse);
    cronfig._timer = this.setLaterInterval(
      this.createRunnerFunction(cronfig),
      cronSchedule
    );
    this.logger.info(
      `Scheduled ${cronfig.name} next run @${schedule(cronSchedule).next(1)}`
    );
  }

  /**
   * This creates the runner function works with database and throws exceptions accordingly
   * @param cronfig
   * @returns
   */
  protected createRunnerFunction(cronfig: ICronConfig): Function {
    let self = this;
    const log = this.logger;

    return async function (intendedAt) {
      intendedAt = new Date(intendedAt.getTime());
      intendedAt.setMilliseconds(0);

      let jobHistory: ICronEntry;

      if (cronfig.persist) {
        jobHistory = {
          intendedAt: intendedAt,
          name: cronfig.name,
          startedAt: new Date(),
        };

        // If we have a dup key error, another instance has already tried to run
        // this job.
        try {
          const newEntry = await self.cronsCollection.insertOne(jobHistory);
          jobHistory._id = newEntry.insertedId;
        } catch (e) {
          // http://www.mongodb.org/about/contributors/error-codes/
          // 11000 == duplicate key error
          if (e.code === 11000) {
            log.info('Not running "' + cronfig.name + '" again.');
            return;
          }

          throw e;
        }
      }

      // run and record the job
      try {
        log.info('Starting cronjob "' + cronfig.name + '".');
        let output = await cronfig.job(self.container); // <- Run the actual job

        log.info('Finished cronjob "' + cronfig.name + '".');
        if (cronfig.persist) {
          await self.cronsCollection.updateOne(
            { _id: jobHistory._id },
            {
              $set: {
                finishedAt: new Date(),
                result: output,
              },
            }
          );
        }
      } catch (e) {
        log.info(
          'Exception "' + cronfig.name + '" ' + (e && e.stack ? e.stack : e)
        );
        if (cronfig.persist) {
          await self.cronsCollection.updateOne(
            { _id: jobHistory._id },
            {
              $set: {
                finishedAt: new Date(),
                error: e && e.stack ? e.stack : e,
              },
            }
          );
        }
      }
    };
  }

  /**
   *
   * @param runner
   * @param cronSchedule
   * @returns
   */
  protected setLaterInterval(runner: Function, cronSchedule: ScheduleData) {
    let clearableTimeout = this.setLaterTimeout(scheduleTimeout, cronSchedule);
    let done = false;

    /**
     * Executes the specified function and then sets the timeout for the next
     * interval.
     */
    const self = this;
    async function scheduleTimeout(intendedAt) {
      if (!done) {
        try {
          await runner(intendedAt);
        } catch (e) {
          this.logger.info(
            "Exception running scheduled job " + (e && e.stack ? e.stack : e)
          );
        }

        clearableTimeout = self.setLaterTimeout(scheduleTimeout, cronSchedule);
      }
    }

    return {
      /**
       * Clears the timeout.
       */
      clear: function () {
        done = true;
        clearableTimeout.clear();
      },
    };
  }

  protected setLaterTimeout(fn: IntentFunction, cronSchedule: ScheduleData) {
    let s = schedule(cronSchedule);
    let timeoutElementId;

    scheduleTimeout();

    /**
     * Schedules the timeout to occur. If the next occurrence is greater than the
     * max supported delay (2147483647 ms) than we delay for that amount before
     * attempting to schedule the timeout again.
     */
    function scheduleTimeout() {
      const now = Date.now();
      const next = s.next(2, new Date(now));

      // don't schedlue another occurence if no more exist synced-cron#41
      if (!next[0]) return;

      let diff = next[0].getTime() - now,
        intendedAt = next[0];

      // minimum time to fire is one second, use next occurrence instead
      if (diff < 1000) {
        diff = next[1].getTime() - now;
        intendedAt = next[1];
      }

      if (diff < 2147483647) {
        timeoutElementId = setTimeout(function () {
          fn(intendedAt);
        }, diff);
      } else {
        timeoutElementId = setTimeout(scheduleTimeout, 2147483647);
      }
    }

    return {
      /**
       * Clears the timeout.
       */
      clear: function () {
        clearTimeout(timeoutElementId);
      },
    };
  }
}
