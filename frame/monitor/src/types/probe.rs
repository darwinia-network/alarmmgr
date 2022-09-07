use serde::{Deserialize, Serialize};

#[derive(Clone, Debug, Deserialize, Serialize, strum::EnumString)]
#[strum(serialize_all = "kebab_case")]
#[serde(rename_all = "kebab-case")]
pub enum ProbeMark {
  Generic { mark: String },
  BridgeS2sGrandpaEmptyBestTargetHead { chain: String },
  BridgeS2sGrandpaStopped { chain: String },
  FeemarketS2sAssignedRelayers { chain: String },
}

impl Default for ProbeMark {
  fn default() -> Self {
    Self::generic_default()
  }
}

impl ProbeMark {
  pub fn raw(&self) -> String {
    match self {
      Self::Generic { mark } => format!("generic-{}", mark),
      Self::BridgeS2sGrandpaEmptyBestTargetHead { chain } => {
        format!("bridge-s2s-grandpa-empty-best-target-head-{}", chain)
      }
      Self::BridgeS2sGrandpaStopped { chain } => {
        format!("bridge-s2s-grandpa-stopped-{}", chain)
      }
      Self::FeemarketS2sAssignedRelayers { chain } => {
        format!("feemarket-s2s-assigned-relayers-{}", chain)
      }
    }
  }
}

impl ProbeMark {
  pub fn generic_default() -> Self {
    Self::generic("default")
  }

  pub fn generic(mark: impl AsRef<str>) -> Self {
    Self::Generic {
      mark: mark.as_ref().to_string(),
    }
  }

  pub fn feemarket_s2s_assigned_relayers(chain: impl AsRef<str>) -> Self {
    Self::FeemarketS2sAssignedRelayers {
      chain: chain.as_ref().to_string(),
    }
  }
}
