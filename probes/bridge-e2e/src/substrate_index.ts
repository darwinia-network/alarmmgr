import fetch from 'node-fetch';

export class SubstrateIndex {
  host: string;

  constructor(host: string) {
    this.host = host;
  }

  async latestCollectingMessagesSignatures(): Promise<BasicEvent | null> {
    const result: Response<CollectingNewMessagesSignatures> = await this.query(COLLECTING_NEW_MESSAGES_SIGNATURES, {});
    return result.data.collectingNewMessageRootSignaturesEvents.nodes.pop() || null;
  }

  async latestCollectedMessageSignatures(): Promise<EnoughMessageSignaturesEvent | null> {
    const result: Response<EnoughMessageSignatures> = await this.query(COLLECTED_ENOUGH_MESSAGES_SIGNATURES, {});
    return result.data.collectedEnoughNewMessageRootSignaturesEvents.nodes.pop() || null;
  }

  async latestCollectingAuthoritiesChange(): Promise<BasicEvent | null> {
    const result: Response<EnoughMessageSignatures> = await this.query(COLLECTING_NEW_AUTHORITIES_CHANGE, {});
    return result.data.collectedEnoughNewMessageRootSignaturesEvents.nodes.pop() || null;
  }

  async latestCollectedAuthoritiesChange(): Promise<BasicEvent | null> {
    const result: Response<EnoughMessageSignatures> = await this.query(COLLECTED_AUTHORITIES_CHANGE, {});
    return result.data.collectedEnoughNewMessageRootSignaturesEvents.nodes.pop() || null;
  }


  async query<R>(query: string, variables: any): Promise<R> {
    const body = {
      operationName: null,
      query,
      variables,
    };
    const response = await fetch(this.host, {
      method: "post",
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })
    if (!response.ok) {
      throw new Error(response.statusText);
    }
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
