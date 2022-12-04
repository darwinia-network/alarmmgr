import Timeout from 'await-timeout';
import {logger} from 'alarmmgr-logger';
import {Lifecycle} from 'alarmmgr-types';
import {ProbeCenter} from "../plugins/probe_center";
import {Initializer} from "../initializer";

export class StartHandler {
  constructor(
    /**
     * probe bridges
     */
    private readonly probes: Array<string>,
  ) {
  }

  public async start(): Promise<void> {
    const lifecycle: Lifecycle = {
      kv: await Initializer.initKvdb(),
    };
    while (true) {
      try {
        await this.run(lifecycle);
        await Timeout.set(1000);
      } catch (e) {
        console.error(e);
      }
    }
  }

  private async run(lifecycle: Lifecycle): Promise<void> {
    for (const probeName of this.probes) {
      logger.debug(`start with probe -> ${probeName}`);
      const probe = ProbeCenter.probe(probeName);
      if (!probe) {
        logger.warn(`not found probe by name: ${probeName}, please register it.`);
        continue;
      }
      const alerts = await probe.probe(lifecycle);
      console.log(`[${probeName}] alerts: `, alerts);
      await Timeout.set(1000);
    }
  }
}
