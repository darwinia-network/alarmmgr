import {AlarmProbe} from "alarmmgr-probe-traits";
import {S2SBridgeProbeDetectGrandpa} from "../common/detect_grandpa";
import {SoloWithSoloArg} from "../types/inner";
import {Subquery} from "alarmmgr-subquery";
import {Alert, Lifecycle} from "alarmmgr-types";
import {S2SBridgeProbeDetectMessage} from "../common/detect_message";

export class SoloWithSoloBridgeProde implements AlarmProbe {

  private readonly arg: SoloWithSoloArg;
  private readonly lifecycle: Lifecycle;
  private readonly sourceSubql: Subquery;
  private readonly targetSubql: Subquery;

  constructor(options: {
    lifecycle: Lifecycle,
    arg: SoloWithSoloArg,
  }) {
    this.arg = options.arg;
    this.lifecycle = options.lifecycle;
    this.sourceSubql = new Subquery(options.arg.sourceChain.subql);
    this.targetSubql = new Subquery(options.arg.targetChain.subql);
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

    const _alertsMessageSourceToTarget = await new S2SBridgeProbeDetectMessage({
      arg: this.arg,
      lifecycle: this.lifecycle,
    }).detect();
    const _alertsMessageTargetToSource = await new S2SBridgeProbeDetectMessage({
      arg: {
        sourceChain: this.arg.targetChain,
        sourceClient: this.arg.targetClient,
        targetChain: this.arg.sourceChain,
        targetClient: this.arg.sourceClient,
      },
      lifecycle: this.lifecycle,
    }).detect();
    return [
      ..._alertsGrandpaSourceToTarget,
      ..._alertsGrandpaTargetToSource,
      ..._alertsMessageSourceToTarget,
      ..._alertsMessageTargetToSource,
    ];
  }

}
