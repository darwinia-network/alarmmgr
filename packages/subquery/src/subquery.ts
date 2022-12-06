import axios from 'axios';
import {SubqueryBridgeS2S} from "./bridge_s2s";
import {SubqueryBridgeE2E} from "./bridge_e2e";

export class Subquery {
  constructor(
    private readonly endpoint: string,
  ) {
  }

  public async query(options: QueryOptions): Promise<any> {
    const body = {
      query: options.graphql,
      variables: options.variable,
    };
    // console.log(`[SUBQL] ${this.endpoint} -> `, JSON.stringify(body));
    const response = await axios.post(
      this.endpoint,
      body,
      {
        decompress: false,
        headers: {
          'content-type': 'application/json',
          'User-Agent': 'fakeagent/0.26.1',
          'Accept-Encoding': 'deflate',
        }
      }
    )
      .then(resp => {
        // console.log(resp)
        return resp.data;
      });
    return response.data;
  }

  public bridge_s2s(): SubqueryBridgeS2S {
    return new SubqueryBridgeS2S(this);
  }

  public bridge_e2e(): SubqueryBridgeE2E {
    return new SubqueryBridgeE2E(this);
  }

}

export interface QueryOptions {
  graphql: string;
  variable: object;
}
