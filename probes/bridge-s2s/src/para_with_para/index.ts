import {AlarmProbe} from "alarmmgr-probe-traits";
import {Alert, Lifecycle} from "alarmmgr-types";


export class ParaWithParaBridgeProbe implements AlarmProbe {
  async probe(lifecycle: Lifecycle): Promise<Array<Alert>> {
    return Promise.resolve(undefined);
  }

}
