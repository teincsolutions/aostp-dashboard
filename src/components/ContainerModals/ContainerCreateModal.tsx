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
import {
  ContainerCreatePayload,
  ContainerStatus,
  ContainerType,
} from "@/types/container";

const { Option } = Select;

interface ContainerCreateModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (payload: ContainerCreatePayload) => Promise<void>;
  loading?: boolean;
}

const ContainerCreateModal: React.FC<ContainerCreateModalProps> = ({
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

  return (
    <Modal
      title="Create New Container"
      open={isOpen}
      onCancel={handleClose}
      footer={null}
      width={800}
    >
      <Form
        form={form}
        layout="vertical"
        onFinish={onSubmit}
        initialValues={{
          status: ContainerStatus.PLANNED,
          containerType: ContainerType.CONTAINER,
        }}
      >
        <Row gutter={16}>
          <Col xs={24} sm={12}>
            <Form.Item
              name="containerNumber"
              label="Container Number"
              rules={[
                {
                  required: true,
                  message: "Please enter container number",
                },
              ]}
            >
              <Input placeholder="Enter container number" />
            </Form.Item>
          </Col>
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
              <Select>
                <Option value={ContainerType.CONTAINER}>
                  Container (Sea Freight)
                </Option>
                <Option value={ContainerType.BAG}>Bag (Air Freight)</Option>
              </Select>
            </Form.Item>
          </Col>
        </Row>

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
              name="status"
              label="Status"
              rules={[{ required: true, message: "Please select status" }]}
            >
              <Select>
                <Option value={ContainerStatus.PLANNED}>Planned</Option>
                <Option value={ContainerStatus.LOADED}>Loaded</Option>
                <Option value={ContainerStatus.SHIPPED}>Shipped</Option>
                <Option value={ContainerStatus.ARRIVED}>Arrived</Option>
                <Option value={ContainerStatus.CLOSED}>Closed</Option>
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
              Create Container
            </Button>
            <Button onClick={handleClose}>Cancel</Button>
          </Space>
        </Form.Item>
      </Form>
    </Modal>
  );
};

export default ContainerCreateModal;
