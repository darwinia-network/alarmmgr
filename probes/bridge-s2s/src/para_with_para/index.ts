import {AlarmProbe} from "alarmmgr-probe-traits";
import {Alert, Lifecycle} from "alarmmgr-types";
import {ParaWithParaArg} from "../types/inner";
import {Subquery} from "alarmmgr-subquery";


export class ParaWithParaBridgeProbe implements AlarmProbe {


  private readonly arg: ParaWithParaArg;
  private readonly lifecycle: Lifecycle;
  private readonly sourceParaSubql: Subquery;
  private readonly sourceRelaySubql: Subquery;
  private readonly targetParaSubql: Subquery;
  private readonly targetRelaySubql: Subquery;

  constructor(options: {
    lifecycle: Lifecycle,
    arg: ParaWithParaArg,
  }) {
    this.arg = options.arg;
    this.lifecycle = options.lifecycle;
    this.sourceParaSubql = new Subquery(this.arg.sourceParaChain.subql);
    this.sourceRelaySubql = new Subquery(this.arg.sourceRelayChain.subql);
    this.targetParaSubql = new Subquery(this.arg.targetParaChain.subql);
    this.targetRelaySubql = new Subquery(this.arg.targetRelayChain.subql);
  }

  async probe(): Promise<Array<Alert>> {
    return [];
  }

}
