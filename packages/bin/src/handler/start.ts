import Timeout from 'await-timeout';
import {logger} from 'alarmmgr-logger';
import {ProbeCenter} from "../plugins/probe_center";

export class StartHandler {
  constructor(
    /**
     * probe bridges
     */
    private readonly probes: Array<string>,
  ) {
  }

  public async start(): Promise<void> {
    while (true) {
      try {
        await this.run();
        await Timeout.set(1000);
      } catch (e) {
        console.error(e);
      }
    }
  }

  private async run(): Promise<void> {
    for (const probeName of this.probes) {
      logger.debug(`start with probe -> ${probeName}`);
      const probe = ProbeCenter.probe(probeName);
      if (!probe) {
        logger.warn(`not found probe by name: ${probeName}, please register it.`);
        continue;
      }
      const alerts = await probe.probe();
      console.log(`[${probeName}] alerts: `, alerts);
      await Timeout.set(1000);
    }
  }
}
