import {Alert} from "alarmmgr-types";

/**
 * alarm probe
 */
export interface AlarmProbe {
  probe(): Promise<Array<Alert>>;
}
