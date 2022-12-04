import Timeout from 'await-timeout';
import {logger} from 'alarmmgr-logger';
import {Alert, Level, Lifecycle} from 'alarmmgr-types';
import {ProbeCenter} from "../plugins/probe_center";
import {Initializer} from "../initializer";
import {AlarmProbe} from "alarmmgr-probe-traits";

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
    const alerts = [];
    for (const probeName of this.probes) {
      logger.debug(`start with probe -> ${probeName}`);
      const probe = ProbeCenter.probe(probeName);
      if (!probe) {
        logger.warn(`not found probe: [${probeName}], please register it.`);
        continue;
      }
      const _alerts = await this.callProbe({
        name: probeName,
        probe,
        lifecycle,
      });
      await Timeout.set(1000);
      alerts.push(..._alerts);
    }
  }

  private async callProbe(options: {
    name: string,
    probe: AlarmProbe,
    lifecycle: Lifecycle,
  }): Promise<Array<Alert>> {
    const {name, probe, lifecycle} = options;
    const alerts = [];
    try {
      const _alerts = await probe.probe(lifecycle);
      alerts.push(..._alerts);
    } catch (e) {
      alerts.push({
        level: Level.P2,
        mark: `probe-call-failed-${name}`,
        title: `call probe ${name} failed`,
        body: `exception trace: ${e}`,
      });
    }
    logger.info(`[${name}] alerts: {}`, alerts);
    return alerts;
  }
}
