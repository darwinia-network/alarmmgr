import { ApiPromise, HttpProvider, WsProvider } from "@polkadot/api";
import { AlarmProbe } from "alarmmgr-probe-traits";
import { Lifecycle, Alert, Alerts, Priority, BRIDGE_CHAIN_INFO } from "alarmmgr-types";
import { BigNumber, ethers, providers } from "ethers";
import { BeaconLightClient, ExecutionLayer, Inbound, Outbound, POSALightClient } from "../types/ethers-contracts";
import { BeaconLightClient__factory, ExecutionLayer__factory, Inbound__factory, Outbound__factory, POSALightClient__factory } from "../types/ethers-contracts/factories";
import { Eth2Client } from "./eth2_client";
import { BasicEvent, SubstrateIndex } from "./substrate_index";
import { logger } from "alarmmgr-logger";


export class BridgeE2eProbe implements AlarmProbe {

  async probe(_lifecycle: Lifecycle): Promise<Alert[]> {
    const alerts = Alerts.create();
    const darwinia = BRIDGE_CHAIN_INFO['darwinia'];
    const eth = BRIDGE_CHAIN_INFO['ethereum'];
    const config: BridgeE2eConfig = {
      darwiniaSubstrateEndpoint: darwinia.endpoint.websocket,
      beaconEndpoint: eth.beacon,
      index: {
        substrateChainEndpoint: darwinia.subql,
        evmChainEndpoint: darwinia.thegraph,
      },
      darwiniaEvm: {
        endpoint: darwinia.endpoint.http,
        beaconLightClientAddress: darwinia.bridge_target.ethereum.contract.lc_consensus,
        executionLaterAddress: darwinia.bridge_target.ethereum.contract.lc_execution,
        inboundAddress: darwinia.bridge_target.ethereum.contract.inbound,
        outboundAddress: darwinia.bridge_target.ethereum.contract.outbound,
        feemarketAddress: darwinia.bridge_target.ethereum.contract.feemarket,
      },
      executionLayer: {
        endpoint: eth.endpoint.http,
        posaLightClientAddress: eth.bridge_target.darwinia.contract.posa,
        inboundAddress: eth.bridge_target.darwinia.contract.inbound,
        outboundAddress: eth.bridge_target.darwinia.contract.outbound,
        feemarketAddress: eth.bridge_target.darwinia.contract.feemarket,
      }
    }
    const service = new BridgeE2E(config);
    await service.setUp();
    const detects = [
      service.syncCommitteeRelayDetect,
      service.executionLayerRelayDetect,
      service.beaconHeaderRelayDetect,
      service.ecdsaMessagesSigningDetect,
      service.ecdsaAuthoritiesSigningDetect,
      service.ecdsaMessagesSigningRelayDetect,
      service.darwiniaMessagesDetect,
      service.ethMessagesDetect,
    ]
    await Promise.all(
      detects.map(
        async (f) => {
          const _alerts = await f();
          alerts.merge(_alerts);
        }
      )
    )
    return alerts.alerts();
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
    console.log(this.config);
    this.substrateIndex = new SubstrateIndex(this.config.index.substrateChainEndpoint, this.config.index.evmChainEndpoint);
    const provider = new WsProvider(this.config.darwiniaSubstrateEndpoint);
    this.substrateClient = await ApiPromise.create({ provider: provider });
  }

  beaconHeaderRelayDetect = async (): Promise<Alert[]> => {
    logger.trace("beaconHeaderRelayDetect");
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

  executionLayerRelayDetect = async (): Promise<Alert[]> => {
    logger.trace("executionLayerRelayDetect");
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

  syncCommitteeRelayDetect = async (): Promise<Alert[]> => {
    logger.trace("syncCommitteeRelayDetect");
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

  ecdsaMessagesSigningDetect = async (): Promise<Alert[]> => {
    logger.trace("ecdsaMessagesSigningDetect");
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

  ecdsaAuthoritiesSigningDetect = async (): Promise<Alert[]> => {
    logger.trace("ecdsaAuthoritiesSigningDetect");
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

  ecdsaMessagesSigningRelayDetect = async (): Promise<Alert[]> => {
    logger.trace("ecdsaMessagesSigningRelayDetect");
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

  ecdsaAuthoritiesSigningRelayDetect = async (): Promise<Alert[]> => {
    throw new Error("Function not implemented.");
  }

  darwiniaMessagesDetect = async (): Promise<Alert[]> => {
    logger.trace("darwiniaMessagesDetect");
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

  ethMessagesDetect = async (): Promise<Alert[]> => {
    logger.trace("ethMessagesDetect");
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
