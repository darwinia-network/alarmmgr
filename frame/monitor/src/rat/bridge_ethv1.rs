use crate::error::MonitorResult;
use crate::traits::MonitorProbe;
use crate::types::AlertInfo;

pub use self::types::*;

/// bridge ethv1 probe
pub struct BridgeEthv1Probe {
  config: Ethv1ProbConfig,
}

impl BridgeEthv1Probe {
  pub fn new(config: Ethv1ProbConfig) -> Self {
    Self { config }
  }
}

#[async_trait::async_trait]
impl MonitorProbe for BridgeEthv1Probe {
  async fn probe(&self) -> MonitorResult<Vec<AlertInfo>> {
    todo!()
  }
}

impl BridgeEthv1Probe {
  // async fn check
}

mod types {
  use serde::{Deserialize, Serialize};

  #[derive(Clone, Debug, Deserialize, Serialize)]
  pub struct Ethv1ProbConfig {
    pub endpoint: String,
  }
}
