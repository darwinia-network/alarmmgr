import {AlarmProbe} from "alarmmgr-probe-traits";
import {Bridge} from "./types/expose";
import {SoloWithSoloBridgeProde} from "./solo_with_solo";
import {logger} from "alarmmgr-logger";
import {Alert, BRIDGE_CHAIN_INFO, Lifecycle, S2SBridgeChain} from "alarmmgr-types";
import {ApiPromise, HttpProvider, WsProvider} from "@polkadot/api";
import {SoloWithParaArg, SoloWithSoloArg} from "./types/inner";
import Timeout from 'await-timeout';
import {SoloWithParaBridgeProde} from "./solo_with_para";


export class BridgeS2SProbe implements AlarmProbe {

  private readonly bridge: Bridge;

  private static connectionMap: Map<string, ApiPromise> = new Map<string, ApiPromise>();

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

    const soloClient = await this.substrateClient({
      chainName: leftChainName,
      httpEndpoint: soloChain.endpoint.http,
    });
    const paraClient = await this.substrateClient({
      chainName: rightChainName,
      httpEndpoint: paraChain.endpoint.http,
    });
    const relayClient = await this.substrateClient({
      chainName: relayChainName,
      httpEndpoint: relayChain.endpoint.http,
    });
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

    const sourceClient = await this.substrateClient({
      chainName: leftChainName,
      httpEndpoint: sourceChain.endpoint.http,
    });
    const targetClient = await this.substrateClient({
      chainName: rightChainName,
      httpEndpoint: targetChain.endpoint.http,
    });

    return {
      sourceChain,
      targetChain,
      sourceClient,
      targetClient,
    }
  }

  private async substrateClient(options: {chainName: string, httpEndpoint: string}): Promise<ApiPromise> {
    const probe = BridgeS2SProbe.connectionMap.get(options.chainName);
    if (probe) {
      return probe;
    }
    logger.info(`connect to ${options.httpEndpoint}`);
    const provider = new HttpProvider(options.httpEndpoint);
    const client = await ApiPromise.create({provider: provider});
    BridgeS2SProbe.connectionMap.set(options.chainName, client);
    logger.debug('connected');
    return client;
  }

}
