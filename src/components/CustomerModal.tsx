// src/components/CustomerModal.tsx

"use client";

import React from "react";
import { Modal, Form, Row, Col, Input, Select, Space, Button } from "antd";
import { IdType, PreferredChannel, CustomerCreatePayload, CustomerUpdatePayload, Customer } from "@/types/customer";

const { Option } = Select;

interface CustomerModalProps {
  visible: boolean;
  onCancel: () => void;
  onSubmit: (values: CustomerCreatePayload | CustomerUpdatePayload) => void;
  form: any;
  loading?: boolean;
  mode: "create" | "edit";
  initialValues?: Partial<Customer>;
}

const idTypeOptions = [
  { label: "National ID", value: IdType.NATIONAL_ID },
  { label: "Passport", value: IdType.PASSPORT },
  { label: "Driver License", value: IdType.DRIVERS_LICENSE },
  { label: "Voter ID", value: IdType.VOTER_ID },
];

const preferredChannelOptions = [
  { label: "SMS", value: PreferredChannel.SMS },
  { label: "Email", value: PreferredChannel.EMAIL },
  { label: "WhatsApp", value: PreferredChannel.WHATSAPP },
];

export const CustomerModal: React.FC<CustomerModalProps> = ({
  visible,
  onCancel,
  onSubmit,
  form,
  loading,
  mode,
  initialValues = {},
}) => (
  <Modal
    title={mode === "create" ? "Create New Customer" : "Edit Customer"}
    open={visible}
    onCancel={onCancel}
    footer={null}
    width={700}
  >
    <Form
      form={form}
      layout="vertical"
      onFinish={onSubmit}
      initialValues={initialValues}
    >
      <Row gutter={16}>
        <Col span={12}>
          <Form.Item
            name="firstName"
            label="First Name"
            rules={[{ required: true, message: "Please enter first name" }]}
          >
            <Input />
          </Form.Item>
        </Col>
        <Col span={12}>
          <Form.Item
            name="lastName"
            label="Last Name"
            rules={[{ required: true, message: "Please enter last name" }]}
          >
            <Input />
          </Form.Item>
        </Col>
      </Row>

      <Row gutter={16}>
        <Col span={12}>
          <Form.Item
            name="email"
            label="Email"
            rules={[
              { required: true, message: "Please enter email" },
              { type: "email", message: "Please enter a valid email" },
            ]}
          >
            <Input />
          </Form.Item>
        </Col>
        <Col span={12}>
          <Form.Item
            name="phoneNumber"
            label="Phone Number"
            rules={[{ required: true, message: "Please enter phone number" }]}
          >
            <Input />
          </Form.Item>
        </Col>
      </Row>

      <Form.Item name="alternatePhone" label="Alternate Phone">
        <Input />
      </Form.Item>

      <Form.Item name="address" label="Address">
        <Input />
      </Form.Item>

      <Row gutter={16}>
        <Col span={12}>
          <Form.Item name="city" label="City">
            <Input />
          </Form.Item>
        </Col>
        <Col span={12}>
          <Form.Item name="country" label="Country">
            <Input />
          </Form.Item>
        </Col>
      </Row>

      <Row gutter={16}>
        <Col span={12}>
          <Form.Item name="idType" label="ID Type">
            <Select allowClear>
              {idTypeOptions.map((option) => (
                <Option key={option.value} value={option.value}>
                  {option.label}
                </Option>
              ))}
            </Select>
          </Form.Item>
        </Col>
        <Col span={12}>
          <Form.Item name="idNumber" label="ID Number">
            <Input />
          </Form.Item>
        </Col>
      </Row>

      <Form.Item name="preferredChannel" label="Preferred Channel">
        <Select allowClear>
          {preferredChannelOptions.map((option) => (
            <Option key={option.value} value={option.value}>
              {option.label}
            </Option>
          ))}
        </Select>
      </Form.Item>

      <Form.Item>
        <Space>
          <Button type="primary" htmlType="submit" loading={loading}>
            {mode === "create" ? "Create Customer" : "Update Customer"}
          </Button>
          <Button onClick={onCancel}>Cancel</Button>
        </Space>
      </Form.Item>
    </Form>
  </Modal>
);
