import { DarwiniaEvmClient, DarwiniaEvmConfig } from "../src";
import { Eth2Client } from "../src/eth2_client";

describe('testing DarwiniaEvmClient', () => {
  const config: DarwiniaEvmConfig = {
    endpoint: "https://rpc.darwinia.network",
    inboundAddress: "0xf1B8a9F8436800499DB8186f2da2fb3e78Ff7c2B",
    outboundAddress: "0xcA3749C8C3aF04278D596a3fBe461481B6aa1b01",
    feemarketAddress: "0xcA927Df15afb7629b79dA4713a871190315c7409",
    beaconLightClientAddress: "0xD2A37C4523542F2dFD7Cb792D2aeAd5c61C1bAAE",
    executionLaterAddress: "0xeC3c9B4d3674B3D03fdf20b082A3C2c669075990",
  }
  const client = new DarwiniaEvmClient(config);

  xtest('test inbound', async () => {
    const nonce = await client.inbound.inboundLaneNonce();
    console.log(nonce);
    const laneInfo = await client.inbound.getLaneInfo();
    console.log(laneInfo);
  }, 60000);
});

describe('testing eth2 client', () => {
  const client = new Eth2Client("http://unstable.mainnet.beacon-api.nimbus.team");
  xtest('test api', async () => {
    const header = await client.getHeader("head");
    console.log(header);
  }, 60000)
})
