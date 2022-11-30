import {AlarmProbe} from "alarmmgr-probe-traits";
import {S2SBridgeProbeDetectGrandpa} from "../common/detect_grandpa";
import {SoloWithSoloPara} from "../types/inner";

export class SoloWithSoloBridgeProde implements AlarmProbe {


  constructor(
    private readonly para: SoloWithSoloPara,
  ) {
  }

  async probe(): Promise<void> {
    const detectGrandpa = new S2SBridgeProbeDetectGrandpa(this.para);
    await detectGrandpa.detect();
  }

}
