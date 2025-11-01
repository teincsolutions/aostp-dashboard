// src/components/PaymentReceiptModal.tsx

import React from "react";
import { Modal, Button, Spin } from "antd";
import { usePaymentReceipt } from "@/hooks/usePayments";
import { toast } from "sonner";

interface PaymentReceiptModalProps {
  visible: boolean;
  onClose: () => void;
  paymentId: string | null;
}

export const PaymentReceiptModal: React.FC<PaymentReceiptModalProps> = ({
  visible,
  onClose,
  paymentId,
}) => {
  const { data: receiptData, isLoading: receiptLoading } = usePaymentReceipt(
    paymentId ?? undefined
  );

  return (
    <Modal
      open={visible}
      title="Payment Receipt"
      onCancel={onClose}
      footer={[
        <Button key="cancel" onClick={onClose}>
          Cancel
        </Button>,
        <Button
          key="print"
          type="primary"
          onClick={() => {
            const w = window.open(receiptData?.url, "_blank");
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
      styles={{ body: { height: "70vh", padding: 0 } }}
      destroyOnHidden // Clean up when closed
    >
      {receiptLoading ? (
        <div className="flex items-center justify-center h-full">
          <Spin size="large" />
        </div>
      ) : receiptData ? (
        <iframe
          src={receiptData.url}
          style={{ width: "100%", height: "100%", border: "none" }}
          title="Payment Receipt"
        />
      ) : (
        <div className="flex items-center justify-center h-full text-gray-500">
          Receipt not available
        </div>
      )}
    </Modal>
  );
};
