import {AlarmProbe} from "alarmmgr-probe-traits";
import {Bridge} from "./types/expose";
import {SoloWithSoloBridgeProde} from "./solo_with_solo";
import {Alert, BRIDGE_CHAIN_INFO, Lifecycle, S2SBridgeChain} from "alarmmgr-types";
import {ParaWithParaArg, SoloWithParaArg, SoloWithSoloArg} from "./types/inner";
import {SoloWithParaBridgeProde} from "./solo_with_para";
import {SubstrateClientInstance} from "alarmmgr-plugin-conn-substrate/src";
import {ParaWithParaBridgeProbe} from "./para_with_para";


export class BridgeS2SProbe implements AlarmProbe {

  private readonly bridge: Bridge;

  constructor(options: {
    bridge: Bridge,
  }) {
    this.bridge = options.bridge;
  }

  async probe(lifecycle: Lifecycle): Promise<Array<Alert>> {
    switch (this.bridge) {
      case Bridge.DarwiniaCrab:
        const arg_0 = await this.extractSoloWithSoloChainPairs();
        return await new SoloWithSoloBridgeProde({lifecycle, arg: arg_0}).probe();
      case Bridge.CrabCrabParachain:
      case Bridge.PangolinPangolinParachain:
      case Bridge.PangolinPangolinParachainAlpha:
        const arg_1 = await this.extractSoloWithParaChainPairs();
        return await new SoloWithParaBridgeProde({lifecycle, arg: arg_1}).probe();
      case Bridge.PangolinPangoro:
        const arg_2 = await this.extractParaWithParaChainPairs();
        return await new ParaWithParaBridgeProbe({lifecycle, arg: arg_2}).probe();
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

  private async extractParaWithParaChainPairs(): Promise<ParaWithParaArg> {
    const [leftChainName, rightChainName] = this.bridge.split('-');
    const [sourceParaChain, targetParaChain]: [S2SBridgeChain, S2SBridgeChain] = [
      BRIDGE_CHAIN_INFO[leftChainName], BRIDGE_CHAIN_INFO[rightChainName]
    ];
    sourceParaChain.bridge_chain_name = leftChainName;
    targetParaChain.bridge_chain_name = rightChainName;

    // @ts-ignore
    const sourceRelayChainName = targetParaChain.bridge_target[sourceParaChain.bridge_chain_name].relay_chain;
    // @ts-ignore
    const targetRelayChainName = sourceParaChain.bridge_target[targetParaChain.bridge_chain_name].relay_chain;
    const sourceRelayChain: S2SBridgeChain = BRIDGE_CHAIN_INFO[sourceRelayChainName];
    const targetRelayChain: S2SBridgeChain = BRIDGE_CHAIN_INFO[targetRelayChainName];
    sourceRelayChain.bridge_chain_name = sourceRelayChainName;
    targetRelayChain.bridge_chain_name = targetRelayChainName;
    const sourceParaClient = await SubstrateClientInstance.instance(sourceParaChain.endpoint.http);
    const targetParaClient = await SubstrateClientInstance.instance(targetParaChain.endpoint.http);
    const sourceRelayClient = await SubstrateClientInstance.instance(sourceRelayChain.endpoint.http);
    const targetRelayClient = await SubstrateClientInstance.instance(targetRelayChain.endpoint.http);
    return {
      sourceParaChain,
      targetParaChain,
      sourceRelayChain,
      targetRelayChain,
      sourceParaClient,
      targetParaClient,
      sourceRelayClient,
      targetRelayClient,
    };
  }
}
