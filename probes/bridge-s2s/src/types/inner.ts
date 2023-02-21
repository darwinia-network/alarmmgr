
// export interface Chain {
//
// }

import {S2SBridgeChain} from "alarmmgr-types";
import {ApiPromise} from "@polkadot/api";

export interface SoloWithSoloArg {
  sourceChain: S2SBridgeChain;
  targetChain: S2SBridgeChain;
  sourceClient: ApiPromise;
  targetClient: ApiPromise;
}

export interface SoloWithParaArg {
  soloChain: S2SBridgeChain,
  paraChain: S2SBridgeChain,
  relayChain: S2SBridgeChain,
  soloClient: ApiPromise,
  paraClient: ApiPromise,
  relayClient: ApiPromise,
}

export interface ParaWithParaArg {
  sourceParaChain: S2SBridgeChain,
  sourceRelayChain: S2SBridgeChain,
  targetParaChain: S2SBridgeChain,
  targetRelayChain: S2SBridgeChain,
  sourceParaClient: ApiPromise,
  sourceRelayClient: ApiPromise,
  targetParaClient: ApiPromise,
  targetRelayClient: ApiPromise,
}

