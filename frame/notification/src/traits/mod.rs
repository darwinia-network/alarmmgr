use crate::error::NotificationResult;
use crate::types::NotifyMessage;

/// alarmmgr notification
#[async_trait::async_trait]
pub trait AlarmmgrNotification {
  /// send notify message
  async fn notify(message: NotifyMessage) -> NotificationResult<()>;
}
