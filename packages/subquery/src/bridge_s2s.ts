import {Subquery} from "./subquery";
import is from 'is_js';
import {
  BRIDGE_S2S_NEXT_CANDIDATE_INCLUDED_EVENT,
  BRIDGE_S2S_NEXT_MANDATORY_BLOCK,
  BRIDGE_S2S_NEXT_ON_DEMAND_BLOCK
} from "./graphql_query";

export class SubqueryBridgeS2S {
  constructor(
    private readonly subquery: Subquery,
  ) {
  }

  public async nextMandatoryBlock(block: number): Promise<any | undefined> {
    const ret = await this.subquery.query({
      graphql: BRIDGE_S2S_NEXT_MANDATORY_BLOCK,
      variable: {block},
    });
    const nodes = ret['needRelayBlocks']['nodes'];
    if (is.not.empty(nodes)) {
      return nodes[0];
    }
  }

  public async nextOnDemandBlock(origin: string): Promise<any | undefined> {
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
    // console.log(ret);
    const nodes = ret['needRelayBlocks']['nodes'];
    if (is.not.empty(nodes)) {
      return nodes[0];
    }
  }

  public async queryNextCandidateIncludedEvent(paraHead: string): Promise<any | undefined> {
    const ret = await this.subquery.query({
      graphql: BRIDGE_S2S_NEXT_CANDIDATE_INCLUDED_EVENT,
      variable: {para_head: paraHead}
    });
    const nodes = ret['candidateIncludedEvents']['nodes'];
    if (is.not.empty(nodes)) {
      return nodes[0];
    }
  }

}
