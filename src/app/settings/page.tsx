"use client";

import { Card, Form, Switch, Button, Select, notification, Typography, Space } from "antd";
import { useFormik } from "formik";
import * as Yup from "yup";
import { useSettings } from "@/hooks/useSettings";
import { AppSettings, UpdateSettingsPayload } from "@/types/settings";
import { AppLayout } from "@/components/AppLayout";
import { AuthGuard } from "@/components/AuthGuard";
import { useEffect } from "react";

const { Title, Text } = Typography;

const tableDensityOptions = [
  { label: "Default", value: "default" },
  { label: "Compact", value: "compact" },
];

const validationSchema = Yup.object({
  notificationDefaults: Yup.object({
    emailRequired: Yup.boolean().required(),
    smsDefault: Yup.boolean().required(),
    whatsappDefault: Yup.boolean().required(),
  }),
  uiPreferences: Yup.object({
    tableDensity: Yup.string().oneOf(["default", "compact"]).required(),
  }),
});

export default function SettingsPage() {
  const {
    settings,
    isLoading,
    updateSettingsMutate,
    isUpdating,
    isUpdateSuccess,
    isUpdateError,
    updateError,
    resetUpdate,
    refetch,
  } = useSettings();

  useEffect(() => {
    if (isUpdateSuccess) {
      notification.success({ message: "Settings updated successfully" });
      resetUpdate();
      refetch();
    }
    if (isUpdateError && updateError) {
      notification.error({ message: "Failed to update settings", description: updateError.message });
    }
  }, [isUpdateSuccess, isUpdateError, updateError, resetUpdate, refetch]);

  const formik = useFormik<UpdateSettingsPayload>({
    enableReinitialize: true,
    initialValues: {
      notificationDefaults: settings?.notificationDefaults ?? {
        emailRequired: false,
        smsDefault: false,
        whatsappDefault: false,
      },
      uiPreferences: settings?.uiPreferences ?? {
        tableDensity: "default",
      },
      featureFlags: settings?.featureFlags ?? {},
    },
    validationSchema,
    onSubmit: (values) => {
      updateSettingsMutate(values);
    },
    onReset: () => {
      formik.setValues({
        notificationDefaults: settings?.notificationDefaults ?? {
          emailRequired: false,
          smsDefault: false,
          whatsappDefault: false,
        },
        uiPreferences: settings?.uiPreferences ?? {
          tableDensity: "default",
        },
        featureFlags: settings?.featureFlags ?? {},
      });
    },
  });

  return (
    <AuthGuard requiredRoles={["SUPER_ADMIN"]}>
      <AppLayout>
        <div className="px-4 md:px-6 lg:px-8 py-4 max-w-2xl mx-auto space-y-4">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 mb-4">
            <Title level={2}>Settings & Configuration</Title>
          </div>

          <Form layout="vertical" onFinish={formik.handleSubmit} onReset={formik.handleReset}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
              <Card title="Notification Defaults" className="mb-4">
                <Form.Item label="Email Required" valuePropName="checked">
                  <Switch
                    checked={formik.values.notificationDefaults?.emailRequired}
                    onChange={(checked) => formik.setFieldValue("notificationDefaults.emailRequired", checked)}
                  />
                </Form.Item>
                <Form.Item label="SMS Default" valuePropName="checked">
                  <Switch
                    checked={formik.values.notificationDefaults?.smsDefault}
                    onChange={(checked) => formik.setFieldValue("notificationDefaults.smsDefault", checked)}
                  />
                </Form.Item>
                <Form.Item label="WhatsApp Default" valuePropName="checked">
                  <Switch
                    checked={formik.values.notificationDefaults?.whatsappDefault}
                    onChange={(checked) => formik.setFieldValue("notificationDefaults.whatsappDefault", checked)}
                  />
                </Form.Item>
              </Card>

              <Card title="UI Preferences" className="mb-4">
                <Form.Item label="Table Density">
                  <Select
                    options={tableDensityOptions}
                    value={formik.values.uiPreferences?.tableDensity}
                    onChange={(value) => formik.setFieldValue("uiPreferences.tableDensity", value)}
                    style={{ width: 180 }}
                  />
                </Form.Item>
              </Card>
            </div>

            <Card title="Feature Flags" className="mb-4">
              <Form.Item label="Enable Experimental">
                <Switch
                  checked={formik.values.featureFlags?.enableExperimental ?? false}
                  disabled
                />
                <Text type="secondary" className="ml-2">
                  (Read-only placeholder)
                </Text>
              </Form.Item>
            </Card>

            <div className="flex gap-3 mt-4">
              <Button type="primary" htmlType="submit" loading={isUpdating}>
                Save
              </Button>
              <Button htmlType="reset" disabled={isUpdating}>
                Reset
              </Button>
            </div>
          </Form>
        </div>
      </AppLayout>
    </AuthGuard>
  );
}
