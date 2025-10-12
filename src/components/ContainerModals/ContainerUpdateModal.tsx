"use client";

import React from "react";
import {
  Modal,
  Form,
  Input,
  Button,
  Space,
  Select,
  Row,
  Col,
  DatePicker,
} from "antd";
import { toast } from "sonner";
import {
  ContainerUpdatePayload,
  Container,
  ContainerStatus,
  ContainerType,
} from "@/types/container";
import type { Dayjs } from "dayjs";
import dayjs from "dayjs";

const { Option } = Select;

interface ContainerUpdateModalProps {
  container: Container | null;
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (
    containerId: string,
    payload: ContainerUpdatePayload
  ) => Promise<void>;
  loading?: boolean;
}

const ContainerUpdateModal: React.FC<ContainerUpdateModalProps> = ({
  container,
  isOpen,
  onClose,
  onSubmit,
  loading = false,
}) => {
  const [form] = Form.useForm();

  const handleClose = () => {
    form.resetFields();
    onClose();
  };

  // Set form values when container changes
  React.useEffect(() => {
    if (container && isOpen) {
      form.setFieldsValue({
        containerNumber: container.containerNumber,
        loadingDate: container.loadingDate
          ? dayjs(container.loadingDate)
          : null,
        departureCity: container.departureCity,
        destinationCity: container.destinationCity,
        eta: container.eta ? dayjs(container.eta) : null,
        containerType: container.containerType,
        notes: container.notes,
      });
    }
  }, [container, isOpen, form]);

  return (
    <Modal
      title="Edit Container"
      open={isOpen}
      onCancel={handleClose}
      footer={null}
      width={800}
    >
      <Form
        form={form}
        layout="vertical"
        onFinish={(values) => {
          if (!container) return;
          const payload: ContainerUpdatePayload = {
            ...values,
            loadingDate: values.loadingDate
              ? (values.loadingDate as Dayjs).toISOString()
              : null,
            eta: values.eta ? (values.eta as Dayjs).toISOString() : null,
          };
          onSubmit(container.id, payload);
        }}
      >
        <Row gutter={16}>
          <Col xs={24} sm={12}>
            <Form.Item
              name="departureCity"
              label="Departure City"
              rules={[
                {
                  required: true,
                  message: "Please enter departure city",
                },
              ]}
            >
              <Input />
            </Form.Item>
          </Col>
          <Col xs={24} sm={12}>
            <Form.Item
              name="destinationCity"
              label="Destination City"
              rules={[
                {
                  required: true,
                  message: "Please enter destination city",
                },
              ]}
            >
              <Input />
            </Form.Item>
          </Col>
        </Row>

        <Row gutter={16}>
          <Col span={12}>
            <Form.Item
              name="loadingDate"
              label="Loading Date"
              rules={[
                { required: true, message: "Please select loading date" },
              ]}
            >
              <DatePicker showTime className="w-full" />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item
              name="eta"
              label="ETA"
              rules={[{ required: true, message: "Please select ETA" }]}
            >
              <DatePicker showTime className="w-full" />
            </Form.Item>
          </Col>
        </Row>
        <Row gutter={16}>
          <Col xs={24} sm={12}>
            <Form.Item
              name="containerType"
              label="Container Type"
              rules={[
                {
                  required: true,
                  message: "Please select container type",
                },
              ]}
            >
              <Select placeholder="Select container type" value={form.getFieldValue("containerType")}>
                <Option value={ContainerType.CONTAINER}>
                  Container (Sea Freight)
                </Option>
                <Option value={ContainerType.BAG}>Bag (Air Freight)</Option>
              </Select>
            </Form.Item>
          </Col>
        </Row>
        <Form.Item name="notes" label="Notes">
          <Input.TextArea rows={3} />
        </Form.Item>

        <Form.Item>
          <Space>
            <Button type="primary" htmlType="submit" loading={loading}>
              Update Container
            </Button>
            <Button onClick={handleClose}>Cancel</Button>
          </Space>
        </Form.Item>
      </Form>
    </Modal>
  );
};

export default ContainerUpdateModal;
