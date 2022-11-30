import {SoloWithSoloPara} from "../types/inner";

export class S2SBridgeProbeDetectGrandpa {

  constructor(
    private readonly para: SoloWithSoloPara,
  ) {
  }

  public async detect(): Promise<void> {
    const {sourceClient} = this.para;
    const block = await sourceClient.rpc.chain.getBlock();
    console.log(block.toJSON());
  }
}
