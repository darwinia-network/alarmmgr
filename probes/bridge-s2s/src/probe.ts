import {AlarmProbe} from "alarmmgr-probe-traits";
import {Bridge} from "./types/expose";
import {SoloWithSoloBridgeProde} from "./solo_with_solo";
import {logger} from "alarmmgr-logger";
import {Alert, BRIDGE_CHAIN_INFO, S2SBridgeChain} from "alarmmgr-types";
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

  async probe(): Promise<Array<Alert>> {
    switch (this.bridge) {
      case Bridge.PangolinPangoro:
      case Bridge.DarwiniaCrab:
        const para = await this.extractSoloWithSoloChainPairs();
        return new SoloWithSoloBridgeProde(para).probe();
      case Bridge.CrabCrabParachain:
      case Bridge.PangolinPangolinParachain:
      case Bridge.PangolinPangolinParachainAlpha:
        const arg = await this.extractSoloWithParaChainPairs();
        return new SoloWithParaBridgeProde(arg).probe();
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
    logger.info(`connect to ${options.httpEndpoint}`);
    const provider = new HttpProvider(options.httpEndpoint);
    const client = await ApiPromise.create({provider: provider});
    BridgeS2SProbe.connectionMap.set(options.chainName, client);
    logger.debug('connected');
    return client;
  }

  // private async extractSoloWithSoloChainPairs(): Promise<SoloWithSoloArg> {
  //   const [leftChainName, rightChainName] = this.bridge.split('-');
  //   const [sourceChain, targetChain]: [S2SBridgeChain, S2SBridgeChain] = [
  //     BRIDGE_CHAIN_INFO[leftChainName], BRIDGE_CHAIN_INFO[rightChainName]
  //   ];
  //   sourceChain.bridge_chain_name = leftChainName;
  //   targetChain.bridge_chain_name = rightChainName;
  //
  //   let sourceClient = BridgeS2SProbe.connectionMap.get(leftChainName);
  //   let targetClient = BridgeS2SProbe.connectionMap.get(rightChainName);
  //   if (!sourceClient) {
  //     logger.info(`connect to ${sourceChain.endpoint.http}`);
  //     const sourceProvider = new HttpProvider(sourceChain.endpoint.http);
  //     sourceClient = await ApiPromise.create({provider: sourceProvider});
  //     BridgeS2SProbe.connectionMap.set(leftChainName, sourceClient);
  //     logger.debug('connected');
  //   }
  //   if (!targetClient) {
  //     logger.info(`connect to ${targetChain.endpoint.http}`);
  //     const targetProvider = new HttpProvider(targetChain.endpoint.http);
  //     targetClient = await ApiPromise.create({provider: targetProvider});
  //     BridgeS2SProbe.connectionMap.set(rightChainName, targetClient);
  //     logger.debug('connected');
  //   }
  //   // if (!sourceClient.isConnected) {
  //   //   await sourceClient.disconnect();
  //   //   await Timeout.set(1000 * 10);
  //   //   await sourceClient.connect();
  //   // }
  //   // if (!targetClient.isConnected) {
  //   //   await sourceClient.disconnect();
  //   //   await Timeout.set(1000 * 10);
  //   //   await targetClient.connect();
  //   // }
  //
  //   return {
  //     sourceChain,
  //     targetChain,
  //     sourceClient,
  //     targetClient,
  //   }
  // }


}
