import {AlarmProbe} from "alarmmgr-probe-traits";
import {AlarmNotification} from "alarmmgr-notification-traits";


export class InstanceCenter {
  private static probeMap: Map<string, AlarmProbe> = new Map<string, AlarmProbe>();
  private static notifications: Array<AlarmNotification> = [];

  public static registerProbe(name: string, probe: AlarmProbe): void {
    this.probeMap.set(name, probe);
  }

  public static getProbe(name: string): AlarmProbe | undefined {
    return this.probeMap.get(name);
  }

  public static addNotifications(notifications: Array<AlarmNotification>): void {
    for (const notification of notifications) {
      this.addNotification(notification);
    }
  }

  public static addNotification(notification: AlarmNotification): void {
    this.notifications.push(notification);
  }

  public static getNotifications(): Array<AlarmNotification> {
    return this.notifications;
  }
}

