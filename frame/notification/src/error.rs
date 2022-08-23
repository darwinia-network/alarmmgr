use thiserror::Error as ThisError;

pub type NotificationResult<T> = Result<T, NotificationError>;

/// Error enum.
#[derive(ThisError, Debug)]
pub enum NotificationError {}
