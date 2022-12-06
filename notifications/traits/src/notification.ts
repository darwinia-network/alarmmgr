import {Alert} from "alarmmgr-types";

/**
 * alarm probe
 */
export interface AlarmNotification {
  notify(alerts: Array<Alert>): Promise<void>;
}
