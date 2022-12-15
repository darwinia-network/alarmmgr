import { AlarmProbe } from "alarmmgr-probe-traits";
import { Lifecycle, Alert, Alerts } from "alarmmgr-types";
import { ethers } from "ethers";
import { BeaconLightClient, ExecutionLayer, Inbound, Outbound, POSALightClient } from "../types/ethers-contracts";
import { BeaconLightClient__factory, ExecutionLayer__factory, Inbound__factory, Outbound__factory, POSALightClient__factory } from "../types/ethers-contracts/factories";


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

// console.log(`hello`)
// const RPC_HOST = 'https://rpc.darwinia.network'
// const DAI_ADDRESS = '0xD2A37C4523542F2dFD7Cb792D2aeAd5c61C1bAAE'

// async function main() {
//   console.log(`hello`)
//   const provider = new ethers.providers.JsonRpcProvider(RPC_HOST)
//   const beacon = BeaconLightClient__factory.connect(DAI_ADDRESS, provider)
//   const header = await beacon.finalized_header()
//   const data = await beacon.sync_committee_roots(header.slot.div(32).div(256))

//   console.log(`header : ${header}`)
//   console.log(`root : ${data}`)
// }

// main().catch((e) => {
//   console.error(e)
//   process.exit(1)
// })

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

  constructor(option: BridgeE2eConfig) {
    this.config = option
  }

  async beacon_header_relay_detect(): Promise<Alert[]> {
    throw new Error("Function not implemented.");
  }

  async execution_layer_relay_detect(): Promise<Alert[]> {
    throw new Error("Function not implemented.");
  }

  async sync_committee_relay_detect(): Promise<Alert[]> {
    throw new Error("Function not implemented.");
  }

  async ecdsa_messages_signing_detect(): Promise<Alert[]> {
    throw new Error("Function not implemented.");
  }

  async ecdsa_authorities_signing_detect(): Promise<Alert[]> {
    throw new Error("Function not implemented.");
  }

  async ecdsa_messages_signing_relay_detect(): Promise<Alert[]> {
    throw new Error("Function not implemented.");
  }

  async ecdsa_authorities_signing_relay_detect(): Promise<Alert[]> {
    throw new Error("Function not implemented.");
  }

  async darwinia_messages_detect(): Promise<Alert[]> {
    throw new Error("Function not implemented.");
  }

  async eth_messages_detect(): Promise<Alert[]> {
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
