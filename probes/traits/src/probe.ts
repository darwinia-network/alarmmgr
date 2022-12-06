import {Alert, Lifecycle} from "alarmmgr-types";

/**
 * alarm probe
 */
export interface AlarmProbe {
  probe(lifecycle: Lifecycle): Promise<Array<Alert>>;
}
