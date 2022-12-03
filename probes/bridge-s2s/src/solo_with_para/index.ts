import {AlarmProbe} from "alarmmgr-probe-traits";
import {Alert} from "alarmmgr-types";
import {SoloWithParaArg} from "../types/inner";
import {Subquery} from "alarmmgr-subquery";
import {S2SBridgeProbeDetectGrandpa} from "../common/detect_grandpa";

export class SoloWithParaBridgeProde implements AlarmProbe {

  private readonly soloSubql: Subquery;
  private readonly paraSubql: Subquery;
  private readonly relaySubql: Subquery;

  constructor(
    private readonly arg: SoloWithParaArg,
    ) {
    this.soloSubql = new Subquery(arg.soloChain.subql);
    this.paraSubql = new Subquery(arg.paraChain.subql);
    this.relaySubql = new Subquery(arg.relayChain.subql);
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
    return [
      ..._alertsGrandpaSoloToPara,
      ..._alertsGrandpaRelayToSolo,
    ];
  }



}
