import {AlarmNotification} from "alarmmgr-notification-traits";
import {Alert, Lifecycle} from "alarmmgr-types";
import {logger} from "alarmmgr-logger";

export class PeriodicNotification implements AlarmNotification {
  private readonly notifications: Array<AlarmNotification>;
  private readonly lifecycle: Lifecycle;

  constructor(options: {
    notifications: Array<AlarmNotification>,
    lifecycle: Lifecycle,
  }) {
    this.notifications = options.notifications;
    this.lifecycle = options.lifecycle;
  }

  async notify(alerts: Array<Alert>): Promise<void> {
    const _alerts = await this.reorganizeAlerts(alerts);
    if (!_alerts.length) {
      return;
    }
    for (const notification of this.notifications) {
      try {
        await notification.notify(_alerts);
      } catch (e) {
        logger.error(`failed to call notification: ${e}`);
      }
    }
  }


  private async reorganizeAlerts(alerts: Array<Alert>): Promise<Array<Alert>> {
    const kv = this.lifecycle.kv;
    const _latestNotification = await kv.get('latest-notification');

    const reorganize = [];
    let latestNotifications: Array<NotificationKvSchema> = JSON.parse(_latestNotification?.toString() ?? '[]');

    // Only this time also exists. Indicates that it is still in the alarm state
    latestNotifications = latestNotifications.filter(latest => {
      return alerts.find(alert => alert.mark == latest.mark);
    });

    const now = +new Date();
    let times = 1;
    for (const alert of alerts) {
      const foundLast = latestNotifications.find(latest => latest.mark == alert.mark);
      /// first notify
      if (!foundLast) {
        reorganize.push(alert);
        latestNotifications.push({mark: alert.mark, time: now, times});
        continue;
      }
      /// notify multiple times
      switch (foundLast.times) {
        case 1:
          if (now - foundLast.time > 1000 * 60 * 2) {
            reorganize.push(alert);
            latestNotifications = latestNotifications.filter(latest => latest.mark != alert.mark);
            latestNotifications.push({mark: alert.mark, time: now, times: times + 1});
            continue;
          }
          break;
        case 2:
          if (now - foundLast.time > 1000 * 60 * 5) {
            reorganize.push(alert);
            latestNotifications = latestNotifications.filter(latest => latest.mark != alert.mark);
            latestNotifications.push({mark: alert.mark, time: now, times: times + 2});
            continue;
          }
          break;
        case 3:
          if (now - foundLast.time > 1000 * 60 * 10) {
            reorganize.push(alert);
            latestNotifications = latestNotifications.filter(latest => latest.mark != alert.mark);
            latestNotifications.push({mark: alert.mark, time: now, times});
            continue;
          }
          break;
      }
    }
    await kv.set('latest-notification', JSON.stringify(latestNotifications));
    return reorganize;
  }

}

interface NotificationKvSchema {
  mark: string,
  time: number,
  times: number,
}
