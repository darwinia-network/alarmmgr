import {AlarmProbe} from "alarmmgr-probe-traits";
import {Alert, Alerts, Level, Lifecycle} from "alarmmgr-types";
import {SubstrateClientInstance} from "alarmmgr-plugin-conn-substrate/src";

export class SubstrateChainLiveProbe implements AlarmProbe {

  private readonly maxAllowStoppedTimeOfSeconds: number;

  constructor(
    private readonly config: SubstrateChainConfig,
  ) {
    this.maxAllowStoppedTimeOfSeconds = config.maxAllowStoppedTimeOfSeconds ?? 60 * 3;
  }

  async probe(lifecycle: Lifecycle): Promise<Array<Alert>> {
    const client = await SubstrateClientInstance.instance(this.config.endpoint);
    const kv = lifecycle.kv;
    const cacheKeyLastBlock = `probe-last-block-${this.config.name}`;
    const cacheKeyFinalizeHead = `probe-finalize-head-${this.config.name}`;
    const markLastBlock = `${this.config.name}-last-block`;
    const markLastFinalizedHead = `${this.config.name}-last-finalized`;

    const _cachedLastBlock = await kv.get(cacheKeyLastBlock);
    const _cachedFinalizedHead = await kv.get(cacheKeyFinalizeHead);
    const cachedLastBlock: CachedLastBlock | undefined = _cachedLastBlock && JSON.parse(_cachedLastBlock.toString());
    const cachedFinalizedHead: CachedLastFinalizedHead | undefined = _cachedFinalizedHead && JSON.parse(_cachedFinalizedHead.toString());


    const _lastBlock = await client.rpc.chain.getBlock();
    const lastBlock = _lastBlock.toJSON();
    const _finalizedHead = await client.rpc.chain.getFinalizedHead();
    const finalizedHead = _finalizedHead.toJSON().toString();
    // @ts-ignore
    const lastBlockNumber = lastBlock.block.header.number;

    const alerts = Alerts.create();
    const now = +new Date();

    if (cachedLastBlock) {
      if (cachedLastBlock.blockNumber == lastBlockNumber &&
        now - cachedLastBlock.time > this.maxAllowStoppedTimeOfSeconds * 1000) {
        alerts.push({
          level: Level.P1,
          mark: markLastBlock,
          title: `the chain stopped: ${this.config.endpoint}`,
          body: `last block is ${lastBlockNumber}`,
        });
      }
    }
    if (cachedFinalizedHead) {
      if (cachedFinalizedHead.blockHash == finalizedHead &&
        now - cachedFinalizedHead.time > this.maxAllowStoppedTimeOfSeconds * 1000) {
        alerts.push({
          level: Level.P1,
          mark: markLastFinalizedHead,
          title: `the chain finalized stopped: ${this.config.endpoint}`,
          body: `last finalized block hash is ${finalizedHead}`,
        });
      }
    }

    const _newCachedLastBlock: CachedLastBlock = {
      blockNumber: lastBlockNumber,
      time: cachedLastBlock?.blockNumber == lastBlockNumber ? cachedLastBlock.time : now,
    };
    await kv.set(cacheKeyLastBlock, JSON.stringify(_newCachedLastBlock));


    const _cachedLastFinalizedHead: CachedLastFinalizedHead = {
      blockHash: finalizedHead,
      time: cachedFinalizedHead?.blockHash == finalizedHead ? cachedFinalizedHead.time : now,
    };
    await kv.set(cacheKeyFinalizeHead, JSON.stringify(_cachedLastFinalizedHead));

    return alerts.alerts();
  }
}

export interface SubstrateChainConfig {
  name: string,
  endpoint: string,
  maxAllowStoppedTimeOfSeconds?: number,
}

interface CachedLastBlock {
  blockNumber: number,
  time: number,
}

interface CachedLastFinalizedHead {
  blockHash: string,
  time: number,
}
