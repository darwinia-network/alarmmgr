import {AlarmProbe} from "alarmmgr-probe-traits";
import {Bridge} from "./types/expose";
import {SoloWithSoloBridgeProde} from "./solo_with_solo";
import {Alert, BRIDGE_CHAIN_INFO, Lifecycle, S2SBridgeChain} from "alarmmgr-types";
import {SoloWithParaArg, SoloWithSoloArg} from "./types/inner";
import {SoloWithParaBridgeProde} from "./solo_with_para";
import {SubstrateClientInstance} from "alarmmgr-plugin-conn-substrate/src";


export class BridgeS2SProbe implements AlarmProbe {

  private readonly bridge: Bridge;

  constructor(options: {
    bridge: Bridge,
  }) {
    this.bridge = options.bridge;
  }

  async probe(lifecycle: Lifecycle): Promise<Array<Alert>> {
    switch (this.bridge) {
      case Bridge.PangolinPangoro:
      case Bridge.DarwiniaCrab:
        const arg_0 = await this.extractSoloWithSoloChainPairs();
        return await new SoloWithSoloBridgeProde({lifecycle, arg: arg_0}).probe();
      case Bridge.CrabCrabParachain:
      case Bridge.PangolinPangolinParachain:
      case Bridge.PangolinPangolinParachainAlpha:
        const arg_1 = await this.extractSoloWithParaChainPairs();
        return await new SoloWithParaBridgeProde({lifecycle, arg: arg_1}).probe();
      default:
        return [];
    }
  }


  private async extractSoloWithParaChainPairs(): Promise<SoloWithParaArg> {
    const [leftChainName, rightChainName] = this.bridge.split('-');
    const [soloChain, paraChain]: [S2SBridgeChain, S2SBridgeChain] = [
      BRIDGE_CHAIN_INFO[leftChainName], BRIDGE_CHAIN_INFO[rightChainName]
    ];
    soloChain.bridge_chain_name = leftChainName;
    paraChain.bridge_chain_name = rightChainName;
    // @ts-ignore
    const relayChainName = paraChain.bridge_target[soloChain.bridge_chain_name].relay_chain;
    const relayChain: S2SBridgeChain = BRIDGE_CHAIN_INFO[relayChainName];
    relayChain.bridge_chain_name = relayChainName;

    const soloClient = await SubstrateClientInstance.instance(soloChain.endpoint.http);
    const paraClient = await SubstrateClientInstance.instance(paraChain.endpoint.http);
    const relayClient = await SubstrateClientInstance.instance(relayChain.endpoint.http);
    return {
      soloChain,
      soloClient,
      paraChain,
      paraClient,
      relayChain,
      relayClient,
    }
  }

  private async extractSoloWithSoloChainPairs(): Promise<SoloWithSoloArg> {
    const [leftChainName, rightChainName] = this.bridge.split('-');
    const [sourceChain, targetChain]: [S2SBridgeChain, S2SBridgeChain] = [
      BRIDGE_CHAIN_INFO[leftChainName], BRIDGE_CHAIN_INFO[rightChainName]
    ];
    sourceChain.bridge_chain_name = leftChainName;
    targetChain.bridge_chain_name = rightChainName;

    const sourceClient = await SubstrateClientInstance.instance(sourceChain.endpoint.http);
    const targetClient = await SubstrateClientInstance.instance(targetChain.endpoint.http);

    return {
      sourceChain,
      targetChain,
      sourceClient,
      targetClient,
    }
  }
}
