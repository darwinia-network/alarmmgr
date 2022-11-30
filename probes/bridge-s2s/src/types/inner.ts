
// export interface Chain {
//
// }

import {S2SBridgeChain} from "alarmmgr-types";
import {ApiPromise} from "@polkadot/api";

export interface SoloWithSoloPara {
  sourceChain: S2SBridgeChain;
  targetChain: S2SBridgeChain;
  sourceClient: ApiPromise;
  targetClient: ApiPromise;
}
