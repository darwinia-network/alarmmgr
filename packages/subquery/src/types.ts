
export interface BridgeS2SNextRelayBlock {
  id: string;
  blockNumber: number;
  blockHash: string;
  type: BridgeS2SOrigin;
  laneId: string;
  messageNonce: number;
  parentHash: string;
  extrinsicsRoot: string;
  disgest: string;
  onDemandType: BridgeS2SOnDemandType
  additional: string;
  timestamp: string;
}

export enum BridgeS2SOrigin {
  OnDemand = 'on-demand',
  Mandatory = 'mandatory',
}

export enum BridgeS2SOnDemandType {
  SendMessage = 'send-message',
  Dispatch = 'dispatch',
}
