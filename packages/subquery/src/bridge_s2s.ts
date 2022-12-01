import {Subquery} from "./subquery";
import {BRIDGE_S2S_NEXT_MANDATORY_BLOCK, BRIDGE_S2S_NEXT_ON_DEMAND_BLOCK} from "./graphql_query";

export class SubqueryBridgeS2S {
  constructor(
    private readonly subquery: Subquery,
  ) {
  }

  public async nextMandatoryBlock(block: number) {
    const ret = await this.subquery.query({
      graphql: BRIDGE_S2S_NEXT_MANDATORY_BLOCK,
      variable: {block},
    });
    const nodes = ret['needRelayBlocks']['nodes'];
    if (nodes) {
      return nodes[0];
    }
  }

  public async nextOnDemandBlock(origin: string) {
    if (origin.indexOf('parachain') > -1) {
      // the subql stored bridge name such as bridge-pangolin-parachain
      // but the real/binary name is bridge-pangolinparachain.
      // so there need replace parachain to -parachain
      if (origin.indexOf('-parachain') === -1) {
        origin = origin.replace('parachain', '-parachain');
      }
    }
    const ret = await this.subquery.query({
      graphql: BRIDGE_S2S_NEXT_ON_DEMAND_BLOCK,
      variable: {origin},
    });
    const nodes = ret['needRelayBlocks']['nodes'];
    if (nodes) {
      return nodes[0];
    }
  }

}
