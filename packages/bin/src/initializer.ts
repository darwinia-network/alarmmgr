import {InstanceCenter} from "./plugins/probe_center";
import {Bridge, BridgeS2SProbe} from "alarmmgr-probe-s2s";
import {kvsEnvStorage} from "@kvs/env";
import {KvsLocalStorage} from "@kvs/node-localstorage";
import {KvStorageSchema} from "alarmmgr-types";
import {SubstrateChainLiveProbe} from "alarmmgr-probe-chain-substrate/src";
import {SlackNotification} from "alarmmgr-notification-slack";


export class Initializer {
  constructor() {
  }

  public static init(): void {
    this.initProbeCenter();
  }

  private static initProbeCenter(): void {
    // init s2s bridge probes
    const bridgeS2SProbes = [
      {name: 'bridge-pangolin-pangoro', bridge: Bridge.PangolinPangoro},
      {name: 'bridge-darwinia-crab', bridge: Bridge.DarwiniaCrab},
      {name: 'bridge-pangolin-pangolinparachain', bridge: Bridge.PangolinPangolinParachain},
      {name: 'bridge-crab-crabparachain', bridge: Bridge.CrabCrabParachain},
    ];
    for (const probe of bridgeS2SProbes) {
      InstanceCenter.registerProbe(probe.name, new BridgeS2SProbe({bridge: probe.bridge}));
    }

    // init substrate chain
    const substrateChainProbes = [
      {name: 'substrate-pangolin', endpoint: 'https://pangolin-rpc.darwinia.network'},
      {name: 'substrate-pangoro', endpoint: 'https://pangoro-rpc.darwinia.network'},
      {name: 'substrate-darwinia', endpoint: 'https://rpc.darwinia.network'},
      {name: 'substrate-crab', endpoint: 'https://crab-rpc.darwinia.network'},
      {name: 'substrate-crab-parachain', endpoint: 'https://crab-parachain-rpc.darwinia.network'},
      {name: 'substrate-darwinia-parachain', endpoint: 'https://parachain-rpc.darwinia.network'},
    ];
    for (const probe of substrateChainProbes) {
      InstanceCenter.registerProbe(probe.name, new SubstrateChainLiveProbe(probe))
    }

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
