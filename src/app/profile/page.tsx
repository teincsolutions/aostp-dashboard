"use client";

import { useAuth } from "@/hooks/useAuth";
import { useSecurity } from "@/hooks/useSecurity";
import { useAuthStore } from "@/store/authStore";
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
} from "antd";
import { Formik, Form as FormikForm, Field } from "formik";
import * as Yup from "yup";
import { useState } from "react";
import { ChangePasswordPayload, TwoFAVerifyPayload } from "@/types/auth";
import { toast } from "sonner";
import { handleError } from "@/utils/forms/errorUtils";

const ProfileSchema = Yup.object().shape({
  firstName: Yup.string().required("First name required"),
  lastName: Yup.string().required("Last name required"),
  email: Yup.string().email("Invalid email").required("Email required"),
});

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
  code: Yup.string()
    .length(6, "Must be 6 digits")
    .matches(/^\d{6}$/, "Must be 6 digits")
    .required("Code required"),
});

export default function ProfilePage() {
  const { user } = useAuth();
  const security = useSecurity();
  const authStore = useAuthStore();

  const [show2FAModal, setShow2FAModal] = useState(false);
  const [showRecoveryModal, setShowRecoveryModal] = useState(false);
  const [recoveryCodes, setRecoveryCodes] = useState<string[]>([]);
  const [enable2FAData, setEnable2FAData] = useState<any>(null);

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
        <Card className="lg:w-[50%] mx-auto">
          <Tabs defaultActiveKey="profile" tabPosition="top">
            <Tabs.TabPane tab="Profile Info" key="profile">
              <Divider orientation="left">Profile Info</Divider>
              <div className="mb-4">
                <Tag color="blue">Username: {user.username}</Tag>
                <Tag color="purple">Role: {user.role}</Tag>
                <Tag color={user.twoFactorEnabled ? "green" : "red"}>
                  2FA: {user.twoFactorEnabled ? "Enabled" : "Disabled"}
                </Tag>
              </div>
              <Formik
                initialValues={{
                  firstName: user.firstName || "",
                  lastName: user.lastName || "",
                  email: user.email,
                }}
                validationSchema={ProfileSchema}
                onSubmit={(values, actions) => {
                  authStore.updateUser({
                    firstName: values.firstName,
                    lastName: values.lastName,
                    email: values.email,
                  });
                  notification.success({ message: "Profile updated" });
                  actions.setSubmitting(false);
                }}
              >
                {({
                  errors,
                  touched,
                  handleSubmit,
                  isSubmitting,
                  handleReset,
                }) => (
                  <FormikForm onSubmit={handleSubmit}>
                    <Form.Item
                      label="First Name"
                      validateStatus={
                        errors.firstName && touched.firstName ? "error" : ""
                      }
                      help={
                        errors.firstName && touched.firstName
                          ? errors.firstName
                          : ""
                      }
                    >
                      <Field name="firstName" as={Input} />
                    </Form.Item>
                    <Form.Item
                      label="Last Name"
                      validateStatus={
                        errors.lastName && touched.lastName ? "error" : ""
                      }
                      help={
                        errors.lastName && touched.lastName
                          ? errors.lastName
                          : ""
                      }
                    >
                      <Field name="lastName" as={Input} />
                    </Form.Item>
                    <Form.Item
                      label="Email"
                      validateStatus={
                        errors.email && touched.email ? "error" : ""
                      }
                      help={errors.email && touched.email ? errors.email : ""}
                    >
                      <Field name="email" as={Input} />
                    </Form.Item>
                    <Button
                      type="primary"
                      htmlType="submit"
                      loading={isSubmitting}
                      className="mr-2"
                    >
                      Save
                    </Button>
                    <Button onClick={handleReset} disabled={isSubmitting}>
                      Cancel
                    </Button>
                  </FormikForm>
                )}
              </Formik>
            </Tabs.TabPane>
            <Tabs.TabPane tab="Change Password" key="password">
              <Divider orientation="left">Change Password</Divider>
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
                  security.changePassword.mutate(payload, {
                    onSuccess: () => {
                      toast.success("Password changed");
                      actions.resetForm();
                    },
                    onError: (error) => {
                      handleError(error);
                    },
                  });
                  actions.setSubmitting(false);
                }}
              >
                {({ errors, touched, handleSubmit, isSubmitting }) => (
                  <FormikForm onSubmit={handleSubmit}>
                    <Form.Item
                      label="Current Password"
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
                      <Field name="currentPassword" as={Input.Password} />
                    </Form.Item>
                    <Form.Item
                      label="New Password"
                      validateStatus={
                        errors.newPassword && touched.newPassword ? "error" : ""
                      }
                      help={
                        errors.newPassword && touched.newPassword
                          ? errors.newPassword
                          : ""
                      }
                    >
                      <Field name="newPassword" as={Input.Password} />
                    </Form.Item>
                    <Form.Item
                      label="Confirm New Password"
                      validateStatus={
                        errors.confirmNewPassword && touched.confirmNewPassword
                          ? "error"
                          : ""
                      }
                      help={
                        errors.confirmNewPassword && touched.confirmNewPassword
                          ? errors.confirmNewPassword
                          : ""
                      }
                    >
                      <Field name="confirmNewPassword" as={Input.Password} />
                    </Form.Item>
                    <Button
                      type="primary"
                      htmlType="submit"
                      loading={
                        security.changePassword.isPending || isSubmitting
                      }
                    >
                      Change Password
                    </Button>
                  </FormikForm>
                )}
              </Formik>
            </Tabs.TabPane>
            <Tabs.TabPane tab="Two-Factor Authentication (2FA)" key="2fa">
              <Divider orientation="left">Two-Factor Authentication</Divider>
              {user.twoFactorEnabled ? (
                <>
                  <Button
                    danger
                    onClick={() => {
                      Modal.confirm({
                        title: "Disable 2FA",
                        content: "Are you sure you want to disable 2FA?",
                        onOk: () => {
                          security.disable2FA.mutate(undefined, {
                            onSuccess: () => {
                              toast.success("2FA disabled");
                            },
                            onError: () => {
                              toast.error("Failed to disable 2FA");
                            },
                          });
                        },
                      });
                    }}
                    loading={security.disable2FA.isPending}
                  >
                    Disable 2FA
                  </Button>
                  <Button
                    style={{ marginLeft: 8 }}
                    onClick={async () => {
                      setShowRecoveryModal(true);
                      const codes =
                        await security.get2FARecoveryCodes.mutateAsync();
                      setRecoveryCodes(codes?.recoveryCodes || []);
                    }}
                  >
                    Show Backup Codes
                  </Button>
                  <Modal
                    open={showRecoveryModal}
                    title="2FA Recovery Codes"
                    onCancel={() => setShowRecoveryModal(false)}
                    footer={null}
                  >
                    <div>
                      {recoveryCodes.length > 0 ? (
                        recoveryCodes.map((code: string) => (
                          <Tag key={code}>{code}</Tag>
                        ))
                      ) : (
                        <Spin />
                      )}
                      <Divider />
                      <Button
                        onClick={async () => {
                          const codes =
                            await security.regenerate2FARecoveryCodes.mutateAsync();
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
                </>
              ) : (
                <>
                  <Button
                    type="primary"
                    onClick={async () => {
                      setShow2FAModal(true);
                      const enableData = await security.enable2FA.mutateAsync();
                      setEnable2FAData(enableData);
                    }}
                    loading={security.enable2FA.isPending}
                  >
                    Enable 2FA
                  </Button>
                  <Modal
                    open={show2FAModal}
                    title="Enable Two-Factor Authentication"
                    onCancel={() => setShow2FAModal(false)}
                    footer={null}
                  >
                    {enable2FAData ? (
                      <div>
                        <Divider />
                        <Image
                          src={enable2FAData.qrCode}
                          alt="QR Code"
                          style={{ width: 200, marginBottom: 16 }}
                        />
                        <Divider />
                        <Formik
                          initialValues={{ code: "" }}
                          validationSchema={TwoFASchema}
                          onSubmit={(values, actions) => {
                            const payload: TwoFAVerifyPayload = {
                              code: values.code,
                            };
                            security.verify2FA.mutate(payload, {
                              onSuccess: () => {
                                toast.success("2FA enabled");
                                setShow2FAModal(false);
                                setEnable2FAData(null);
                              },
                              onError: () => {
                                toast.error("Invalid code");
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
                            <FormikForm onSubmit={handleSubmit}>
                              <Form.Item
                                label="Verification Code"
                                validateStatus={
                                  errors.code && touched.code ? "error" : ""
                                }
                                help={
                                  errors.code && touched.code ? errors.code : ""
                                }
                              >
                                <Field name="code" as={Input} maxLength={6} />
                              </Form.Item>
                              <Button
                                type="primary"
                                htmlType="submit"
                                loading={
                                  security.verify2FA.isPending || isSubmitting
                                }
                              >
                                Verify & Enable
                              </Button>
                            </FormikForm>
                          )}
                        </Formik>
                        <Divider />
                        <div>
                          <strong>Manual Entry Key:</strong>{" "}
                          {enable2FAData.manualEntryKey}
                        </div>
                        <div>
                          <strong>Recovery Codes:</strong>
                          {enable2FAData.recoveryCodes?.map((code: string) => (
                            <Tag key={code}>{code}</Tag>
                          )) || <Spin />}
                        </div>
                      </div>
                    ) : (
                      <Spin />
                    )}
                  </Modal>
                </>
              )}
            </Tabs.TabPane>
          </Tabs>
        </Card>
      </AuthGuard>
    </AppLayout>
  );
}
