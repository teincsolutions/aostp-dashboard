// src/components/InvoiceModal.tsx

import React from "react";
import { Modal, Button, Spin } from "antd";
import { useInvoicePdf } from "@/hooks/useInvoices";
import { toast } from "sonner";

interface InvoiceModalProps {
  visible: boolean;
  onClose: () => void;
  invoiceId: string | null;
}

export const InvoiceModal: React.FC<InvoiceModalProps> = ({
  visible,
  onClose,
  invoiceId,
}) => {
  const { data: pdfData, isLoading: pdfLoading } = useInvoicePdf(invoiceId ?? undefined);

  const handleDownload = () => {
    if (pdfData?.url) {
      // For viewing inline (optional)
      window.open(pdfData.url, '_blank');

      // For downloading
      const link = document.createElement('a');
      link.href = pdfData.url;
      link.download = `invoice-${invoiceId}.pdf`;
      link.click();

      toast.success("Invoice downloaded successfully");
    } else {
      toast.error("Failed to load invoice");
    }
  };

  return (
    <Modal
      open={visible}
      title="Invoice PDF"
      onCancel={onClose}
      footer={[
        <Button key="cancel" onClick={onClose}>
          Cancel
        </Button>,
        <Button
          key="download"
          type="primary"
          onClick={handleDownload}
          disabled={!pdfData || pdfLoading}
        >
          Download Invoice
        </Button>,
      ]}
      width="80vw"
      styles={{ body: { height: '70vh', padding: 0 } }}
      destroyOnHidden // Clean up when closed
    >
      {pdfLoading ? (
        <div className="flex items-center justify-center h-full">
          <Spin size="large" />
        </div>
      ) : pdfData ? (
        <iframe
          src={pdfData.url}
          style={{ width: '100%', height: '100%', border: 'none' }}
          title="Invoice PDF"
        />
      ) : (
        <div className="flex items-center justify-center h-full text-gray-500">
          Invoice not available
        </div>
      )}
    </Modal>
  );
};
