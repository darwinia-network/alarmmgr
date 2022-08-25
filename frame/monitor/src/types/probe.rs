use serde::{Deserialize, Serialize};

#[derive(Clone, Debug, Deserialize, Serialize, strum::EnumString)]
#[strum(serialize_all = "kebab_case")]
#[serde(rename_all = "kebab-case")]
pub enum ProbeMark {
  Generic,
  FeemarketS2sAssignedRelayers,
}

impl Default for ProbeMark {
  fn default() -> Self {
    Self::Generic
  }
}
