import {AlarmProbe} from "alarmmgr-probe-traits";
import {Alert, Lifecycle} from "alarmmgr-types";
import {ParaWithParaArg} from "../types/inner";
import {Subquery} from "alarmmgr-subquery";
import {S2SBridgeProbeDetectGrandpa} from "../common/detect_grandpa";
import {S2SBridgeProbeDetectMessage} from "../common/detect_message";


export class ParaWithParaBridgeProbe implements AlarmProbe {


  private readonly arg: ParaWithParaArg;
  private readonly lifecycle: Lifecycle;
  private readonly sourceParaSubql: Subquery;
  private readonly sourceRelaySubql: Subquery;
  private readonly targetParaSubql: Subquery;
  private readonly targetRelaySubql: Subquery;

  constructor(options: {
    lifecycle: Lifecycle,
    arg: ParaWithParaArg,
  }) {
    this.arg = options.arg;
    this.lifecycle = options.lifecycle;
    this.sourceParaSubql = new Subquery(this.arg.sourceParaChain.subql);
    this.sourceRelaySubql = new Subquery(this.arg.sourceRelayChain.subql);
    this.targetParaSubql = new Subquery(this.arg.targetParaChain.subql);
    this.targetRelaySubql = new Subquery(this.arg.targetRelayChain.subql);
  }

  async probe(): Promise<Array<Alert>> {
    const _alertsGrandpaSourceRelayToTargetPara = await new S2SBridgeProbeDetectGrandpa({
      arg: {
        sourceChain: this.arg.sourceRelayChain,
        sourceClient: this.arg.sourceRelayClient,
        targetChain: this.arg.targetParaChain,
        targetClient: this.arg.targetParaClient,
      },
      sourceSubql: this.sourceRelaySubql,
      targetSubql: this.targetParaSubql,
      parachainBridge: true,
      // @ts-ignore
      grandpaPalletName: this.arg.targetParaChain.bridge_target[this.arg.sourceParaChain.bridge_chain_name].query_name.grandpa
    }).detect();
    const _alertsGrandpaTargetRelayToSourcePara = await new S2SBridgeProbeDetectGrandpa({
      arg: {
        sourceChain: this.arg.targetParaChain,
        sourceClient: this.arg.targetParaClient,
        targetChain: this.arg.sourceRelayChain,
        targetClient: this.arg.sourceRelayClient,
      },
      sourceSubql: this.targetParaSubql,
      targetSubql: this.sourceRelaySubql,
      parachainBridge: true,
      // @ts-ignore
      grandpaPalletName: this.arg.sourceParaChain.bridge_target[this.arg.targetParaChain.bridge_chain_name].query_name.grandpa
    }).detect();
    const _alertsMessageSourceParaToTargetPara = await new S2SBridgeProbeDetectMessage({
      arg: {
        sourceChain: this.arg.sourceParaChain,
        sourceClient: this.arg.sourceParaClient,
        targetChain: this.arg.targetParaChain,
        targetClient: this.arg.targetParaClient,
      },
      lifecycle: this.lifecycle,
    }).detect();
    const _alertsMessageTargetParaToSourcePara = await new S2SBridgeProbeDetectMessage({
      arg: {
        sourceChain: this.arg.targetParaChain,
        sourceClient: this.arg.targetParaClient,
        targetChain: this.arg.sourceParaChain,
        targetClient: this.arg.sourceParaClient,
      },
      lifecycle: this.lifecycle,
    }).detect();
    return [
      ..._alertsGrandpaSourceRelayToTargetPara,
      ..._alertsGrandpaTargetRelayToSourcePara,
      ..._alertsMessageSourceParaToTargetPara,
      ..._alertsMessageTargetParaToSourcePara,
    ];
  }

}
