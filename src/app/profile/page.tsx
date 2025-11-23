"use client";

import { AppLayout } from "@/components/AppLayout";
import { AuthGuard } from "@/components/AuthGuard";
import {
  Card,
  Tabs,
  Form,
  Input,
  Button,
  Tag,
  Divider,
  notification,
  Modal,
  Spin,
  Image,
  Descriptions,
  Avatar,
  Typography,
  Alert,
} from "antd";
import { Formik, Form as FormikForm, Field } from "formik";
import * as Yup from "yup";
import { useState, useEffect } from "react";
import { ChangePasswordPayload, TwoFAVerifyPayload } from "@/types/auth";
import { toast } from "sonner";
import { handleError } from "@/utils/forms/errorUtils";
import { useAuth } from "@/hooks/useAuth";
import { useSearchParams } from "next/navigation";
import {
  UserOutlined,
  MailOutlined,
  HomeOutlined,
  SafetyCertificateOutlined,
  IdcardOutlined,
  LockOutlined,
  KeyOutlined,
} from "@ant-design/icons";

const PasswordSchema = Yup.object().shape({
  currentPassword: Yup.string().required("Current password required"),
  newPassword: Yup.string()
    .min(8, "Min 8 characters")
    .matches(/[A-Za-z]/, "Must contain a letter")
    .matches(/\d/, "Must contain a number")
    .required("New password required"),
  confirmNewPassword: Yup.string()
    .oneOf([Yup.ref("newPassword")], "Passwords must match")
    .required("Confirm your new password"),
});

const TwoFASchema = Yup.object().shape({
  token: Yup.string()
    .length(6, "Must be 6 digits")
    .matches(/^\d{6}$/, "Must be 6 digits")
    .required("Token required"),
});

export default function ProfilePage() {
  const {
    user,
    changePassword,
    get2FARecoveryCodes,
    regenerate2FARecoveryCodes,
    disable2FA,
    enable2FA,
    verify2FA,
    logout,
  } = useAuth();

  const searchParams = useSearchParams();
  const [activeTab, setActiveTab] = useState("password");
  const [show2FAModal, setShow2FAModal] = useState(false);
  const [showDisableModal, setShowDisableModal] = useState(false);
  const [showRecoveryModal, setShowRecoveryModal] = useState(false);
  const [recoveryCodes, setRecoveryCodes] = useState<string[]>([]);
  const [enable2FAData, setEnable2FAData] = useState<any>(null);

  useEffect(() => {
    const tab = searchParams.get("tab");
    if (tab === "security") {
      setActiveTab("password");
    }
  }, [searchParams]);

  if (!user) {
    return (
      <AppLayout>
        <AuthGuard>
          <Spin />
        </AuthGuard>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <AuthGuard>
        <Card
          className="lg:w-[60%] mx-auto shadow-md"
          styles={{ body: { padding: 0, overflow: "hidden" } }}
        >
          <div
            style={{
              height: 140,
              background: "linear-gradient(90deg, #1677ff 0%, #80bfff 100%)",
            }}
          />
          <div style={{ padding: "0 24px 24px" }}>
            <div
              style={{
                marginTop: -40,
                marginBottom: 24,
                display: "flex",
                justifyContent: "space-between",
                alignItems: "flex-end",
                flexWrap: "wrap",
                gap: 16,
              }}
            >
              <div style={{ display: "flex", alignItems: "flex-end", gap: 16 }}>
                <Avatar
                  size={100}
                  style={{
                    backgroundColor: "#f56a00",
                    border: "4px solid white",
                    fontSize: 48,
                  }}
                  icon={<UserOutlined />}
                >
                  {(user.firstName?.[0] || "") + (user.lastName?.[0] || "")}
                </Avatar>
                <div style={{ marginBottom: 8 }}>
                  <Typography.Title level={3} style={{ margin: 0 }}>
                    {user.firstName} {user.lastName}
                  </Typography.Title>
                  <Tag color="blue">{user.role}</Tag>
                </div>
              </div>
              <div style={{ marginBottom: 8 }}>
                <Tag
                  icon={<SafetyCertificateOutlined />}
                  color={user.twoFactorEnabled ? "success" : "warning"}
                  style={{ padding: "4px 10px", fontSize: 14 }}
                >
                  {user.twoFactorEnabled ? "2FA Enabled" : "2FA Disabled"}
                </Tag>
              </div>
            </div>

            <Descriptions column={1} bordered size="small">
              <Descriptions.Item
                label={
                  <>
                    <MailOutlined /> Email
                  </>
                }
              >
                {user.email}
              </Descriptions.Item>
              <Descriptions.Item
                label={
                  <>
                    <IdcardOutlined /> Username
                  </>
                }
              >
                {user.username}
              </Descriptions.Item>
              <Descriptions.Item
                label={
                  <>
                    <HomeOutlined /> Warehouse
                  </>
                }
              >
                {user.warehouse?.name || "Unassigned"}
              </Descriptions.Item>
            </Descriptions>

            <Divider style={{ margin: "24px 0" }} />

            {user.mustChangePassword && (
              <Alert
                message="Password Change Required"
                description="For security reasons, you must change your temporary password before accessing other features."
                type="warning"
                showIcon
                style={{ marginBottom: 24 }}
              />
            )}

            <Tabs
              activeKey={activeTab}
              onChange={setActiveTab}
              tabPosition="top"
              type="card"
            >
              <Tabs.TabPane
                tab={
                  <span>
                    <LockOutlined /> Change Password
                  </span>
                }
                key="password"
              >
                <div style={{ padding: "24px 0" }}>
                  <Formik
                    initialValues={{
                      currentPassword: "",
                      newPassword: "",
                      confirmNewPassword: "",
                    }}
                    validationSchema={PasswordSchema}
                    onSubmit={(values, actions) => {
                      const payload: ChangePasswordPayload = {
                        currentPassword: values.currentPassword,
                        newPassword: values.newPassword,
                      };
                      const wasMustChange = user?.mustChangePassword;
                      changePassword.mutate(payload, {
                        onSuccess: async () => {
                          toast.success("Password changed successfully");
                          actions.resetForm();

                          // If this was a forced password change, log out and redirect to login
                          if (wasMustChange) {
                            toast.info("Please log in with your new password", {
                              duration: 2000,
                            });

                            // Wait a moment for toast to show, then logout
                            setTimeout(async () => {
                              await logout.mutateAsync();
                              window.location.href = "/login";
                            }, 1500);
                          }
                        },
                        onError: (error) => {
                          handleError(error);
                        },
                      });
                      actions.setSubmitting(false);
                    }}
                  >
                    {({ errors, touched, handleSubmit, isSubmitting }) => (
                      <Form layout="vertical" onFinish={handleSubmit}>
                        <Form.Item
                          label="Current Password"
                          required
                          validateStatus={
                            errors.currentPassword && touched.currentPassword
                              ? "error"
                              : ""
                          }
                          help={
                            errors.currentPassword && touched.currentPassword
                              ? errors.currentPassword
                              : ""
                          }
                        >
                          <Field
                            name="currentPassword"
                            as={Input.Password}
                            prefix={<LockOutlined />}
                            placeholder="Enter current password"
                          />
                        </Form.Item>
                        <Form.Item
                          label="New Password"
                          required
                          validateStatus={
                            errors.newPassword && touched.newPassword
                              ? "error"
                              : ""
                          }
                          help={
                            errors.newPassword && touched.newPassword
                              ? errors.newPassword
                              : ""
                          }
                        >
                          <Field
                            name="newPassword"
                            as={Input.Password}
                            prefix={<LockOutlined />}
                            placeholder="Enter new password"
                          />
                        </Form.Item>
                        <Form.Item
                          label="Confirm New Password"
                          required
                          validateStatus={
                            errors.confirmNewPassword &&
                            touched.confirmNewPassword
                              ? "error"
                              : ""
                          }
                          help={
                            errors.confirmNewPassword &&
                            touched.confirmNewPassword
                              ? errors.confirmNewPassword
                              : ""
                          }
                        >
                          <Field
                            name="confirmNewPassword"
                            as={Input.Password}
                            prefix={<LockOutlined />}
                            placeholder="Confirm new password"
                          />
                        </Form.Item>
                        <Button
                          type="primary"
                          htmlType="submit"
                          loading={changePassword.isPending || isSubmitting}
                          block
                          size="large"
                        >
                          Change Password
                        </Button>
                      </Form>
                    )}
                  </Formik>
                </div>
              </Tabs.TabPane>
              <Tabs.TabPane
                tab={
                  <span>
                    <SafetyCertificateOutlined /> 2FA
                  </span>
                }
                key="2fa"
              >
                <div style={{ padding: "24px 0", textAlign: "center" }}>
                  <div style={{ marginBottom: 24 }}>
                    <SafetyCertificateOutlined
                      style={{ fontSize: 48, color: "#1677ff" }}
                    />
                    <Typography.Title level={4} style={{ marginTop: 16 }}>
                      Two-Factor Authentication
                    </Typography.Title>
                    <Typography.Text type="secondary">
                      Add an extra layer of security to your account by enabling
                      2FA.
                    </Typography.Text>
                  </div>

                  {user.twoFactorEnabled ? (
                    <div
                      style={{
                        background: "#f6ffed",
                        border: "1px solid #b7eb8f",
                        padding: 24,
                        borderRadius: 8,
                      }}
                    >
                      <Typography.Text strong type="success">
                        2FA is currently enabled on your account.
                      </Typography.Text>
                      <div
                        style={{
                          marginTop: 16,
                          display: "flex",
                          justifyContent: "center",
                          gap: 16,
                        }}
                      >
                        <Button
                          danger
                          size="large"
                          onClick={() => setShowDisableModal(true)}
                        >
                          Disable 2FA
                        </Button>
                        <Button
                          size="large"
                          onClick={async () => {
                            setShowRecoveryModal(true);
                            const codes =
                              await get2FARecoveryCodes.mutateAsync();
                            setRecoveryCodes(codes?.recoveryCodes || []);
                          }}
                        >
                          Show Backup Codes
                        </Button>
                      </div>
                      <Modal
                        open={showDisableModal}
                        title="Disable Two-Factor Authentication"
                        onCancel={() => setShowDisableModal(false)}
                        footer={null}
                      >
                        <Formik
                          initialValues={{ token: "" }}
                          validationSchema={TwoFASchema}
                          onSubmit={(values, actions) => {
                            disable2FA.mutate(
                              { token: values.token },
                              {
                                onSuccess: () => {
                                  toast.success("2FA disabled");
                                  setShowDisableModal(false);
                                },
                                onError: () => {
                                  toast.error("Invalid token");
                                },
                              }
                            );
                            actions.setSubmitting(false);
                          }}
                        >
                          {({
                            errors,
                            touched,
                            handleSubmit,
                            isSubmitting,
                          }) => (
                            <Form layout="vertical" onFinish={handleSubmit}>
                              <Form.Item
                                label="Verification Token"
                                required
                                validateStatus={
                                  errors.token && touched.token ? "error" : ""
                                }
                                help={
                                  errors.token && touched.token
                                    ? errors.token
                                    : ""
                                }
                              >
                                <Field
                                  name="token"
                                  as={Input}
                                  maxLength={6}
                                  prefix={<KeyOutlined />}
                                  placeholder="Enter 6-digit code"
                                />
                              </Form.Item>
                              <Button
                                danger
                                htmlType="submit"
                                loading={disable2FA.isPending || isSubmitting}
                                block
                              >
                                Disable 2FA
                              </Button>
                            </Form>
                          )}
                        </Formik>
                      </Modal>
                    </div>
                  ) : (
                    <div
                      style={{
                        background: "#f0f5ff",
                        border: "1px solid #adc6ff",
                        padding: 24,
                        borderRadius: 8,
                      }}
                    >
                      <Typography.Text>
                        Protect your account by enabling 2FA. You will be
                        required to enter a code from your authenticator app
                        when logging in.
                      </Typography.Text>
                      <div style={{ marginTop: 16 }}>
                        <Button
                          type="primary"
                          size="large"
                          onClick={async () => {
                            setShow2FAModal(true);
                            const enableData = await enable2FA.mutateAsync();
                            setEnable2FAData(enableData);
                          }}
                          loading={enable2FA.isPending}
                        >
                          Enable 2FA
                        </Button>
                      </div>
                    </div>
                  )}

                  <Modal
                    open={showRecoveryModal}
                    title="2FA Recovery Codes"
                    onCancel={() => setShowRecoveryModal(false)}
                    footer={null}
                  >
                    <div>
                      {recoveryCodes.length > 0 ? (
                        <div
                          style={{
                            display: "grid",
                            gridTemplateColumns: "1fr 1fr",
                            gap: 8,
                            marginBottom: 16,
                          }}
                        >
                          {recoveryCodes.map((code: string) => (
                            <Tag
                              key={code}
                              style={{
                                textAlign: "center",
                                padding: "8px",
                                fontSize: 16,
                                margin: 0,
                              }}
                            >
                              {code}
                            </Tag>
                          ))}
                        </div>
                      ) : (
                        <Spin />
                      )}
                      <Divider />
                      <Button
                        block
                        onClick={async () => {
                          const codes =
                            await regenerate2FARecoveryCodes.mutateAsync();
                          setRecoveryCodes(codes?.recoveryCodes || []);
                          notification.success({
                            message: "Backup codes regenerated",
                          });
                        }}
                      >
                        Regenerate Codes
                      </Button>
                    </div>
                  </Modal>

                  <Modal
                    open={show2FAModal}
                    title="Enable Two-Factor Authentication"
                    onCancel={() => setShow2FAModal(false)}
                    footer={null}
                    width={600}
                  >
                    {enable2FAData ? (
                      <div style={{ textAlign: "center" }}>
                        <Divider />
                        <Typography.Paragraph>
                          1. Scan this QR code with your authenticator app
                          (Google Authenticator, Authy, etc.)
                        </Typography.Paragraph>
                        <div
                          style={{
                            background: "white",
                            padding: 16,
                            display: "inline-block",
                            border: "1px solid #eee",
                            borderRadius: 8,
                          }}
                        >
                          <Image
                            src={enable2FAData.qrCode}
                            alt="QR Code"
                            width={200}
                            preview={false}
                          />
                        </div>
                        <div style={{ marginTop: 16, marginBottom: 24 }}>
                          <Typography.Text type="secondary">
                            Or enter this key manually:
                          </Typography.Text>
                          <br />
                          <Typography.Text copyable strong code>
                            {enable2FAData.manualEntryKey}
                          </Typography.Text>
                        </div>
                        <Divider />
                        <Typography.Paragraph>
                          2. Enter the 6-digit code from your app to verify
                        </Typography.Paragraph>
                        <Formik
                          initialValues={{ token: "" }}
                          validationSchema={TwoFASchema}
                          onSubmit={(values, actions) => {
                            const payload: TwoFAVerifyPayload = {
                              token: values.token,
                            };
                            verify2FA.mutate(payload, {
                              onSuccess: () => {
                                toast.success("2FA enabled");
                                setShow2FAModal(false);
                                setEnable2FAData(null);
                              },
                              onError: (error) => {
                                handleError(error);
                              },
                            });
                            actions.setSubmitting(false);
                          }}
                        >
                          {({
                            errors,
                            touched,
                            handleSubmit,
                            isSubmitting,
                          }) => (
                            <Form layout="vertical" onFinish={handleSubmit}>
                              <Form.Item
                                validateStatus={
                                  errors.token && touched.token ? "error" : ""
                                }
                                help={
                                  errors.token && touched.token
                                    ? errors.token
                                    : ""
                                }
                              >
                                <Field
                                  name="token"
                                  as={Input}
                                  maxLength={6}
                                  style={{
                                    textAlign: "center",
                                    fontSize: 24,
                                    letterSpacing: 8,
                                    width: 200,
                                  }}
                                  placeholder="000000"
                                />
                              </Form.Item>
                              <Button
                                type="primary"
                                htmlType="submit"
                                loading={verify2FA.isPending || isSubmitting}
                                size="large"
                                block
                              >
                                Verify & Enable
                              </Button>
                            </Form>
                          )}
                        </Formik>
                        <Divider />
                        <div style={{ textAlign: "left" }}>
                          <Typography.Text strong>
                            Save these recovery codes in a safe place:
                          </Typography.Text>
                          <div
                            style={{
                              display: "grid",
                              gridTemplateColumns: "1fr 1fr",
                              gap: 8,
                              marginTop: 8,
                            }}
                          >
                            {enable2FAData.recoveryCodes?.map(
                              (code: string) => (
                                <Tag
                                  key={code}
                                  style={{
                                    textAlign: "center",
                                    padding: "4px",
                                    margin: 0,
                                  }}
                                >
                                  {code}
                                </Tag>
                              )
                            ) || <Spin />}
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div style={{ textAlign: "center", padding: 40 }}>
                        <Spin size="large" />
                      </div>
                    )}
                  </Modal>
                </div>
              </Tabs.TabPane>
            </Tabs>
          </div>
        </Card>
      </AuthGuard>
    </AppLayout>
  );
}
