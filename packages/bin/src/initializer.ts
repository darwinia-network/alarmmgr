import {ProbeCenter} from "./plugins/probe_center";
import {Bridge, BridgeS2SProbe} from "alarmmgr-probe-s2s";


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

    // init substrate chain probes
  }
}
