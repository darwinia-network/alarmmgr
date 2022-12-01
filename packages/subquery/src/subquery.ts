import axios from 'axios'
import {SubqueryBridgeS2S} from "./bridge_s2s";
import {SubqueryBridgeE2E} from "./bridge_e2e";

export class Subquery {
  constructor(
    private readonly endpoint: string,
  ) {
  }

  public async query(options: QueryOptions): Promise<any> {
    // console.log(`[SUBQL] ${this.endpoint} -> `, JSON.stringify(options));
    const response = await axios.post(
      this.endpoint, {
        query: options.graphql,
        variables: options.variable,
      })
      .then(resp => resp.data);
    return response.data;
  }

  public bridge_s2s(): SubqueryBridgeS2S {
    return new SubqueryBridgeS2S(this);
  }

  public bridge_e2d(): SubqueryBridgeE2E {
    return new SubqueryBridgeE2E(this);
  }

}

export interface QueryOptions {
  graphql: string;
  variable: object;
}
