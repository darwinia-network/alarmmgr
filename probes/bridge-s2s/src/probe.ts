import {AlarmProbe} from "alarmmgr-probe-traits";
import {Bridge} from "./types/expose";
import {Chain} from "./types/inner";
import {SoloWithSoloBridgeProde} from "./solo_with_solo";
import {logger} from "alarmmgr-logger";


export class BridgeS2SProbe implements AlarmProbe {

  private readonly bridge: Bridge;

  constructor(options: {
    bridge: Bridge,
  }) {
    this.bridge = options.bridge;
  }

  async probe(): Promise<void> {
    switch (this.bridge) {
      case Bridge.PangolinPangoro:
      case Bridge.DarwiniaCrab:
        const [source, target] = this.extractSoloWithSoloChainPairs();
        return new SoloWithSoloBridgeProde({source, target}).probe();
      case Bridge.CrabCrabParachain:
      case Bridge.PangolinPangolinParachain:
      case Bridge.PangolinPangolinParachainAlpha:
        throw new Error('Coming soon');
    }
  }


  private extractSoloWithSoloChainPairs(): [Chain, Chain] {
    const [leftChainName, rightChainName] = this.bridge.split('-');
    logger.debug(`LEFT -> ${leftChainName}, RIGHT -> ${rightChainName}`);
    return [{}, {}]
  }


}
