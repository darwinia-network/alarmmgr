use thiserror::Error as ThisError;

pub type MonitorResult<T> = Result<T, MonitorError>;

/// Error enum.
#[derive(ThisError, Debug)]
pub enum MonitorError {}
