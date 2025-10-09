// src/components/ReceiptModal.tsx

import React from "react";
import { Modal, Button, Spin } from "antd";
import { usePackageReceipt } from "@/hooks/usePackages";
import { toast } from "sonner";

interface ReceiptModalProps {
  visible: boolean;
  onClose: () => void;
  packageId: string | null;
}

export const ReceiptModal: React.FC<ReceiptModalProps> = ({
  visible,
  onClose,
  packageId,
}) => {
  const { data: receiptData, isLoading: receiptLoading } = usePackageReceipt(packageId ?? undefined);

  return (
    <Modal
      open={visible}
      title="Package Receipt"
      onCancel={onClose}
      footer={[
        <Button key="cancel" onClick={onClose}>
          Cancel
        </Button>,
        <Button
          key="print"
          type="primary"
          onClick={() => {
            const w = window.open(receiptData?.url, '_blank');
            if (w) {
              w.onload = () => {
                w.print();
                setTimeout(() => w.close(), 500); // Close after a delay
              };
            } else {
              toast.error("Failed to open receipt");
            }
            onClose();
          }}
          disabled={!receiptData || receiptLoading}
        >
          Print Receipt
        </Button>,
      ]}
      width="80vw"
      bodyStyle={{ height: '70vh', padding: 0 }}
      destroyOnClose // Clean up when closed
    >
      {receiptLoading ? (
        <div className="flex items-center justify-center h-full">
          <Spin size="large" />
        </div>
      ) : receiptData ? (
        <iframe
          src={receiptData.url}
          style={{ width: '100%', height: '100%', border: 'none' }}
          title="Package Receipt"
        />
      ) : (
        <div className="flex items-center justify-center h-full text-gray-500">
          Receipt not available
        </div>
      )}
    </Modal>
  );
};
