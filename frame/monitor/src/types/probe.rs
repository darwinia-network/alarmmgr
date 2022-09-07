use serde::{Deserialize, Serialize};

#[derive(Clone, Debug, Deserialize, Serialize, strum::EnumString)]
#[strum(serialize_all = "kebab_case")]
#[serde(rename_all = "kebab-case")]
pub enum ProbeMark {
  Generic { mark: String },
  BridgeS2sGrandpa { chain: String },
  BridgeS2sOutboundLane { chain: String },
  FeemarketS2s { chain: String },
  Subql { origin: String },
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
      Self::BridgeS2sGrandpa { chain } => {
        format!("bridge-s2s-grandpa-{}", chain)
      }
      Self::BridgeS2sOutboundLane { chain } => format!("bridge-s2s-outbound-lane-{}", chain),
      Self::FeemarketS2s { chain } => {
        format!("feemarket-s2s-{}", chain)
      }
      Self::Subql { origin } => format!("subql-{}", origin),
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
}
