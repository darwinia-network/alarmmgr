import {SoloWithSoloPara} from "../types/inner";
import {logger} from "alarmmgr-logger";
import {Subquery} from "alarmmgr-subquery/src";

export class S2SBridgeProbeDetectGrandpa {

  private readonly para: SoloWithSoloPara;
  private readonly sourceSubql: Subquery;
  private readonly targetSubql: Subquery;

  // private readonly parachainBridge: boolean;
  // private readonly grandpaPalletName?: string;

  constructor(options: {
    para: SoloWithSoloPara,
    sourceSubql: Subquery,
    targetSubql: Subquery,
    // parachainBridge: boolean,
    // grandpaPalletName?: string,
  }) {
    this.para = options.para;
    this.sourceSubql = options.sourceSubql;
    this.targetSubql = options.targetSubql;
    // this.parachainBridge = options.parachainBridge;
    // this.grandpaPalletName = options.grandpaPalletName;
  }

  public async detect(): Promise<void> {
    // const {sourceClient} = this.para;
    // const block = await sourceClient.rpc.chain.getBlock();
    // console.log(block.toJSON());
    await this.detectSourceChain();
  }


  private async detectSourceChain(): Promise<void> {
    const {sourceChain, targetChain, sourceClient, targetClient} = this.para;
    // @ts-ignore
    const palletName = targetChain.bridge_target[sourceChain.bridge_chain_name].query_name.grandpa;
    const _bestFinalizedHash = await targetClient.query[palletName].bestFinalized();
    const bestFinalizedHash = _bestFinalizedHash.toHuman();
    logger.debug(
      `[bridge-${sourceChain.bridge_chain_name}-${targetChain.bridge_chain_name}] \
    ${sourceChain.bridge_chain_name} in ${targetChain.bridge_chain_name} best finalized is: \
    ${bestFinalizedHash}`
    );
    const _bestFinalizedBlock = await sourceClient.rpc.chain.getBlock(bestFinalizedHash.toString());
    const bestFinalizedBlock = _bestFinalizedBlock.toJSON();
    // @ts-ignore
    const bestFinalizedBlockNumber = bestFinalizedBlock.block.header.number;
    console.log('best finalize block number: ', bestFinalizedBlockNumber);
    const nextMandatory = await this.sourceSubql.bridge_s2s()
      .nextMandatoryBlock(bestFinalizedBlockNumber);
    console.log(nextMandatory);

    const nextOnDemand = await this.sourceSubql.bridge_s2s()
      .nextOnDemandBlock(`bridge-${targetChain.bridge_chain_name}`);
    console.log(nextOnDemand);

  }
}
