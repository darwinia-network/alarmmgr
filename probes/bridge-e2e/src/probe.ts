import { AlarmProbe } from "alarmmgr-probe-traits";
import { Lifecycle, Alert, Alerts } from "alarmmgr-types";
import { ethers } from "ethers";
import { BeaconLightClient__factory, Inbound__factory } from "../types/ethers-contracts/factories";


export class BridgeE2eProbe implements AlarmProbe {

  async probe(_lifecycle: Lifecycle): Promise<Alert[]> {
    const alerts = Alerts.create();
    const detects = [
      beacon_header_relay_detect,             // eth -> darwinia beacon header relay
      execution_layer_relay_detect,           // eth -> darwinia execution layer state root relay
      sync_committee_relay_detect,            // eth -> darwinia sync committee root relay
      ecdsa_messages_signing_detect,          // darwinia ecdsa messages signing
      ecdsa_authorities_signing_detect,       // darwinia ecdsa authorities signing
      ecdsa_messages_signing_relay_detect,    // darwinia ecdsa messages signing relay
      ecdsa_authorities_signing_relay_detect, // darwinia ecdsa authorities signing relay
      darwinia_messages_detect,               // darwinia -> eth messages delivery and messages confirmation
      eth_messages_detect,                    // eth -> darwinia messages delivery and messages confirmation
    ];

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

console.log(`hello`)
const RPC_HOST = 'https://rpc.darwinia.network'
const DAI_ADDRESS = '0xD2A37C4523542F2dFD7Cb792D2aeAd5c61C1bAAE'

async function main() {
  console.log(`hello`)
  const provider = new ethers.providers.JsonRpcProvider(RPC_HOST)
  const beacon = BeaconLightClient__factory.connect(DAI_ADDRESS, provider)
  const header = await beacon.finalized_header()
  const data = await beacon.sync_committee_roots(header.slot.div(32).div(256))

  console.log(`header : ${header}`)
  console.log(`root : ${data}`)
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})

async function beacon_header_relay_detect(): Promise<Alert[]> {
  throw new Error("Function not implemented.");
}

async function execution_layer_relay_detect(): Promise<Alert[]> {
  throw new Error("Function not implemented.");
}

async function sync_committee_relay_detect(): Promise<Alert[]> {
  throw new Error("Function not implemented.");
}

async function ecdsa_messages_signing_detect(): Promise<Alert[]> {
  throw new Error("Function not implemented.");
}

async function ecdsa_authorities_signing_detect(): Promise<Alert[]> {
  throw new Error("Function not implemented.");
}

async function ecdsa_messages_signing_relay_detect(): Promise<Alert[]> {
  throw new Error("Function not implemented.");
}

async function ecdsa_authorities_signing_relay_detect(): Promise<Alert[]> {
  throw new Error("Function not implemented.");
}

async function darwinia_messages_detect(): Promise<Alert[]> {
  throw new Error("Function not implemented.");
}

async function eth_messages_detect(): Promise<Alert[]> {
  throw new Error("Function not implemented.");
}

