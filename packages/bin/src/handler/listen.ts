import Timeout from 'await-timeout';
import {logger} from 'alarmmgr-logger';
import {Alert, Lifecycle, Priority} from 'alarmmgr-types';
import {InstanceCenter} from "../plugins/probe_center";
import {Initializer} from "../initializer";
import {AlarmProbe} from "alarmmgr-probe-traits";
import {PeriodicNotification} from "../plugins/periodic_notification";

export class ListenHandler {
  constructor(
    /**
     * probe bridges
     */
    private readonly probes?: Array<string>,
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
    if (!this.probes) {
      logger.warn('not have any probes');
      return;
    }
    const alerts = [];
    for (const probeName of this.probes) {
      logger.debug(`start with probe -> ${probeName}`);
      const probe = InstanceCenter.getProbe(probeName);
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
    const notifications = InstanceCenter.getNotifications();
    await new PeriodicNotification({notifications, lifecycle}).notify(alerts);
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
      // todo: improve this alert
      alerts.push({
        priority: Priority.P2,
        mark: `call-probe-failed-${name}`,
        title: `failed to call probe ${name}`,
        body: `${e}`,
      });
    }
    logger.info(`[${name}] alerts: {}`, alerts);
    return alerts;
  }
}
