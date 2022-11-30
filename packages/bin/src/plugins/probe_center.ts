import {AlarmProbe} from "alarmmgr-probe-traits";


export class ProbeCenter {
  private static probeMap: Map<string, AlarmProbe> = new Map<string, AlarmProbe>();

  public static register(name: string, probe: AlarmProbe): void {
    ProbeCenter.probeMap.set(name, probe);
  }

  public static probe(name: string): AlarmProbe | undefined {
    return ProbeCenter.probeMap.get(name);
  }
}
