import Timeout from 'await-timeout';
import {logger} from 'alarmmgr-logger';

export class StartHandler {
  constructor(
    /**
     * probe bridges
     */
    private readonly bridges: Array<string>,
  ) {
  }

  public async start(): Promise<void> {
    while(true) {
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
  }
}
