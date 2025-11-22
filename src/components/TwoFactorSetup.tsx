"use client";

import React, { useState } from "react";
import {
  Card,
  Typography,
  Button,
  Space,
  Modal,
  Form,
  Input,
  QRCode,
  Alert,
  Descriptions,
} from "antd";
import { toast } from "sonner";
import {
  QrcodeOutlined,
  KeyOutlined,
  SafetyOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
} from "@ant-design/icons";
import { TwoFactorSetup as TwoFactorSetupType } from "@/types/common";
import { useAuth } from "@/hooks/useAuth";
import { handleError } from "@/utils/forms/errorUtils";

const { Title, Text, Paragraph } = Typography;

interface TwoFactorSetupProps {
  isEnabled: boolean;
  onStatusChange?: (enabled: boolean) => void;
}

export const TwoFactorSetup: React.FC<TwoFactorSetupProps> = ({
  isEnabled,
  onStatusChange,
}) => {
  const [loading, setLoading] = useState(false);
  const [setupData, setSetupData] = useState<TwoFactorSetupType | null>(null);
  const [showSetupModal, setShowSetupModal] = useState(false);
  const [showDisableModal, setShowDisableModal] = useState(false);
  const [verificationToken, setVerificationToken] = useState("");
  const [disableToken, setDisableToken] = useState("");

  const { enable2FA, verify2FA, disable2FA, get2FARecoveryCodes } = useAuth();

  // Handle enabling 2FA
  const handleEnable2FA = async () => {
    try {
      setLoading(true);
      const setupData = await enable2FA.mutateAsync();

      if (setupData) {
        setSetupData(setupData);
        setShowSetupModal(true);
      } else {
        toast.error("Failed to enable 2FA");
      }
    } catch (error) {
      handleError(error || "Failed to enable 2FA");
    } finally {
      setLoading(false);
    }
  };

  // Handle verifying 2FA setup
  const handleVerifySetup = async () => {
    if (!verificationToken.trim()) {
      toast.error("Please enter the verification token");
      return;
    }

    try {
      setLoading(true);
      await verify2FA.mutateAsync({ token: verificationToken });

      toast.success("Two-factor authentication enabled successfully");
      setShowSetupModal(false);
      setSetupData(null);
      setVerificationToken("");
      onStatusChange?.(true);
    } catch (error) {
      handleError(error || "Verification failed");
    } finally {
      setLoading(false);
    }
  };

  // Handle disabling 2FA
  const handleDisable2FA = async () => {
    if (!disableToken.trim()) {
      toast.error("Please enter the verification token");
      return;
    }

    try {
      setLoading(true);
      await disable2FA.mutateAsync({ token: disableToken });

      toast.success("Two-factor authentication disabled successfully");
      setShowDisableModal(false);
      setDisableToken("");
      onStatusChange?.(false);
    } catch (error) {
      handleError(error || "Failed to disable 2FA");
    } finally {
      setLoading(false);
    }
  };

  // Handle requesting backup code
  const handleRequestBackupCode = async () => {
    try {
      setLoading(true);
      const response = await get2FARecoveryCodes.mutateAsync();

      if (response?.recoveryCodes) {
        Modal.info({
          title: "Backup Codes",
          content: (
            <div>
              <Paragraph>
                Save these backup codes in a secure place. You can use them to
                access your account if you lose your authenticator device.
              </Paragraph>
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr",
                  gap: 8,
                }}
              >
                {response.recoveryCodes.map((code: string) => (
                  <Text
                    key={code}
                    strong
                    style={{ fontSize: 16, fontFamily: "monospace" }}
                  >
                    {code}
                  </Text>
                ))}
              </div>
            </div>
          ),
          width: 500,
        });
      } else {
        toast.error("Failed to retrieve backup codes");
      }
    } catch (error) {
      toast.error("Failed to request backup codes");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <Space direction="vertical" size="large" style={{ width: "100%" }}>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <div>
            <Title level={4} style={{ margin: 0 }}>
              <SafetyOutlined style={{ marginRight: 8 }} />
              Two-Factor Authentication
            </Title>
            <Text type="secondary">
              Add an extra layer of security to your account
            </Text>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            {isEnabled ? (
              <CheckCircleOutlined style={{ color: "#52c41a", fontSize: 20 }} />
            ) : (
              <CloseCircleOutlined style={{ color: "#ff4d4f", fontSize: 20 }} />
            )}
            <Text strong style={{ color: isEnabled ? "#52c41a" : "#ff4d4f" }}>
              {isEnabled ? "Enabled" : "Disabled"}
            </Text>
          </div>
        </div>

        <Alert
          message={isEnabled ? "2FA is active" : "2FA is not enabled"}
          description={
            isEnabled
              ? "Your account is protected with two-factor authentication. Use your authenticator app to generate codes."
              : "Enable 2FA to add an extra layer of security to your account."
          }
          type={isEnabled ? "success" : "warning"}
          showIcon
        />

        <Space>
          {!isEnabled ? (
            <Button
              type="primary"
              icon={<QrcodeOutlined />}
              onClick={handleEnable2FA}
              loading={loading}
            >
              Enable 2FA
            </Button>
          ) : (
            <>
              <Button
                danger
                icon={<CloseCircleOutlined />}
                onClick={() => setShowDisableModal(true)}
              >
                Disable 2FA
              </Button>
              <Button
                icon={<KeyOutlined />}
                onClick={handleRequestBackupCode}
                loading={loading}
              >
                Get Backup Code
              </Button>
            </>
          )}
        </Space>
      </Space>

      {/* Setup Modal */}
      <Modal
        title="Enable Two-Factor Authentication"
        open={showSetupModal}
        onCancel={() => {
          setShowSetupModal(false);
          setSetupData(null);
          setVerificationToken("");
        }}
        footer={null}
        width={600}
      >
        <Space direction="vertical" size="large" style={{ width: "100%" }}>
          <Alert
            message="Setup Instructions"
            description="1. Download an authenticator app (Google Authenticator, Authy, etc.)
2. Scan the QR code or enter the secret key manually
3. Enter the 6-digit code to verify setup"
            type="info"
            showIcon
          />

          {setupData && (
            <>
              <div style={{ textAlign: "center" }}>
                <QRCode value={setupData.qrCode} size={200} />
              </div>

              <Descriptions bordered column={1}>
                <Descriptions.Item label="Secret Key">
                  <Text code>{setupData.manualEntryKey}</Text>
                </Descriptions.Item>
                <Descriptions.Item label="Backup Codes">
                  <Space direction="vertical">
                    {setupData.recoveryCodes.map((code, index) => (
                      <Text key={index} code>
                        {code}
                      </Text>
                    ))}
                  </Space>
                </Descriptions.Item>
              </Descriptions>

              <Alert
                message="Important!"
                description="Save your backup codes in a secure place. You can use them to access your account if you lose your device."
                type="warning"
                showIcon
              />

              <Form layout="vertical">
                <Form.Item
                  label="Verification Code"
                  rules={[
                    {
                      required: true,
                      message: "Please enter verification code",
                    },
                    { len: 6, message: "Code must be 6 digits" },
                  ]}
                >
                  <Input
                    placeholder="Enter 6-digit code from your app"
                    value={verificationToken}
                    onChange={(e) => setVerificationToken(e.target.value)}
                    maxLength={6}
                    style={{
                      textAlign: "center",
                      fontSize: 18,
                      letterSpacing: 2,
                    }}
                  />
                </Form.Item>

                <Space style={{ width: "100%", justifyContent: "end" }}>
                  <Button onClick={() => setShowSetupModal(false)}>
                    Cancel
                  </Button>
                  <Button
                    type="primary"
                    onClick={handleVerifySetup}
                    loading={loading}
                  >
                    Verify & Enable
                  </Button>
                </Space>
              </Form>
            </>
          )}
        </Space>
      </Modal>

      {/* Disable Modal */}
      <Modal
        title="Disable Two-Factor Authentication"
        open={showDisableModal}
        onCancel={() => {
          setShowDisableModal(false);
          setDisableToken("");
        }}
        footer={null}
      >
        <Space direction="vertical" size="large" style={{ width: "100%" }}>
          <Alert
            message="Warning"
            description="Disabling 2FA will make your account less secure. Make sure you have your backup codes saved."
            type="warning"
            showIcon
          />

          <Form layout="vertical">
            <Form.Item
              label="Verification Code"
              rules={[
                { required: true, message: "Please enter verification code" },
                { len: 6, message: "Code must be 6 digits" },
              ]}
            >
              <Input
                placeholder="Enter 6-digit code from your app"
                value={disableToken}
                onChange={(e) => setDisableToken(e.target.value)}
                maxLength={6}
                style={{ textAlign: "center", fontSize: 18, letterSpacing: 2 }}
              />
            </Form.Item>

            <Space style={{ width: "100%", justifyContent: "end" }}>
              <Button onClick={() => setShowDisableModal(false)}>Cancel</Button>
              <Button danger onClick={handleDisable2FA} loading={loading}>
                Disable 2FA
              </Button>
            </Space>
          </Form>
        </Space>
      </Modal>
    </Card>
  );
};
