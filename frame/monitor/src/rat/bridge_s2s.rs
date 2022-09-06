use alarmmgr_toolkit::logk;

use crate::error::MonitorResult;
use crate::traits::MonitorProbe;
use crate::types::{AlertInfo, AlertMessage, ProbeMark};

pub use self::types::*;

/// bridge S2S probe
pub struct BridgeS2SProbe {
  config: BridgeS2SProbeConfig,
}

impl BridgeS2SProbe {
  pub fn new(config: BridgeS2SProbeConfig) -> Self {
    Self { config }
  }
}

#[async_trait::async_trait]
impl MonitorProbe for BridgeS2SProbe {
  async fn probe(&self) -> MonitorResult<Vec<AlertInfo>> {
    Ok(vec![self.check_outbound_lane().await?])
  }
}

impl BridgeS2SProbe {
  async fn check_outbound_lane(&self) -> MonitorResult<AlertInfo> {
    tracing::trace!(
      target: "alarmmgr",
      "{} check outbound lane",
      logk::prefix_single("monitor"),
    );
    Ok(AlertMessage::success().normal(ProbeMark::generic_default()))
  }
}

mod types {
  use serde::{Deserialize, Serialize};

  /// s2s probe config
  #[derive(Clone, Debug, Deserialize, Serialize)]
  pub struct BridgeS2SProbeConfig {
    pub endpoint: String,
    pub chain: String,
    pub lane_id: [u8; 4],
  }
}
