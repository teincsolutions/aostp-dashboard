"use client";

import React from "react";
import { Modal, Form, Input, Button, Space, Select } from "antd";
import { toast } from "sonner";
import { Container, ContainerStatus } from "@/types/container";

const { Option } = Select;

interface ContainerStatusUpdateModalProps {
  container: Container | null;
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (containerId: string, status: ContainerStatus) => Promise<void>;
  loading?: boolean;
}

const ContainerStatusUpdateModal: React.FC<ContainerStatusUpdateModalProps> = ({
  container,
  isOpen,
  onClose,
  onSubmit,
  loading = false,
}) => {
  const [form] = Form.useForm();
  const [newStatus, setNewStatus] = React.useState<ContainerStatus>(
    ContainerStatus.PLANNED
  );

  const handleSubmit = async () => {
    if (!container) return;

    try {
      await onSubmit(container.id, newStatus);
      onClose();
    } catch (error: any) {
      console.log(error.response.data);
      toast.error("Failed to update container status");
    }
  };

  const handleClose = () => {
    onClose();
    setNewStatus(ContainerStatus.PLANNED);
  };

  // Set form values when container changes
  React.useEffect(() => {
    if (container && isOpen) {
      form.setFieldsValue({
        status: container.status,
      });
      setNewStatus(container.status);
    }
  }, [container, isOpen, form]);

  return (
    <Modal
      title="Update Container Status"
      open={isOpen}
      onCancel={handleClose}
      footer={null}
      width={400}
    >
      <div className="mb-4">
        <p>
          Update status for container:{" "}
          <strong>{container?.containerNumber}</strong>
        </p>
      </div>
      <Form form={form} layout="vertical" onFinish={handleSubmit}>
        <Form.Item
          name="status"
          label="New Status"
          rules={[{ required: true, message: "Please select status" }]}
        >
          <Select
            placeholder="Select status"
            value={newStatus}
            onChange={setNewStatus}
          >
            <Option value={ContainerStatus.PLANNED}>Planned</Option>
            <Option value={ContainerStatus.LOADED}>Loaded</Option>
            <Option value={ContainerStatus.SHIPPED}>Shipped</Option>
            <Option value={ContainerStatus.ARRIVED}>Arrived</Option>
            <Option value={ContainerStatus.CLOSED}>Closed</Option>
          </Select>
        </Form.Item>

        <Form.Item>
          <Space>
            <Button type="primary" htmlType="submit" loading={loading}>
              Update Status
            </Button>
            <Button onClick={handleClose}>Cancel</Button>
          </Space>
        </Form.Item>
      </Form>
    </Modal>
  );
};

export default ContainerStatusUpdateModal;
