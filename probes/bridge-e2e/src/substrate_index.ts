import fetch from 'node-fetch';
import { logger } from 'alarmmgr-logger'

export class SubstrateIndex {
  ecdsaIndexHost: string;
  evmHost: string;

  constructor(ecdsaIndexHost: string, evmHost: string) {
    this.ecdsaIndexHost = ecdsaIndexHost;
    this.evmHost = evmHost;
  }

  async latestCollectingMessagesSignatures(): Promise<BasicEvent | null> {
    const result: Response<CollectingNewMessagesSignatures> = await this.query(this.ecdsaIndexHost, COLLECTING_NEW_MESSAGES_SIGNATURES, {});
    return result.data.collectingNewMessageRootSignaturesEvents.nodes.pop() || null;
  }

  async latestCollectedMessageSignatures(): Promise<EnoughMessageSignaturesEvent | null> {
    const result: Response<EnoughMessageSignatures> = await this.query(this.ecdsaIndexHost, COLLECTED_ENOUGH_MESSAGES_SIGNATURES, {});
    return result.data.collectedEnoughNewMessageRootSignaturesEvents.nodes.pop() || null;
  }

  async latestCollectingAuthoritiesChange(): Promise<BasicEvent | null> {
    const result: Response<CollectingNewAuthoritiesChange> = await this.query(this.ecdsaIndexHost, COLLECTING_NEW_AUTHORITIES_CHANGE, {});
    return result.data.collectingAuthoritiesChangeSignaturesEvents.nodes.pop() || null;
  }

  async latestCollectedAuthoritiesChange(): Promise<BasicEvent | null> {
    const result: Response<CollectedNewAuthoritiesChange> = await this.query(this.ecdsaIndexHost, COLLECTED_AUTHORITIES_CHANGE, {});
    return result.data.collectedEnoughAuthoritiesChangeSignaturesEvents.nodes.pop() || null;
  }

  async message(nonce: number): Promise<MessageEvent | null> {
    const result: Response<Messages> = await this.query(this.evmHost, MESSAGE, { nonce: nonce });
    return result.data.messageAcceptedEntities.pop() || null;
  }


  async query<R>(host: string, query: string, variables: any): Promise<R> {
    const body = {
      operationName: null,
      query,
      variables,
    };
    logger.trace(`[IndexQuery] ${host} ${query} ${variables}`)
    const response = await fetch(host, {
      method: "post",
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })
    if (!response.ok) {
      throw new Error(response.statusText);
    }
    logger.trace(`[IndexResponse] ${await response.clone().text()}`)
    const data: R = await response.json();
    return data;
  }
}

export type Response<T> = { data: T };

export type CollectingNewMessagesSignatures = {
  collectingNewMessageRootSignaturesEvents: {
    nodes: Array<BasicEvent>
  }
}
export type BasicEvent = { id: string, blockHash: string, blockNumber: number, message: string };

export type EnoughMessageSignatures = {
  collectedEnoughNewMessageRootSignaturesEvents: {
    nodes: Array<EnoughMessageSignaturesEvent>
  }
}
export type EnoughMessageSignaturesEvent = { id: string, blockHash: string, blockNumber: number, message: string, commitmentBlockNumber: number };

export type CollectingNewAuthoritiesChange = {
  collectingAuthoritiesChangeSignaturesEvents: {
    nodes: Array<BasicEvent>
  }
}

export type CollectedNewAuthoritiesChange = {
  collectedEnoughAuthoritiesChangeSignaturesEvents: {
    nodes: Array<BasicEvent>
  }
}

export type Messages = {
  messageAcceptedEntities: Array<MessageEvent>
}
export type MessageEvent = {
  block_number: number, nonce: number, encoded: string, source: string, target: string, id: string
}

const COLLECTING_NEW_MESSAGES_SIGNATURES: string = `
query lastCollectingNewMessageRootSignaturesEvent {
  collectingNewMessageRootSignaturesEvents(
    orderBy: BLOCK_NUMBER_DESC
    first: 1
  ) {
    nodes {
      id
      blockNumber
      blockHash
      message
    }
  }
}
`;

const COLLECTED_ENOUGH_MESSAGES_SIGNATURES: string = `
query nextCollectedEnoughNewMessageRootSignaturesEvent {
  collectedEnoughNewMessageRootSignaturesEvents(
    orderBy: BLOCK_NUMBER_DESC
    first: 1
  ) {
    nodes {
      id
      blockNumber
      blockHash
      message
      commitmentBlockNumber
    }
  }
}
`;

const COLLECTING_NEW_AUTHORITIES_CHANGE: string = `
query nextCollectingAuthoritiesChangeSignaturesEvent {
  collectingAuthoritiesChangeSignaturesEvents(
    orderBy: BLOCK_NUMBER_DESC
    first: 1
  ) {
    nodes {
      id
      blockNumber
      blockHash
      message
    }
  }
}
`;

const COLLECTED_AUTHORITIES_CHANGE: string = `
query nextCollectedEnoughAuthoritiesChangeSignaturesEven {
  collectedEnoughAuthoritiesChangeSignaturesEvents(
    orderBy: BLOCK_NUMBER_DESC
    first: 1
  ) {
    nodes {
      id
      blockHash
      blockNumber
      message
    }
  }
}
`;

const MESSAGE: string = `
query LastTransaction($nonce: BigInt!) {
  messageAcceptedEntities(
    where: {
        nonce: $nonce
      }
  ) {
    block_number
    nonce
    encoded
    source
    target
    id
  }
}
`;
