import {AlarmProbe} from "alarmmgr-probe-traits";
import {Alert, Lifecycle} from "alarmmgr-types";
import {SoloWithParaArg} from "../types/inner";
import {Subquery} from "alarmmgr-subquery";
import {S2SBridgeProbeDetectGrandpa} from "../common/detect_grandpa";
import {S2SBridgeProbeDetectMessage} from "../common/detect_message";
import {S2SBridgeProbeDetectParahead} from "../common/detect_parahead";

export class SoloWithParaBridgeProde implements AlarmProbe {

  private readonly arg: SoloWithParaArg;
  private readonly lifecycle: Lifecycle;
  private readonly soloSubql: Subquery;
  private readonly paraSubql: Subquery;
  private readonly relaySubql: Subquery;

  constructor(options: {
    lifecycle: Lifecycle,
    arg: SoloWithParaArg,
  }) {
    this.arg = options.arg;
    this.lifecycle = options.lifecycle;
    this.soloSubql = new Subquery(this.arg.soloChain.subql);
    this.paraSubql = new Subquery(this.arg.paraChain.subql);
    this.relaySubql = new Subquery(this.arg.relayChain.subql);
  }

  async probe(): Promise<Array<Alert>> {
    const _alertsGrandpaSoloToPara = await new S2SBridgeProbeDetectGrandpa({
      arg: {
        sourceChain: this.arg.soloChain,
        sourceClient: this.arg.soloClient,
        targetChain: this.arg.paraChain,
        targetClient: this.arg.paraClient,
      },
      sourceSubql: this.soloSubql,
      targetSubql: this.paraSubql,
    }).detect();
    const _alertsGrandpaRelayToSolo = await new S2SBridgeProbeDetectGrandpa({
      arg: {
        sourceChain: this.arg.relayChain,
        sourceClient: this.arg.relayClient,
        targetChain: this.arg.soloChain,
        targetClient: this.arg.soloClient,
      },
      sourceSubql: this.relaySubql,
      targetSubql: this.soloSubql,
      parachainBridge: true,
      // @ts-ignore
      grandpaPalletName: this.arg.soloChain.bridge_target[this.arg.paraChain.bridge_chain_name].query_name.grandpa
    }).detect();
    const _alertsMessageSoloToPara = await new S2SBridgeProbeDetectMessage({
      arg: {
        sourceChain: this.arg.soloChain,
        sourceClient: this.arg.soloClient,
        targetChain: this.arg.paraChain,
        targetClient: this.arg.paraClient,
      },
      lifecycle: this.lifecycle,
    }).detect();
    const _alertsMessageParaToSolo = await new S2SBridgeProbeDetectMessage({
      arg: {
        sourceChain: this.arg.paraChain,
        sourceClient: this.arg.paraClient,
        targetChain: this.arg.soloChain,
        targetClient: this.arg.soloClient,
      },
      lifecycle: this.lifecycle,
    }).detect();
    // const _alertsParahead = await new S2SBridgeProbeDetectParahead({
    //   arg: this.arg,
    // }).detect();
    return [
      ..._alertsGrandpaSoloToPara,
      ..._alertsGrandpaRelayToSolo,
      ..._alertsMessageSoloToPara,
      ..._alertsMessageParaToSolo,
      // ..._alertsParahead,
    ];
  }



}
