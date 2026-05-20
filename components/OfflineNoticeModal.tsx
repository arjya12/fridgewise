import { SimpleInfoModal } from "@/components/SimpleInfoModal";
import {
  OFFLINE_NOTICE_MESSAGE,
  OFFLINE_NOTICE_TITLE,
} from "@/utils/networkError";

type OfflineNoticeModalProps = {
  visible: boolean;
  onDismiss: () => void;
};

export function OfflineNoticeModal({
  visible,
  onDismiss,
}: OfflineNoticeModalProps) {
  return (
    <SimpleInfoModal
      visible={visible}
      title={OFFLINE_NOTICE_TITLE}
      message={OFFLINE_NOTICE_MESSAGE}
      okLabel="OK"
      onDismiss={onDismiss}
    />
  );
}
