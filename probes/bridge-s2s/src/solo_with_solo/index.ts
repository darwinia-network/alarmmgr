import {AlarmProbe} from "alarmmgr-probe-traits";
import {S2SBridgeProbeDetectGrandpa} from "../common/detect_grandpa";
import {SoloWithSoloArg} from "../types/inner";
import {Subquery} from "alarmmgr-subquery";
import {Alert} from "alarmmgr-types";

export class SoloWithSoloBridgeProde implements AlarmProbe {

  private readonly sourceSubql: Subquery;
  private readonly targetSubql: Subquery;

  constructor(
    private readonly arg: SoloWithSoloArg,
  ) {
    this.sourceSubql = new Subquery(arg.sourceChain.subql);
    this.targetSubql = new Subquery(arg.targetChain.subql);
  }

  async probe(): Promise<Array<Alert>> {
    const _alertsGrandpaSourceToTarget = await new S2SBridgeProbeDetectGrandpa({
      arg: this.arg,
      sourceSubql: this.sourceSubql,
      targetSubql: this.targetSubql,
    }).detect();
    const _alertsGrandpaTargetToSource = await new S2SBridgeProbeDetectGrandpa({
      arg: {
        sourceChain: this.arg.targetChain,
        sourceClient: this.arg.targetClient,
        targetChain: this.arg.sourceChain,
        targetClient: this.arg.sourceClient,
      },
      sourceSubql: this.targetSubql,
      targetSubql: this.sourceSubql,
    }).detect();
    return [
      ..._alertsGrandpaSourceToTarget,
      ..._alertsGrandpaTargetToSource,
    ];
  }

}
