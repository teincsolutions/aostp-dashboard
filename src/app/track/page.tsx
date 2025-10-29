"use client";

import { useState } from "react";
import { Button, Form, Input, Card, Typography, message } from "antd";
import { useRouter } from "next/navigation";
import { TruckOutlined } from "@ant-design/icons";

const { Title, Text } = Typography;

export default function TrackPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (values: { trackingCode: string }) => {
    setLoading(true);
    try {
      const trackingCode = values.trackingCode.trim();
      if (!trackingCode) {
        message.error("Please enter a tracking code");
        return;
      }
      router.push(`/track/${trackingCode}`);
    } catch (error) {
      message.error("Invalid tracking code format");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-md shadow-lg">
        <div className="text-center mb-6">
          <TruckOutlined className="text-4xl text-blue-600 mb-4" />
          <Title level={2} className="!mb-2">
            Track Your Package
          </Title>
          <Text type="secondary">
            Enter your tracking code to view your package status and details
          </Text>
        </div>

        <Form onFinish={handleSubmit} layout="vertical" size="large">
          <Form.Item
            name="trackingCode"
            label="Tracking Code"
            rules={[
              { required: true, message: "Please enter your tracking code" },
              {
                min: 3,
                max: 50,
                message: "Tracking code must be between 3-50 characters",
              },
            ]}
          >
            <Input
              placeholder="Enter your tracking code"
              allowClear
              autoFocus
            />
          </Form.Item>

          <Form.Item>
            <Button
              type="primary"
              htmlType="submit"
              loading={loading}
              className="w-full"
              size="large"
            >
              Track Package
            </Button>
          </Form.Item>
        </Form>

        <div className="text-center mt-6">
          <Text type="secondary" className="text-sm">
            For support, please contact our customer service
          </Text>
        </div>
      </Card>
    </div>
  );
}
