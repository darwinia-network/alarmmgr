import { AlarmProbe } from "alarmmgr-probe-traits"
import { Lifecycle, Alert, Priority } from "alarmmgr-types";
import fetch from 'node-fetch';
import { Response, RequestInit } from 'node-fetch';

// Validator is a callback to validate response from the http request.
// Returns whether ok or not, and a description string.
export type Validator = (resp: Response) => Promise<[boolean, string]>;

export class HttpProbe implements AlarmProbe {
  private readonly name: string;
  private readonly url: string;
  private readonly requestInit: RequestInit | undefined;
  private readonly validator: Validator | undefined;

  constructor(options: HttpProbeInfo) {
    this.name = options.name;
    this.url = options.url;
    this.requestInit = options.requestInit;
    this.validator = options.validator;
  }
  async probe(_lifecycle: Lifecycle): Promise<Alert[]> {
    const response = await fetch(this.url, this.requestInit);
    const mark = `${this.name}-${this.url}`;

    if (this.validator !== undefined) {
      console.log('validator!!!')
      const [ok, reason] = await this.validator(response);
      if (ok) {
        return []
      } else {
        return [{ priority: Priority.P1, mark, title: mark, body: reason }]
      }
    }

    if (response.ok) {
      return []
    } else {
      return [{ priority: Priority.P1, mark, title: mark, body: `status code: ${response.status}` }]
    }
  }
}


export interface HttpProbeInfo {
  name: string,
  url: string,
  requestInit?: RequestInit
  validator?: Validator
}

