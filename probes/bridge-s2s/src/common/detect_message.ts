import {SoloWithSoloArg} from "../types/inner";
import {Alert, Alerts, Level, Lifecycle} from "alarmmgr-types";

export class S2SBridgeProbeDetectMessage {

  private readonly arg: SoloWithSoloArg;
  private readonly lifecycle: Lifecycle;
  private readonly maxAllowGapMinutes: number;

  constructor(options: {
    arg: SoloWithSoloArg,
    lifecycle: Lifecycle,
  }) {
    this.arg = options.arg;
    this.lifecycle = options.lifecycle;
    this.maxAllowGapMinutes = 1000 * 60 * 30;
  }

  public async detect(): Promise<Array<Alert>> {
    const {sourceChain, targetChain} = this.arg;
    const _alerts = [];
    // @ts-ignore
    const bridgeTarget = sourceChain.bridge_target[targetChain.bridge_chain_name];
    const lanes = bridgeTarget.lanes;
    for (const lane of lanes) {
      const alerts = await this.detectMessage(lane);
      _alerts.push(...alerts.alerts());
    }
    return _alerts;
  }

  private async detectMessage(lane: string): Promise<Alerts> {
    const {sourceChain, targetChain, sourceClient, targetClient} = this.arg;
    const alerts = Alerts.create();

    // @ts-ignore
    const sourceChainBridgeTarget = sourceChain.bridge_target[targetChain.bridge_chain_name];
    // @ts-ignore
    const targetChainBridgeTarget = targetChain.bridge_target[sourceChain.bridge_chain_name];

    // query outbound lane data from source chain
    const sourceChainMessagePalletName = sourceChainBridgeTarget.query_name.messages;
    const _sourceChainOutboundLaneData = await sourceClient.query[sourceChainMessagePalletName].outboundLanes(lane);
    // @ts-ignore
    const sourceChainOutboundLaneData: OutboundLaneData = _sourceChainOutboundLaneData.toJSON();


    // query inbound lane data from target chain
    const targetChainMessagePalletName = targetChainBridgeTarget.query_name.messages;
    const _targetChainInboundLaneData = await targetClient.query[targetChainMessagePalletName].inboundLanes(lane);
    // @ts-ignore
    const targetChainInboundLaneData: InboundLaneData = _targetChainInboundLaneData.toJSON();

    const kv = this.lifecycle.kv;
    const deliveryCacheKey = `bridge-s2s-message-delivery-${sourceChain.bridge_chain_name}-${targetChain.bridge_chain_name}`;
    const receivingCacheKey = `bridge-s2s-message-receiving-${sourceChain.bridge_chain_name}-${targetChain.bridge_chain_name}`;
    // await kv.set(cacheKey, +new Date(),);

    if (sourceChainOutboundLaneData.latestGeneratedNonce - targetChainInboundLaneData.lastConfirmedNonce != 1) {
      // P1 bridge message delivery stopped
      const mark = `bridge-s2s-message-delivery-${sourceChain.bridge_chain_name}-to-${targetChain.bridge_chain_name}`;
      let firstStoreTime = await kv.get(deliveryCacheKey);
      if (!firstStoreTime) {
        firstStoreTime = +new Date();
        await kv.set(deliveryCacheKey, firstStoreTime);
      }
      const now = +new Date();
      const gap = now - (+firstStoreTime);
      if (gap > this.maxAllowGapMinutes) {
        alerts.push({
          level: Level.P1,
          mark,
          title: `${sourceChain.bridge_chain_name} to ${targetChain.bridge_chain_name} message delivery stopped`,
          body: `progress: [${targetChainInboundLaneData.lastConfirmedNonce}/${sourceChainOutboundLaneData.latestGeneratedNonce}], stopped ${gap / 1000 / 60} minutes.`
        });
      } else {
        if (gap > this.maxAllowGapMinutes / 2) {
          alerts.push({
            level: Level.P2,
            mark,
            title: `${sourceChain.bridge_chain_name} to ${targetChain.bridge_chain_name} message delivery maybe stopped`,
            body: `progress: [${targetChainInboundLaneData.lastConfirmedNonce}/${sourceChainOutboundLaneData.latestGeneratedNonce}], stopped ${gap / 1000 / 60} minutes.`
          });
        }
      }
    } else {
      // clean cache
      await kv.delete(deliveryCacheKey);
    }

    if (
      sourceChainOutboundLaneData.latestGeneratedNonce != sourceChainOutboundLaneData.latestReceivedNonce &&
      sourceChainOutboundLaneData.latestGeneratedNonce - targetChainInboundLaneData.lastConfirmedNonce === 1
    ) {
      // P1 bridge message receiving stopped
      const mark = `bridge-s2s-message-receiving-${sourceChain.bridge_chain_name}-to-${targetChain.bridge_chain_name}`;
      let firstStoreTime = await kv.get(receivingCacheKey);
      if (!firstStoreTime) {
        firstStoreTime = +new Date();
        await kv.set(receivingCacheKey, firstStoreTime);
      }
      const now = +new Date();
      const gap = now - (+firstStoreTime);
      if (gap > this.maxAllowGapMinutes) {
        alerts.push({
          level: Level.P1,
          mark,
          title: `${sourceChain.bridge_chain_name} to ${targetChain.bridge_chain_name} message receiving stopped`,
          body: `progress: [${sourceChainOutboundLaneData.latestReceivedNonce}/${sourceChainOutboundLaneData.latestGeneratedNonce}], stopped ${gap / 1000 / 60} minutes.`
        });
      } else {
        if (gap > this.maxAllowGapMinutes / 2) {
          alerts.push({
            level: Level.P2,
            mark,
            title: `${sourceChain.bridge_chain_name} to ${targetChain.bridge_chain_name} message receiving maybe stopped`,
            body: `progress: [${sourceChainOutboundLaneData.latestReceivedNonce}/${sourceChainOutboundLaneData.latestGeneratedNonce}], stopped ${gap / 1000 / 60} minutes.`
          });
        }
      }
    } else {
      // clean cache
      await kv.delete(receivingCacheKey);
    }

    return alerts;
  }

}

interface OutboundLaneData {
  oldestUnprunedNonce: number,
  latestReceivedNonce: number,
  latestGeneratedNonce: number,
}

interface InboundLaneData {
  relayers: Array<InboundLaneDataRelayer>,
  lastConfirmedNonce: number,
}

interface InboundLaneDataRelayer {
  relayer: string,
  message: {
    begin: number,
    end: number,
    dispatchResults: string,
  }
}
