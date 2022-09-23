use thiserror::Error as ThisError;

use alarmmgr_monitor::error::MonitorError;

pub type CliResult<T> = Result<T, CliError>;

/// Error enum.
#[derive(ThisError, Debug)]
pub enum CliError {
  #[error(transparent)]
  Monitor(#[from] MonitorError),
  #[error("Bytes: {0}")]
  Bytes(String),
}

impl From<array_bytes::Error> for CliError {
  fn from(error: array_bytes::Error) -> Self {
    Self::Bytes(format!("{:?}", error))
  }
}
