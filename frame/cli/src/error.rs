use thiserror::Error as ThisError;

use alarmmgr_monitor::error::MonitorError;

pub type CliResult<T> = Result<T, CliError>;

/// Error enum.
#[derive(ThisError, Debug)]
pub enum CliError {
  #[error(transparent)]
  Monitor(#[from] MonitorError),
}
