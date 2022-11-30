import {ProbeCenter} from "./plugins/probe_center";
import {Bridge, BridgeS2SProbe} from "alarmmgr-probe-s2s";


export class Initializer {
  constructor() {
  }

  public static init(): void {
    this.initProbeCenter();
  }

  private static initProbeCenter(): void {
    const probes = [
      {name: 'bridge-pangolin-pangoro', probe: new BridgeS2SProbe({bridge: Bridge.PangolinPangoro})},
      {name: 'bridge-darwinia-crab', probe: new BridgeS2SProbe({bridge: Bridge.DarwiniaCrab})},
    ];
    for (const probe of probes) {
      ProbeCenter.register(probe.name, probe.probe);
    }
  }
}
