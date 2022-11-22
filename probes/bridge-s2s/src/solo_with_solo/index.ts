import {AlarmProbe} from "alarmmgr-probe-traits";
import {Chain} from "../types/inner";

export class SoloWithSoloBridgeProde implements AlarmProbe {

  private source: Chain;
  private target: Chain;

  constructor(options: {
    source: Chain,
    target: Chain,
  }) {
    this.source = options.source;
    this.target = options.target;
  }

  async probe(): Promise<void> {

  }

}
