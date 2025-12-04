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
import { useCities } from "@/hooks/useCities";
import { City } from "@/types/exchangeRate";
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
  const { data: citiesData } = useCities({ limit: 100 });
  const cities = citiesData?.data || [];

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
        departureCityId: container.departureCityId,
        destinationCityId: container.destinationCityId,
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

          // Build payload with all fields
          const payload: ContainerUpdatePayload = {
            departureCityId: values.departureCityId,
            destinationCityId: values.destinationCityId,
            loadingDate: values.loadingDate
              ? (values.loadingDate as Dayjs).toISOString()
              : undefined,
            eta: values.eta ? (values.eta as Dayjs).toISOString() : undefined,
            notes: values.notes || "",
          };

          onSubmit(container.id, payload);
        }}
      >
        <Row gutter={16}>
          <Col xs={24} sm={12}>
            <Form.Item
              name="departureCityId"
              label="Departure City"
              rules={[
                {
                  required: true,
                  message: "Please select departure city",
                },
              ]}
            >
              <Select placeholder="Select departure city" showSearch>
                {cities.map((city: City) => (
                  <Option key={city.id} value={city.id}>
                    {city.name}, {city.country}
                  </Option>
                ))}
              </Select>
            </Form.Item>
          </Col>
          <Col xs={24} sm={12}>
            <Form.Item
              name="destinationCityId"
              label="Destination City"
              rules={[
                {
                  required: true,
                  message: "Please select destination city",
                },
              ]}
            >
              <Select placeholder="Select destination city" showSearch>
                {cities.map((city: City) => (
                  <Option key={city.id} value={city.id}>
                    {city.name}, {city.country}
                  </Option>
                ))}
              </Select>
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
              tooltip="Container type cannot be changed after creation"
            >
              <Select
                placeholder="Select container type"
                disabled
                value={form.getFieldValue("containerType")}
              >
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
