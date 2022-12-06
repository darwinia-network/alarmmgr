import {ApiPromise, HttpProvider, WsProvider} from "@polkadot/api";
import {logger} from "alarmmgr-logger";


export class SubstrateClientInstance {

  private static connectionMap: Map<string, ApiPromise> = new Map<string, ApiPromise>();


  public static async instance(endpoint): Promise<ApiPromise> {
    const instance = await this._instance(endpoint);
    if (!instance.isConnected) {
      await instance.connect();
      this.connectionMap.set(endpoint, instance);
    }
    return instance;
  }

  private static async _instance(endpoint): Promise<ApiPromise> {
    const conn = this.connectionMap.get(endpoint);
    if (conn) {
      return conn;
    }
    if (endpoint.indexOf('http://') === 0 || endpoint.indexOf('https://') === 0) {
      logger.info(`connect to ${endpoint}`);
      const provider = new HttpProvider(endpoint);
      const client = await ApiPromise.create({provider: provider});
      this.connectionMap.set(endpoint, client);
      logger.debug('connected');
      return client;
    }
    if (endpoint.indexOf('ws://') === 0 || endpoint.indexOf('ess://') === 0) {
      logger.info(`connect to ${endpoint}`);
      const provider = new WsProvider(endpoint);
      const client = await ApiPromise.create({provider: provider});
      this.connectionMap.set(endpoint, client);
      logger.debug('connected');
      return client;
    }
    throw new Error(`Wrong endpoint: [${endpoint}]`);
  }

}
