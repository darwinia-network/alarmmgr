use thiserror::Error as ThisError;

pub type MonitorResult<T> = Result<T, MonitorError>;

/// Error enum.
#[derive(ThisError, Debug)]
pub enum MonitorError {
  #[error(transparent)]
  Reqwest(#[from] reqwest::Error),
  #[error(transparent)]
  Codec(#[from] parity_scale_codec::Error),
  #[error(transparent)]
  SerdeJson(#[from] serde_json::Error),
  #[error("Bytes error: {0}")]
  Bytes(String),
}

impl From<array_bytes::Error> for MonitorError {
  fn from(error: array_bytes::Error) -> Self {
    Self::Bytes(format!("{:?}", error))
  }
}
