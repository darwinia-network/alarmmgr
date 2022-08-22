use thiserror::Error as ThisError;

pub type CliResult<T> = Result<T, CliError>;

/// Error enum.
#[derive(ThisError, Debug)]
pub enum CliError {}
