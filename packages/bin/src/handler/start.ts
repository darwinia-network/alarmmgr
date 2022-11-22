import Timeout from 'await-timeout';
import {logger} from 'alarmmgr-logger';
import {Bridge, BridgeS2SProbe} from "alarmmgr-probe-s2s";

export class StartHandler {
  constructor(
    /**
     * probe bridges
     */
    private readonly bridges: Array<string>,
  ) {
  }

  public async start(): Promise<void> {
    while (true) {
      try {
        await this.run();
        await Timeout.set(1000);
      } catch (e) {
        console.error(e);
      }
    }
  }

  private async run(): Promise<void> {
    logger.debug(`start with bridges -> ${this.bridges}`);
    for (const bridge of this.bridges) {
      let probe;
      const bridgeS2S = Bridge.of(bridge);
      if (bridgeS2S) {
        probe = new BridgeS2SProbe({bridge: bridgeS2S});
      }

      if (probe) {
        await probe.probe();
      }
      await Timeout.set(1000);
    }
  }
}
