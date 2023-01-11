import { ApiPromise, HttpProvider, WsProvider } from "@polkadot/api";
import { AlarmProbe } from "alarmmgr-probe-traits";
import { Lifecycle, Alert, Alerts, Priority } from "alarmmgr-types";
import { BigNumber, ethers, providers } from "ethers";
import { BeaconLightClient, ExecutionLayer, Inbound, Outbound, POSALightClient } from "../types/ethers-contracts";
import { BeaconLightClient__factory, ExecutionLayer__factory, Inbound__factory, Outbound__factory, POSALightClient__factory } from "../types/ethers-contracts/factories";
import { Eth2Client } from "./eth2_client";
import { BasicEvent, SubstrateIndex } from "./substrate_index";


export class BridgeE2eProbe implements AlarmProbe {

  async probe(_lifecycle: Lifecycle): Promise<Alert[]> {
    return []
    //   const alerts = Alerts.create();
    //   const detects = [
    //     beacon_header_relay_detect,             // eth -> darwinia beacon header relay
    //     execution_layer_relay_detect,           // eth -> darwinia execution layer state root relay
    //     sync_committee_relay_detect,            // eth -> darwinia sync committee root relay
    //     ecdsa_messages_signing_detect,          // darwinia ecdsa messages signing
    //     ecdsa_authorities_signing_detect,       // darwinia ecdsa authorities signing
    //     ecdsa_messages_signing_relay_detect,    // darwinia ecdsa messages signing relay
    //     ecdsa_authorities_signing_relay_detect, // darwinia ecdsa authorities signing relay
    //     darwinia_messages_detect,               // darwinia -> eth messages delivery and messages confirmation
    //     eth_messages_detect,                    // eth -> darwinia messages delivery and messages confirmation
    //   ];

    //   await Promise.all(
    //     detects.map(
    //       async (f) => {
    //         const _alerts = await f();
    //         alerts.merge(_alerts);
    //       }
    //     )
    //   )
    //   return alerts.alerts();
  }
}

export interface BridgeE2eConfig {
  // Darwinia substrate websocket endpoint
  darwiniaSubstrateEndpoint: string,
  // Beacon node API endpoint
  beaconEndpoint: string,
  index: {
    // Endpoint of subql index for ecdsa events on Darwinia
    substrateChainEndpoint: string,
    // Endpoint of thegraph index for message events on Darwinia EVM
    evmChainEndpoint: string
  }
  // Config for Darwinia EVM
  darwiniaEvm: DarwiniaEvmConfig,
  // Config for Ethereum execution layer
  executionLayer: ExecutionLayerConfig,
}

export class BridgeE2E {
  private readonly config: BridgeE2eConfig;
  private darwiniaEvmClient: DarwiniaEvmClient;
  private executionLayerClient: ExecutionLayerClient;
  private ethApiClient: Eth2Client;
  private substrateIndex: SubstrateIndex;
  private substrateClient: ApiPromise;

  constructor(option: BridgeE2eConfig) {
    this.config = option;
  }

  async setUp() {
    this.darwiniaEvmClient = new DarwiniaEvmClient(this.config.darwiniaEvm);
    this.executionLayerClient = new ExecutionLayerClient(this.config.executionLayer);
    this.ethApiClient = new Eth2Client(this.config.beaconEndpoint);
    this.substrateIndex = new SubstrateIndex(this.config.index.substrateChainEndpoint, this.config.index.evmChainEndpoint);
    const provider = new WsProvider(this.config.darwiniaSubstrateEndpoint);
    this.substrateClient = await ApiPromise.create({ provider: provider });
  }

  async beaconHeaderRelayDetect(): Promise<Alert[]> {
    // 600 slot is about 2 hour.
    const MAX_ALLOWED_DELAY = BigNumber.from(600);

    const alerts = Alerts.create();
    const latest = await this.ethApiClient.getHeader('head');
    const latestSlot = BigNumber.from(latest.header.message.slot);
    const relayed = await this.darwiniaEvmClient.beaconLightClient.finalized_header();
    const delay = latestSlot.sub(relayed.slot);
    if (delay > MAX_ALLOWED_DELAY) {
      alerts.push({
        priority: Priority.P1,
        mark: `bridge-darwinia-ethereum-beacon-header-relay`,
        body: `Bridge Eth<>Darwinia beacon header relay has stopped since ${relayed.slot} `,
        title: "Eth->Darwinia beacon header relay stopped",
      })
    }
    return alerts.alerts();
  }

  async executionLayerRelayDetect(): Promise<Alert[]> {
    // 600 blocks is about 2 hour.
    const MAX_ALLOWED_DELAY = BigNumber.from(600);

    const alerts = Alerts.create();
    const relayed = await this.darwiniaEvmClient.executionLayer.block_number();
    const current = await this.executionLayerClient.provider.getBlockNumber();
    const delay = BigNumber.from(current).sub(relayed);
    if (delay > MAX_ALLOWED_DELAY) {
      alerts.push({
        priority: Priority.P1,
        mark: `bridge-darwinia-ethereum-execution-layer-relay`,
        body: `Bridge Eth<>Darwinia execution layer relay has stopped since ${relayed}`,
        title: "Eth->Darwinia execution layer relay stopped",
      })
    }
    return alerts.alerts();
  }

  async syncCommitteeRelayDetect(): Promise<Alert[]> {
    const alerts = Alerts.create();
    const currentSlot = BigNumber.from((await this.ethApiClient.getHeader('head')).header.message.slot);
    const currentPeriod = currentSlot.div(32).div(256);
    const syncCommitteeRoot = await this.darwiniaEvmClient.beaconLightClient.sync_committee_roots(currentPeriod);
    if (syncCommitteeRoot === '0x0000000000000000000000000000000000000000000000000000000000000000') {
      alerts.push({
        priority: Priority.P1,
        mark: `bridge-darwinia-ethereum-sync-committee-relay`,
        body: `Bridge Eth<>Darwinia sync committee at period ${currentPeriod} hasn't been relayed`,
        title: "Eth->Darwinia sync committee relay stopped",
      })
    }

    return alerts.alerts();
  }

  async ecdsaMessagesSigningDetect(): Promise<Alert[]> {
    const MAX_ALLOWED_DELAY = 600;
    const isTooMuchDelay = (_collecting: BasicEvent, _currentBlockNumber: number) => {
      if (_currentBlockNumber - _collecting.blockNumber > MAX_ALLOWED_DELAY) {
        return true;
      } else {
        return false;
      }
    };

    const alerts = Alerts.create();
    const collecting = await this.substrateIndex.latestCollectingMessagesSignatures();
    const collected = await this.substrateIndex.latestCollectedMessageSignatures();
    const currentHeader = await this.substrateClient.rpc.chain.getHeader();
    const currentBlockNumber = currentHeader.number.toNumber();

    if (collecting === null) {
      return [];
    }

    if (collected.commitmentBlockNumber == collecting.blockNumber) {
      return [];
    }

    if (collected === null || collected.commitmentBlockNumber != collecting.blockNumber) {
      if (isTooMuchDelay(collecting, currentBlockNumber)) {
        alerts.push({
          priority: Priority.P1,
          mark: `bridge-darwinia-ethereum-ecdsa-message`,
          body: `Bridge Eth<>Darwinia ECDSA signatures for new message root(${collecting.blockNumber}) hasn't been collected}`,
          title: `ECDSA signatures for new message root not collected`,
        })
        return alerts.alerts();
      }
    }

    return []
  }

  async ecdsaAuthoritiesSigningDetect(): Promise<Alert[]> {
    const MAX_ALLOWED_DELAY = 600;
    const alerts = Alerts.create();
    const collecting = await this.substrateIndex.latestCollectingAuthoritiesChange();
    const collected = await this.substrateIndex.latestCollectedAuthoritiesChange();

    if (collecting === null) {
      return [];
    }

    if (collected !== null && collected.message === collecting.message) {
      return [];
    } else {
      const currentHeader = await this.substrateClient.rpc.chain.getHeader();
      const currentBlockNumber = currentHeader.number.toNumber();
      if (currentBlockNumber - collecting.blockNumber > MAX_ALLOWED_DELAY) {
        alerts.push({
          priority: Priority.P1,
          mark: `bridge-darwinia-ethereum-ecdsa-authorities`,
          body: `Authorities change event hasn't collected enough signatures since ${collecting.blockNumber}`,
          title: `ECDSA signatures for authorities change not collected`
        });
        return alerts.alerts();
      }
    }
    return [];
  }

  async ecdsaMessagesSigningRelayDetect(): Promise<Alert[]> {
    const MAX_ALLOWED_DELAY = 600;
    const alerts = Alerts.create();
    const relayed = (await this.executionLayerClient.posaLightClient.block_number()).toNumber();
    const latest = await this.substrateIndex.latestCollectedMessageSignatures();

    if (latest.commitmentBlockNumber > relayed) {
      const currentHeader = await this.substrateClient.rpc.chain.getHeader();
      const currentBlockNumber = currentHeader.number.toNumber();
      if (currentBlockNumber - latest.blockNumber > MAX_ALLOWED_DELAY) {
        alerts.push({
          priority: Priority.P1,
          title: `ECDSA messages root relay time out`,
          body: `ECDSA messages root not relayed since ${latest.blockNumber}`,
          mark: `bridge-darwinia-ethereum-ecdsa-message-relay`
        })

      }
    }
    return alerts.alerts();
  }

  async ecdsaAuthoritiesSigningRelayDetect(): Promise<Alert[]> {
    throw new Error("Function not implemented.");
  }

  async darwiniaMessagesDetect(): Promise<Alert[]> {
    const MAX_ALLOWED_DELAY = 600;
    const alerts = Alerts.create();
    const outboundData = await this.darwiniaEvmClient.outbound.outboundLaneNonce();
    if (!outboundData.latest_generated_nonce.eq(outboundData.latest_received_nonce)) {
      const latestMessageEvent = await this.substrateIndex.message(outboundData.latest_generated_nonce.toNumber());
      if (latestMessageEvent !== null) {
        const currentHeader = await this.substrateClient.rpc.chain.getHeader();
        const currentBlockNumber = currentHeader.number.toNumber();
        if (currentBlockNumber - latestMessageEvent.block_number > MAX_ALLOWED_DELAY) {
          alerts.push({
            title: `Message from Darwinia to Ethereum timeout`,
            priority: Priority.P1,
            body: `Message(nonce: ${latestMessageEvent.nonce}) timeout`,
            mark: `bridge-darwinia-ethereum-darwinia-message-timeout`,
          })
        }
      }
    }
    return alerts.alerts();
  }

  async ethMessagesDetect(): Promise<Alert[]> {
    const MAX_ALLOWED_DELAY = 600;
    const alerts = Alerts.create();
    const outboundData = await this.executionLayerClient.outbound.outboundLaneNonce();
    const filter = {
      fromBlock: "earliest",
      toBlock: "latest",
      address: undefined,
      topics: [],
    }
    if (!outboundData.latest_generated_nonce.eq(outboundData.latest_received_nonce)) {
      const eventFilter = this.executionLayerClient.outbound.filters.MessageAccepted(outboundData.latest_generated_nonce);
      filter.address = eventFilter.address;
      filter.topics = eventFilter.topics;

      const events = await this.executionLayerClient.provider.getLogs(filter);
      const latestMessageEvent = events.pop();
      if (latestMessageEvent !== null) {
        const currentBlockNumber = await this.executionLayerClient.provider.getBlockNumber();
        if (currentBlockNumber - latestMessageEvent.blockNumber > MAX_ALLOWED_DELAY) {
          alerts.push({
            title: "Message from Ethereum to Darwinia timeout",
            priority: Priority.P1,
            body: `Message(nonce: ${outboundData.latest_generated_nonce}) timeout`,
            mark: `bridge-darwinia-ethereum-eth-message-timeout`
          })
        }
      }
    }
    return alerts.alerts();
  }
}

export interface DarwiniaEvmConfig {
  // API endpoint
  endpoint: string,
  // Beacon lightclient contract address
  beaconLightClientAddress: string,
  // Execution layer contract address
  executionLaterAddress: string,

  inboundAddress: string,
  outboundAddress: string,
  feemarketAddress: string,
}

export interface ExecutionLayerConfig {
  // API endpoint
  endpoint: string,
  // Darwinia light client contract address
  posaLightClientAddress: string,

  inboundAddress: string,
  outboundAddress: string,
  feemarketAddress: string,
}

export class DarwiniaEvmClient {
  provider: providers.JsonRpcProvider;
  inbound: Inbound;
  outbound: Outbound;
  beaconLightClient: BeaconLightClient;
  executionLayer: ExecutionLayer;

  constructor(config: DarwiniaEvmConfig) {
    this.provider = new ethers.providers.JsonRpcProvider(config.endpoint);
    this.inbound = Inbound__factory.connect(config.inboundAddress, this.provider);
    this.outbound = Outbound__factory.connect(config.outboundAddress, this.provider);
    this.beaconLightClient = BeaconLightClient__factory.connect(config.beaconLightClientAddress, this.provider);
    this.executionLayer = ExecutionLayer__factory.connect(config.executionLaterAddress, this.provider);
  };
}

export class ExecutionLayerClient {
  provider: providers.JsonRpcProvider;
  inbound: Inbound;
  outbound: Outbound;
  posaLightClient: POSALightClient;

  constructor(config: ExecutionLayerConfig) {
    this.provider = new ethers.providers.JsonRpcProvider(config.endpoint);
    this.inbound = Inbound__factory.connect(config.inboundAddress, this.provider);
    this.outbound = Outbound__factory.connect(config.outboundAddress, this.provider);
    this.posaLightClient = POSALightClient__factory.connect(config.posaLightClientAddress, this.provider);
  };
}
