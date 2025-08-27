"use client";

import { Card, Table, Button, Form, InputNumber, DatePicker, notification, Empty, Spin } from "antd";
import { Formik, Form as FormikForm, Field } from "formik";
import * as Yup from "yup";
import { useExchangeRate } from "@/hooks/useExchangeRate";
import { exchangeRateColumns } from "./columns";
import { AppLayout } from "@/components/AppLayout";
import { AuthGuard } from "@/components/AuthGuard";
import { ExchangeRateCreatePayload } from "@/types/exchangeRate";
import { useState } from "react";
import dayjs from "dayjs";

const ROLES_ALLOWED = ["FINANCE_MANAGER", "SUPER_ADMIN"];

const validationSchema = Yup.object().shape({
  rate: Yup.number().required("Rate is required").moreThan(0, "Rate must be greater than 0"),
  effectiveFrom: Yup.date().required("Effective From is required"),
});

export default function ExchangeRatePage() {
  const {
    activeRate,
    activeLoading,
    activeError,
    refetchActive,
    useRateHistory,
    setActiveRate,
    setPending,
    setError,
    setSuccess,
    resetSet,
  } = useExchangeRate();

  // Pagination state
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);

  // Table data
  const {
    data: historyData,
    isLoading: historyLoading,
    error: historyError,
    refetch: refetchHistory,
  } = useRateHistory({ page, limit, sortBy: "createdAt", sortOrder: "desc" });

  // Notification handlers
  if (setError) {
    notification.error({
      message: "Failed to set exchange rate",
      description: setError.message,
      duration: 3,
    });
    resetSet();
  }
  if (setSuccess) {
    notification.success({
      message: "Exchange rate updated",
      duration: 2,
    });
    refetchActive();
    refetchHistory();
    resetSet();
  }

  return (
    <AuthGuard requiredRoles={ROLES_ALLOWED}>
      <AppLayout>
        <div className="px-4 md:px-6 lg:px-8 py-4 max-w-7xl mx-auto space-y-4">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 mb-4">
            <h1 className="text-2xl font-bold">Exchange Rate Management</h1>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
            <Card title="Current Active Rate" loading={activeLoading}>
              {activeError ? (
                <Empty description="Failed to load active rate" />
              ) : activeRate ? (
                <div className="flex flex-col gap-2">
                  <div>
                    <span className="font-semibold">Rate:</span> {activeRate.rate}
                  </div>
                  <div>
                    <span className="font-semibold">Effective From:</span>{" "}
                    {dayjs(activeRate.effectiveFrom).format("YYYY-MM-DD HH:mm")}
                  </div>
                  <div>
                    <span className="font-semibold">Set By:</span> {activeRate.setBy?.name}
                  </div>
                </div>
              ) : (
                <Spin />
              )}
            </Card>

            <Card title="Set New Exchange Rate">
              <Formik
                initialValues={{
                  rate: "",
                  effectiveFrom: "",
                }}
                validationSchema={validationSchema}
                onSubmit={(values, { resetForm }) => {
                  const payload: ExchangeRateCreatePayload = {
                    rate: Number(values.rate),
                    effectiveFrom: dayjs(values.effectiveFrom).toISOString(),
                    fromCurrency: "USD",
                    toCurrency: "GHS",
                  };
                  setActiveRate(payload);
                  resetForm();
                }}
              >
                {({ errors, touched, setFieldValue, isSubmitting }) => (
                  <FormikForm className="flex flex-col gap-4">
                    <Form.Item
                      label="Rate"
                      validateStatus={errors.rate && touched.rate ? "error" : ""}
                      help={errors.rate && touched.rate ? errors.rate : ""}
                    >
                      <Field name="rate">
                        {({ field }: any) => (
                          <InputNumber
                            {...field}
                            min={0.0001}
                            step={0.0001}
                            style={{ width: "100%" }}
                            onChange={val => setFieldValue("rate", val)}
                          />
                        )}
                      </Field>
                    </Form.Item>
                    <Form.Item
                      label="Effective From"
                      validateStatus={errors.effectiveFrom && touched.effectiveFrom ? "error" : ""}
                      help={errors.effectiveFrom && touched.effectiveFrom ? errors.effectiveFrom : ""}
                    >
                      <Field name="effectiveFrom">
                        {({ field }: any) => (
                          <DatePicker
                            {...field}
                            showTime
                            style={{ width: "100%" }}
                            onChange={val => setFieldValue("effectiveFrom", val)}
                          />
                        )}
                      </Field>
                    </Form.Item>
                    <Button
                      type="primary"
                      htmlType="submit"
                      loading={setPending || isSubmitting}
                      disabled={setPending || isSubmitting}
                    >
                      Set Rate
                    </Button>
                  </FormikForm>
                )}
              </Formik>
            </Card>
          </div>

          <div className="shadow-sm rounded-2xl bg-white p-3 md:p-4">
            <Card title="Historical Exchange Rates" bordered={false}>
              <Table
                columns={exchangeRateColumns}
                dataSource={historyData?.data || []}
                rowKey="id"
                loading={historyLoading}
                pagination={{
                  current: page,
                  pageSize: limit,
                  total: historyData?.total || 0,
                  onChange: (p, ps) => {
                    setPage(p);
                    setLimit(ps);
                  },
                }}
                locale={{ emptyText: <Empty description="No historical rates found" /> }}
                scroll={{ x: true }}
                size="middle"
              />
            </Card>
          </div>
        </div>
      </AppLayout>
    </AuthGuard>
  );
}
