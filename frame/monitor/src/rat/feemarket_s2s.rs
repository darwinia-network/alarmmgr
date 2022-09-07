use substorager::StorageKey;

use alarmmgr_toolkit::logk;

use crate::client::Subclient;
use crate::error::MonitorResult;
use crate::traits::MonitorProbe;
use crate::types::{AlertInfo, AlertMessage, ProbeMark};

pub use self::types::*;

pub struct FeemarketS2SProbe {
  config: FeemarketS2SProbeConfig,
}

impl FeemarketS2SProbe {
  pub fn new(config: FeemarketS2SProbeConfig) -> Self {
    Self { config }
  }
}

#[async_trait::async_trait]
impl MonitorProbe for FeemarketS2SProbe {
  async fn probe(&self) -> MonitorResult<Vec<AlertInfo>> {
    Ok(vec![self.check_feemarket_assigned_relays().await?])
  }
}

impl FeemarketS2SProbe {
  async fn check_feemarket_assigned_relays(&self) -> MonitorResult<AlertInfo> {
    tracing::trace!(
      target: "alarmmgr",
      "{} ==> check feemarket",
      logk::prefix_multi("monitor", vec!["feemarket-s2s", &self.config.chain]),
    );

    let client = Subclient::new(&self.config.endpoint)?;
    let storage_key = StorageKey::builder(&self.config.pallet_name, "AssignedRelayers").build();
    let relayers: Vec<FeeMarketRelayer> = client.storage(storage_key).await?.unwrap_or_default();

    // check if relayers is empty
    if relayers.is_empty() {
      return Ok(
        AlertMessage::simple(format!(
          "Not have assigned relayers for {} [{}]",
          self.config.chain, self.config.endpoint
        ))
        .p1(ProbeMark::feemarket_s2s_assigned_relayers(
          &self.config.chain,
        )),
      );
    }
    Ok(
      AlertMessage::success().normal(ProbeMark::feemarket_s2s_assigned_relayers(
        &self.config.chain,
      )),
    )
  }
}

mod types {
  use parity_scale_codec::{Decode, Encode};
  use serde::{Deserialize, Serialize};

  /// s2s probe config
  #[derive(Clone, Debug, Deserialize, Serialize)]
  pub struct FeemarketS2SProbeConfig {
    pub endpoint: String,
    pub chain: String,
    pub pallet_name: String,
  }

  #[derive(Clone, Debug, Deserialize, Serialize, Decode, Encode)]
  pub struct FeeMarketRelayer {
    pub id: subtypes::AccountId,
    pub collateral: subtypes::Balance,
    pub fee: subtypes::Balance,
  }
}
