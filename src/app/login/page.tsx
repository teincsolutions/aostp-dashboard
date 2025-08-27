"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button, Card, Divider, Input, Typography, Form, Alert } from "antd";
import { LockOutlined, MobileOutlined, UserOutlined } from "@ant-design/icons";
import { useFormik } from "formik";
import * as Yup from "yup";
import { useAuth } from "@/hooks/useAuth";

const { Title, Text } = Typography;

const loginSchema = Yup.object().shape({
  email: Yup.string()
    .email("Please enter a valid email")
    .required("Email is required"),
  password: Yup.string()
    .min(6, "Password must be at least 6 characters")
    .required("Password is required"),
});

const twoFactorSchema = Yup.object().shape({
  twoFactorToken: Yup.string()
    .matches(/^\d{6}$/, "Token must be exactly 6 digits")
    .required("2FA token is required"),
});

const LoginPage: React.FC = () => {
  const router = useRouter();
  const { login, twoFactorLogin, isAuthenticated } = useAuth();
  const [twoFactorMode, setTwoFactorMode] = useState(false);

  useEffect(() => {
    if (isAuthenticated) {
      const redirectPath = localStorage.getItem("redirectAfterLogin");
      if (redirectPath) {
        localStorage.removeItem("redirectAfterLogin");
        router.push(redirectPath);
      } else {
        router.push("/dashboard");
      }
    }
  }, [isAuthenticated, router]);

  const loginFormik = useFormik<{
    email: string;
    password: string;
    general?: string;
  }>({
    initialValues: {
      email: "",
      password: "",
    },
    validationSchema: loginSchema,
    onSubmit: async (values, { setSubmitting, setFieldError }) => {
      try {
        await login(values);
      } catch (error) {
        console.error("Login error:", error);
        setFieldError("general", error instanceof Error ? error.message : "An error occurred");
      } finally {
        setSubmitting(false);
      }
    },
  });

  const twoFactorFormik = useFormik({
    initialValues: {
      twoFactorToken: "",
    },
    validationSchema: twoFactorSchema,
    onSubmit: async (values, { setSubmitting, setFieldError }) => {
      try {
        await twoFactorLogin({
          email: loginFormik.values.email,
          password: loginFormik.values.password,
          token: values.twoFactorToken,
        });
      } catch (error) {
        setFieldError("twoFactorToken", error instanceof Error ? error.message : "An error occurred");
      } finally {
        setSubmitting(false);
      }
    },
  });

  const handleBackToLogin = () => {
    setTwoFactorMode(false);
    twoFactorFormik.resetForm();
  };

  if (twoFactorMode) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-500 to-purple-600 p-5">
        <Card className="max-w-md mx-auto">
          <div className="space-y-6 w-full">
            <div className="text-center">
              <MobileOutlined className="text-5xl text-blue-500 mb-4" />
              <Title level={3}>Two-Factor Authentication</Title>
              <Text type="secondary">
                Enter the 6-digit code from your authenticator app
              </Text>
            </div>

            <Form
              layout="vertical"
              onFinish={twoFactorFormik.handleSubmit}
              className="space-y-6"
            >
              <Form.Item
                label="2FA Code"
                validateStatus={
                  twoFactorFormik.errors.twoFactorToken &&
                  twoFactorFormik.touched.twoFactorToken
                    ? "error"
                    : ""
                }
                help={
                  twoFactorFormik.errors.twoFactorToken &&
                  twoFactorFormik.touched.twoFactorToken
                    ? twoFactorFormik.errors.twoFactorToken
                    : null
                }
              >
                <Input
                  name="twoFactorToken"
                  placeholder="Enter 6-digit code"
                  value={twoFactorFormik.values.twoFactorToken}
                  onChange={twoFactorFormik.handleChange}
                  onBlur={twoFactorFormik.handleBlur}
                  maxLength={6}
                  className="text-center text-lg tracking-widest"
                />
              </Form.Item>

              <Form.Item>
                <Button
                  type="primary"
                  htmlType="submit"
                  block
                  loading={twoFactorFormik.isSubmitting}
                >
                  Verify Code
                </Button>
              </Form.Item>
              <Form.Item>
                <Button block onClick={handleBackToLogin}>
                  Back to Login
                </Button>
              </Form.Item>
            </Form>

            <Divider plain>Demo Credentials</Divider>
            <div className="text-center">
              <Text type="secondary" className="text-xs">
                Email: admin@aostp.com
                <br />
                Password: Admin@123456
              </Text>
            </div>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-500 to-purple-600 p-5">
      <Card className="max-w-md mx-auto">
        <div className="space-y-6 w-full">
          <div className="text-center">
            <UserOutlined className="text-5xl text-blue-500 mb-4" />
            <Title level={2}>Welcome Back</Title>
            <Text type="secondary">Sign in to your account</Text>
          </div>

          <Form
            layout="vertical"
            onFinish={loginFormik.handleSubmit}
            className="space-y-4"
          >
            <Form.Item
              label="Email"
              validateStatus={
                loginFormik.errors.email && loginFormik.touched.email
                  ? "error"
                  : ""
              }
              help={
                loginFormik.errors.email && loginFormik.touched.email
                  ? loginFormik.errors.email
                  : null
              }
            >
              <Input
                name="email"
                prefix={<UserOutlined />}
                placeholder="Email"
                value={loginFormik.values.email}
                onChange={loginFormik.handleChange}
                onBlur={loginFormik.handleBlur}
                size="large"
              />
            </Form.Item>

            <Form.Item
              label="Password"
              validateStatus={
                loginFormik.errors.password && loginFormik.touched.password
                  ? "error"
                  : ""
              }
              help={
                loginFormik.errors.password && loginFormik.touched.password
                  ? loginFormik.errors.password
                  : null
              }
            >
              <Input.Password
                name="password"
                prefix={<LockOutlined />}
                placeholder="Password"
                value={loginFormik.values.password}
                onChange={loginFormik.handleChange}
                onBlur={loginFormik.handleBlur}
                size="large"
              />
            </Form.Item>

            {loginFormik.errors.general && (
              <Form.Item>
                <Alert
                  message={loginFormik.errors.general}
                  type="error"
                  showIcon
                />
              </Form.Item>
            )}

            <Form.Item>
              <Button
                type="primary"
                htmlType="submit"
                block
                size="large"
                loading={loginFormik.isSubmitting}
                className="mb-2"
              >
                Sign In
              </Button>
            </Form.Item>
          </Form>

          <Divider plain>Demo Credentials</Divider>
          <div className="text-center">
            <Text type="secondary" className="text-xs">
              Email: admin@aostp.com
              <br />
              Password: Admin@123456
            </Text>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default LoginPage;
