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
    logger.debug(`start with bridges -> ${this.probes}`);
    for (const probeName of this.probes) {
      const probe = ProbeCenter.probe(probeName);
      if (probe) {
        await probe.probe();
      }
      await Timeout.set(1000);
    }
  }
}
