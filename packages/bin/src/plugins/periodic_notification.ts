import {AlarmNotification} from "alarmmgr-notification-traits";
import {Alert} from "alarmmgr-types";
import {logger} from "alarmmgr-logger";

export class PeriodicNotification implements AlarmNotification {
  constructor(
    private readonly notifications: Array<AlarmNotification>
  ) {
  }

  async notify(alerts: Array<Alert>): Promise<void> {
    for (const notification of this.notifications) {
      try {
        await notification.notify(alerts);
      } catch (e) {
        logger.error(`failed to call notification: ${e}`);
      }
    }
  }


}
