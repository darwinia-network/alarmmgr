import {AlarmProbe} from "alarmmgr-probe-traits";
import {Bridge} from "./types/expose";
import {SoloWithSoloBridgeProde} from "./solo_with_solo";
import {logger} from "alarmmgr-logger";
import {BRIDGE_CHAIN_INFO, S2SBridgeChain} from "alarmmgr-types";
import {ApiPromise, WsProvider} from "@polkadot/api";
import {SoloWithSoloPara} from "./types/inner";


export class BridgeS2SProbe implements AlarmProbe {

  private readonly bridge: Bridge;

  private static connectionMap: Map<string, ApiPromise> = new Map<string, ApiPromise>();

  constructor(options: {
    bridge: Bridge,
  }) {
    this.bridge = options.bridge;
  }

  async probe(): Promise<void> {
    switch (this.bridge) {
      case Bridge.PangolinPangoro:
      case Bridge.DarwiniaCrab:
        const para = await this.extractSoloWithSoloChainPairs();
        return new SoloWithSoloBridgeProde(para).probe();
      case Bridge.CrabCrabParachain:
      case Bridge.PangolinPangolinParachain:
      case Bridge.PangolinPangolinParachainAlpha:
        throw new Error('Coming soon');
    }
  }


  private async extractSoloWithSoloChainPairs(): Promise<SoloWithSoloPara> {
    const [leftChainName, rightChainName] = this.bridge.split('-');
    const [sourceChain, targetChain]: [S2SBridgeChain, S2SBridgeChain] = [
      BRIDGE_CHAIN_INFO[leftChainName], BRIDGE_CHAIN_INFO[rightChainName]
    ];

    let sourceClient = BridgeS2SProbe.connectionMap.get(leftChainName);
    let targetClient = BridgeS2SProbe.connectionMap.get(rightChainName);
    if (!sourceClient) {
      logger.info(`connect to ${sourceChain.endpoint.websocket}`);
      const sourceProvider = new WsProvider(sourceChain.endpoint.websocket);
      sourceClient = await ApiPromise.create({provider: sourceProvider});
      BridgeS2SProbe.connectionMap.set(leftChainName, sourceClient);
      logger.debug('connected');
    }
    if (!targetClient) {
      logger.info(`connect to ${targetChain.endpoint.websocket}`);
      const targetProvider = new WsProvider(targetChain.endpoint.websocket);
      targetClient = await ApiPromise.create({provider: targetProvider});
      BridgeS2SProbe.connectionMap.set(rightChainName, targetClient);
      logger.debug('connected');
    }

    return {
      sourceChain,
      targetChain,
      sourceClient,
      targetClient,
    }
  }


}
