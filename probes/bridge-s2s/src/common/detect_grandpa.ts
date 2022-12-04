import {SoloWithSoloArg} from "../types/inner";
import {logger} from "alarmmgr-logger";
import {BridgeS2SNextRelayBlock, Subquery} from "alarmmgr-subquery";
import {Alert, Alerts, Level} from "alarmmgr-types";

export class S2SBridgeProbeDetectGrandpa {

  private readonly arg: SoloWithSoloArg;
  private readonly sourceSubql: Subquery;
  private readonly targetSubql: Subquery;
  private readonly maxAllowMissingBlock: number;

  private readonly parachainBridge: boolean;
  private readonly grandpaPalletName?: string;

  constructor(options: {
    arg: SoloWithSoloArg,
    sourceSubql: Subquery,
    targetSubql: Subquery,
    parachainBridge?: boolean,
    grandpaPalletName?: string,
  }) {
    this.arg = options.arg;
    this.sourceSubql = options.sourceSubql;
    this.targetSubql = options.targetSubql;
    this.maxAllowMissingBlock = 100;
    this.parachainBridge = options.parachainBridge ?? false;
    this.grandpaPalletName = options.grandpaPalletName;
  }

  public async detect(): Promise<Array<Alert>> {
    const alertsSourceToTarget = await this.detectGrandpa();
    return alertsSourceToTarget.alerts();
  }

  private _grandpaPalletName() {
    if (this.parachainBridge) {
      return this.grandpaPalletName;
    }
    const {sourceChain, targetChain} = this.arg;
    // @ts-ignore
    return targetChain.bridge_target[sourceChain.bridge_chain_name].query_name.grandpa;
  }

  private async detectGrandpa(): Promise<Alerts> {
    const {sourceChain, targetChain, sourceClient, targetClient} = this.arg;
    const palletName = this._grandpaPalletName();
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
    const nextMandatory: BridgeS2SNextRelayBlock = await this.sourceSubql.bridge_s2s()
      .nextMandatoryBlock(bestFinalizedBlockNumber);

    const mark = `bridge-s2s-grandpa-${sourceChain.bridge_chain_name}-to-${targetChain.bridge_chain_name}`;
    const alerts = Alerts.create();
    if (nextMandatory) {
      const missing = nextMandatory.blockNumber - bestFinalizedBlockNumber;
      if (missing > this.maxAllowMissingBlock) {
        alerts.push({
          level: Level.P1,
          mark,
          title: `${sourceChain.bridge_chain_name} -> ${targetChain.bridge_chain_name} mandatory header stopped`,
          body: `last relayed: ${bestFinalizedBlockNumber}, mandatory: ${nextMandatory.blockNumber}`,
        });
      } else {
        if (missing > this.maxAllowMissingBlock / 2) {
          alerts.push({
            level: Level.P2,
            mark,
            title: `${sourceChain.bridge_chain_name} -> ${targetChain.bridge_chain_name} mandatory header missing block > ${this.maxAllowMissingBlock / 2}`,
            body: `relayed: ${bestFinalizedBlockNumber}, mandatory: ${nextMandatory.blockNumber}`,
          });
        }
      }
    }

    if (this.parachainBridge) {
      return alerts;
    }

    const nextOnDemand: BridgeS2SNextRelayBlock = await this.sourceSubql.bridge_s2s()
      .nextOnDemandBlock(`bridge-${targetChain.bridge_chain_name}`);
    if (nextOnDemand) {
      const missing = nextOnDemand.blockNumber - nextOnDemand.blockNumber;
      if (missing > this.maxAllowMissingBlock) {
        alerts.push({
          level: Level.P1,
          mark,
          title: `${sourceChain.bridge_chain_name} -> ${targetChain.bridge_chain_name} on-demand header stopped`,
          body: `relayed: ${bestFinalizedBlockNumber}, on-demand: ${nextOnDemand.blockNumber}`,
        });
      } else {
        if (missing > this.maxAllowMissingBlock / 2) {
          alerts.push({
            level: Level.P2,
            mark,
            title: `${sourceChain.bridge_chain_name} -> ${targetChain.bridge_chain_name} on-demand header missing block > ${this.maxAllowMissingBlock / 2}`,
            body: `relayed: ${bestFinalizedBlockNumber}, on-demand: ${nextOnDemand.blockNumber}`,
          });
        }
      }
    }

    return alerts;
  }
}
