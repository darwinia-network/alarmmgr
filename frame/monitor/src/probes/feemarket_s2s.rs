use substorager::StorageKey;

use alarmmgr_notification::types::AlertLevel;
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
      "{} ==> check feemarket s2s",
      logk::prefix_multi("monitor", vec!["feemarket-s2s", &self.config.chain]),
    );

    let client = Subclient::new(&self.config.endpoint)?;
    let storage_name = "AssignedRelayers";
    let storage_key = StorageKey::builder(&self.config.pallet_name, storage_name).build();
    let relayers: Vec<FeeMarketRelayer> = client.storage(storage_key).await?.unwrap_or_default();

    let mark = ProbeMark::FeemarketS2s {
      chain: self.config.chain.clone(),
    };

    // check if relayers is empty
    if relayers.is_empty() {
      return Ok(
        AlertMessage::simple(
          AlertLevel::P1,
          format!(
            "[{}] [{}::{}] [{}] not have assigned relayers",
            self.config.chain, self.config.pallet_name, storage_name, self.config.endpoint
          ),
        )
        .to_alert_info(mark),
      );
    }
    Ok(AlertMessage::success().to_alert_info(mark))
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
