import {Alert} from "alarmmgr-types";
import {AlarmNotification} from "alarmmgr-notification-traits";

export class SlackNotification implements AlarmNotification {
  async notify(alerts: Array<Alert>): Promise<void> {

  }
}
