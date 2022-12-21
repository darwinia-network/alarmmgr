import { AlarmProbe } from "alarmmgr-probe-traits";
import { Lifecycle, Alert, Alerts, Priority } from "alarmmgr-types";
import { BigNumber, ethers } from "ethers";
import { BeaconLightClient, ExecutionLayer, Inbound, Outbound, POSALightClient } from "../types/ethers-contracts";
import { BeaconLightClient__factory, ExecutionLayer__factory, Inbound__factory, Outbound__factory, POSALightClient__factory } from "../types/ethers-contracts/factories";
import { Eth2Client } from "./eth2_client";


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
  darwiniaSubstrateEndpoint: string,
  beaconEndpoint: string,
  index: {
    substrateChainEndpoint: string,
    executionLayerEndpoint: string
  }
  darwiniaEvm: DarwiniaEvmConfig,
  executionLayer: ExecutionLayerConfig,
}

export class BridgeE2E {
  private readonly config: BridgeE2eConfig;
  private readonly darwiniaEvmClient: DarwiniaEvmClient;
  private readonly executionLayerClient: ExecutionLayerClient;
  private readonly ethApiClient: Eth2Client;

  constructor(option: BridgeE2eConfig) {
    this.config = option;
    this.darwiniaEvmClient = new DarwiniaEvmClient(option.darwiniaEvm);
    this.executionLayerClient = new ExecutionLayerClient(option.executionLayer);
    this.ethApiClient = new Eth2Client(option.beaconEndpoint);
  }

  async beaconHeaderRelayDetect(): Promise<Alert[]> {
    const alerts = Alerts.create();
    // 600 slot is about 2 hour.
    const MAX_ALLOWED_DELAY = BigNumber.from(600);
    const latest = await this.ethApiClient.getHeader('head');
    const latestSlot = BigNumber.from(latest.header.message.slot);
    const relayed = await this.darwiniaEvmClient.beaconLightClient.finalized_header();
    const delay = latestSlot.sub(relayed.slot);
    console.log(`Current: ${latestSlot}, Relayed: ${relayed.slot}, Delay: ${delay}`);
    if (delay > MAX_ALLOWED_DELAY) {
      console.log("Delay too much");
      alerts.push({
        priority: Priority.P1,
        mark: `Bridge Eth<>Darwinia beacon header relay has stopped since ${relayed.slot} `,
        title: "Eth->Darwinia beacon header relay stopped",
      })
    }
    return alerts.alerts();
  }

  async executionLayerRelayDetect(): Promise<Alert[]> {
    throw new Error("Function not implemented.");
  }

  async syncCommitteeRelayDetect(): Promise<Alert[]> {
    throw new Error("Function not implemented.");
  }

  async ecdsaMessagesSigningDetect(): Promise<Alert[]> {
    throw new Error("Function not implemented.");
  }

  async ecdsaAuthoritiesSigningDetect(): Promise<Alert[]> {
    throw new Error("Function not implemented.");
  }

  async ecdsaMessagesSigningRelayDetect(): Promise<Alert[]> {
    throw new Error("Function not implemented.");
  }

  async ecdsaAuthoritiesSigningRelayDetect(): Promise<Alert[]> {
    throw new Error("Function not implemented.");
  }

  async darwiniaMessagesDetect(): Promise<Alert[]> {
    throw new Error("Function not implemented.");
  }

  async ethMessagesDetect(): Promise<Alert[]> {
    throw new Error("Function not implemented.");
  }
}

export interface DarwiniaEvmConfig {
  endpoint: string,
  beaconLightClientAddress: string,
  executionLaterAddress: string,
  inboundAddress: string,
  outboundAddress: string,
  feemarketAddress: string,
}

export interface ExecutionLayerConfig {
  endpoint: string,
  posaLightClientAddress: string,
  inboundAddress: string,
  outboundAddress: string,
  feemarketAddress: string,
}

export class DarwiniaEvmClient {
  inbound: Inbound;
  outbound: Outbound;
  beaconLightClient: BeaconLightClient;
  executionLayer: ExecutionLayer;

  constructor(config: DarwiniaEvmConfig) {
    const provider = new ethers.providers.JsonRpcProvider(config.endpoint);
    this.inbound = Inbound__factory.connect(config.inboundAddress, provider);
    this.outbound = Outbound__factory.connect(config.outboundAddress, provider);
    this.beaconLightClient = BeaconLightClient__factory.connect(config.beaconLightClientAddress, provider);
    this.executionLayer = ExecutionLayer__factory.connect(config.executionLaterAddress, provider);
  };
}

export class ExecutionLayerClient {
  inbound: Inbound;
  outbound: Outbound;
  posaLightClient: POSALightClient;

  constructor(config: ExecutionLayerConfig) {
    const provider = new ethers.providers.JsonRpcProvider(config.endpoint);
    this.inbound = Inbound__factory.connect(config.inboundAddress, provider);
    this.outbound = Outbound__factory.connect(config.outboundAddress, provider);
    this.posaLightClient = POSALightClient__factory.connect(config.posaLightClientAddress, provider);
  };
}
