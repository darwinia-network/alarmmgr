import {ProbeCenter} from "./plugins/probe_center";
import {Bridge, BridgeS2SProbe} from "alarmmgr-probe-s2s";
import {kvsEnvStorage} from "@kvs/env";
import {KvsLocalStorage} from "@kvs/node-localstorage";
import {KvStorageSchema} from "alarmmgr-types";
import {SubstrateChainLiveProbe} from "alarmmgr-probe-chain-substrate/src";


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
    ];
    for (const probe of bridgeS2SProbes) {
      ProbeCenter.register(probe.name, new BridgeS2SProbe({bridge: probe.bridge}));
    }

    // init substrate chain
    const substrateChainProbes = [
      {name: 'substrate-pangolin', endpoint: 'https://pangolin-rpc.darwinia.network'},
      {name: 'substrate-pangoro', endpoint: 'https://pangoro-rpc.darwinia.network'},
    ];
    for (const probe of substrateChainProbes) {
      ProbeCenter.register(probe.name, new SubstrateChainLiveProbe(probe))
    }

    // init substrate chain probes
  }

  public static async initKvdb(): Promise<KvsLocalStorage<KvStorageSchema>> {
    return await kvsEnvStorage<KvStorageSchema>({
      name: 'alarmmgr',
      version: 1
    });
  }
}
