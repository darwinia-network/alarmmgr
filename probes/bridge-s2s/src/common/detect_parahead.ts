import {SoloWithParaArg} from "../types/inner";
import {Alert, Alerts, Lifecycle} from "alarmmgr-types";

export class S2SBridgeProbeDetectParahead {

  private readonly arg: SoloWithParaArg;


  constructor(options: {
    arg: SoloWithParaArg,
  }) {
    this.arg = options.arg;
  }

  public async detect(): Promise<Array<Alert>> {
    const alertsParaheadRelay = await this.detectParahead();
    return alertsParaheadRelay.alerts();
  }

  private async detectParahead(): Promise<Alerts> {
    const alerts = Alerts.create();
    const {soloChain, soloClient, paraChain, paraClient} = this.arg;
    // @ts-ignore
    const soloBridgeTarget = soloChain.bridge_target[paraChain.bridge_chain_name];
    const _bestParaHeads = await soloClient.query[soloBridgeTarget.query_name.parachain]
      .bestParaHeads(soloBridgeTarget.para_id);
    // @ts-ignore
    const bestParaHeads: BestParaHead = _bestParaHeads.toJSON();
    console.log(bestParaHeads);
    const lastRelayedParachainBlock = await paraClient.rpc.chain.getBlock(bestParaHeads.headHash);
    // todo: how to check parahead stalled?
    return alerts;
  }

}

interface BestParaHead {
  atRelayBlockNumber: number,
  headHash: string,
  nextImportedHashPosition: number,
}
