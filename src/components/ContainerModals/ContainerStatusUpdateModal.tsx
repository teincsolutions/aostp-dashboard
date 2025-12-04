"use client";

import React from "react";
import { Modal, Form, Input, Button, Space, Select } from "antd";
import { toast } from "sonner";
import { Container, ContainerStatus } from "@/types/container";
import { handleError } from "@/utils/forms/errorUtils";

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

  const handleSubmit = async (values: { status: ContainerStatus }) => {
    if (!container) return;

    try {
      await onSubmit(container.id, values.status);
      onClose();
      form.resetFields();
    } catch (error: any) {
      handleError(error);
    }
  };

  const handleClose = () => {
    form.resetFields();
    onClose();
  };

  // Set form values when container changes
  React.useEffect(() => {
    if (container && isOpen) {
      form.setFieldsValue({
        status: container.status,
      });
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
          <Select placeholder="Select status">
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
