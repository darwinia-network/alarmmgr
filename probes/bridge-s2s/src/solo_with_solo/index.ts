import {AlarmProbe} from "alarmmgr-probe-traits";
import {S2SBridgeProbeDetectGrandpa} from "../common/detect_grandpa";
import {SoloWithSoloPara} from "../types/inner";
import {Subquery} from "alarmmgr-subquery/src/subquery";

export class SoloWithSoloBridgeProde implements AlarmProbe {

  private readonly sourceSubql: Subquery;
  private readonly targetSubql: Subquery;

  constructor(
    private readonly para: SoloWithSoloPara,
  ) {
    this.sourceSubql = new Subquery(para.sourceChain.subql);
    this.targetSubql = new Subquery(para.targetChain.subql);
  }

  async probe(): Promise<void> {
    const detectGrandpa = new S2SBridgeProbeDetectGrandpa({
      para: this.para,
      sourceSubql: this.sourceSubql,
      targetSubql: this.targetSubql,
      // parachainBridge: false,
    });
    await detectGrandpa.detect();
  }

}
