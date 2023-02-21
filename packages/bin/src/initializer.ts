import { InstanceCenter } from "./plugins/probe_center";
import { Bridge, BridgeS2SProbe } from "alarmmgr-probe-s2s";
import { kvsEnvStorage } from "@kvs/env";
import { KvsLocalStorage } from "@kvs/node-localstorage";
import { KvStorageSchema } from "alarmmgr-types";
import { SubstrateChainLiveProbe } from "alarmmgr-probe-chain-substrate/src";
import { SlackNotification } from "alarmmgr-notification-slack";
import { HttpProbe } from "alarmmgr-probe-http";
import { BridgeE2eProbe } from "alarmmgr-probe-e2e";


export class Initializer {
  constructor() {
  }

  public static init(): void {
    this.initProbeCenter();
  }

  private static initProbeCenter(): void {
    // init s2s bridge probes
    const bridgeS2SProbes = [
      { name: 'bridge-pangolin-pangoro', bridge: Bridge.PangolinPangoro },
      { name: 'bridge-darwinia-crab', bridge: Bridge.DarwiniaCrab },
      { name: 'bridge-pangolin-pangolinparachain', bridge: Bridge.PangolinPangolinParachain },
      { name: 'bridge-crab-crabparachain', bridge: Bridge.CrabCrabParachain },
    ];
    for (const probe of bridgeS2SProbes) {
      InstanceCenter.registerProbe(probe.name, new BridgeS2SProbe({ bridge: probe.bridge }));
    }

    // init substrate chain
    const substrateChainProbes = [
      { name: 'substrate-pangolin', endpoint: 'https://pangolin-rpc.darwinia.network' },
      { name: 'substrate-pangoro', endpoint: 'https://pangoro-rpc.darwinia.network' },
      { name: 'substrate-darwinia', endpoint: 'https://rpc.darwinia.network' },
      { name: 'substrate-crab', endpoint: 'https://crab-rpc.darwinia.network' },
      { name: 'substrate-crab-parachain', endpoint: 'https://crab-parachain-rpc.darwinia.network' },
      { name: 'substrate-darwinia-parachain', endpoint: 'https://parachain-rpc.darwinia.network' },
    ];
    for (const probe of substrateChainProbes) {
      InstanceCenter.registerProbe(probe.name, new SubstrateChainLiveProbe(probe))
    }

    // init http probes
    const httpProbes = [
      { name: 'http-token-supply', url: 'https://api.darwinia.network/supply/ring', },
      { name: 'http-subql', url: 'https://subql.darwinia.network/subql-bridger-darwinia/', },
      { name: 'http-thegraph', url: 'https://thegraph.darwinia.network/ethv2/subgraphs/name/bridge-darwinia/graphql', },
      { name: 'http-apps', url: 'https://apps.darwinia.network', },
    ];
    for (const probe of httpProbes) {
      InstanceCenter.registerProbe(probe.name, new HttpProbe(probe))
    }

    const bridgeE2EProbes = new BridgeE2eProbe();
    InstanceCenter.registerProbe("bridge-darwinia-ethereum", bridgeE2EProbes);

    // init notifications
    InstanceCenter.addNotifications([
      new SlackNotification({
        endpoint: process.env.SLACK_WEBHOOK_URL,
        channel: '#darwinia-alert-notification',
      }),
    ]);
  }

  public static async initKvdb(): Promise<KvsLocalStorage<KvStorageSchema>> {
    return await kvsEnvStorage<KvStorageSchema>({
      name: 'alarmmgr',
      version: 1
    });
  }
}
