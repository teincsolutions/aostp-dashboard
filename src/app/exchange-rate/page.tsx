"use client";

import {
  Card,
  Table,
  Button,
  Form,
  Input,
  InputNumber,
  DatePicker,
  notification,
  Empty,
  Spin,
  Tabs,
  Select,
  Space,
  Tag,
  Popconfirm,
} from "antd";
import { Formik, Form as FormikForm, Field } from "formik";
import * as Yup from "yup";
import { useExchangeRate } from "@/hooks/useExchangeRate";
import { AppLayout } from "@/components/AppLayout";
import { AuthGuard } from "@/components/AuthGuard";
import {
  ExchangeRateCreatePayload,
  ShippingMode,
  AirShippingType,
  ExchangeRate,
  ShippingRate,
  City,
} from "@/types/exchangeRate";
import { useShippingRates } from "@/hooks/useShippingRates";
import { useCities } from "@/hooks/useCities";
import { useState, useEffect } from "react";
import dayjs from "dayjs";
import { toast } from "sonner";
import { getServerValidationErrors } from "@/utils/forms/errorUtils";

const ROLES_ALLOWED = ["FINANCE_MANAGER", "SUPER_ADMIN"];

const exchangeRateValidationSchema = Yup.object().shape({
  rate: Yup.number()
    .required("Rate is required")
    .moreThan(0, "Rate must be greater than 0"),
  effectiveFrom: Yup.date().required("Effective From is required"),
});

const shippingRateValidationSchema = Yup.object().shape({
  shippingMode: Yup.string().required("Shipping mode is required"),
  airShippingType: Yup.string().when("shippingMode", {
    is: "AIR",
    then: (schema) => schema.required("Air shipping type is required"),
  }),
  cityId: Yup.string().required("City ID is required"),
  ratePerUnit: Yup.number()
    .required("Rate per unit is required")
    .moreThan(0, "Rate must be greater than 0"),
  currency: Yup.string()
    .required("Currency is required")
    .oneOf(["GHS", "USD"], "Currency must be GHS or USD"),
  effectiveFrom: Yup.date().required("Effective From is required"),
});

export default function RateManagementPage() {
  // Currency exchange rates
  const {
    activeRate,
    activeLoading,
    activeError,
    refetchActive,
    useRateHistory,
    setActiveRate,
    setPending: setExchangePending,
    setError: setExchangeError,
    setSuccess: setExchangeSuccess,
    resetSet: resetExchangeSet,
    deleteExchangeRate,
  } = useExchangeRate();

  // Shipping rates
  const {
    activeRates,
    activeRatesLoading,
    refetchActive: refetchActiveShipping,
    useRateHistory: useShippingRateHistory,
    setShippingRate,
    setPending: setShippingPending,
    setError: setShippingError,
    isSetSuccess: isShippingSetSuccess,
    resetSet: resetShippingSet,
    deactivateShippingRate,
    updateShippingRate,
  } = useShippingRates();

  // Pagination states
  const [exchangePage, setExchangePage] = useState(1);
  const [exchangeLimit, setExchangeLimit] = useState(10);
  const [shippingPage, setShippingPage] = useState(1);
  const [shippingLimit, setShippingLimit] = useState(10);

  // Date overlap validation state
  const [allExchangeRates, setAllExchangeRates] = useState<ExchangeRate[]>([]);
  const [allShippingRates, setAllShippingRates] = useState<ShippingRate[]>([]);

  // Get complete rate datasets for validation
  const allExchangeRatesQuery = useRateHistory({ page: 1, limit: 100 });
  const allShippingRatesQuery = useShippingRateHistory({
    page: 1,
    limit: 100,
  });

  // Update validation state when full datasets are loaded
  useEffect(() => {
    if (allExchangeRatesQuery.data?.data) {
      setAllExchangeRates(allExchangeRatesQuery.data.data);
    }
  }, [allExchangeRatesQuery.data]);

  useEffect(() => {
    if (allShippingRatesQuery.data?.data) {
      setAllShippingRates(allShippingRatesQuery.data.data);
    }
  }, [allShippingRatesQuery.data]);

  // Date overlap validation functions
  const validateExchangeRateDateOverlap = (
    effectiveFrom: dayjs.Dayjs
  ): { isValid: boolean; message?: string } => {
    const activeRates = allExchangeRates.filter((rate) => rate.isActive);
    const selectedDate = effectiveFrom.toISOString();

    // Check if there's an active rate that would conflict
    for (const rate of activeRates) {
      if (rate.effectiveFrom <= selectedDate) {
        return {
          isValid: false,
          message: `Date overlaps with existing active rate effective from ${dayjs(
            rate.effectiveFrom
          ).format("YYYY-MM-DD HH:mm")}`,
        };
      }
    }

    return { isValid: true };
  };

  const validateShippingRateDateOverlap = (
    effectiveFrom: dayjs.Dayjs,
    shippingMode: ShippingMode,
    airShippingType?: AirShippingType
  ): { isValid: boolean; message?: string } => {
    const selectedDate = effectiveFrom.toISOString();

    // Filter rates for the same mode/type combination
    const relevantRates = allShippingRates.filter((rate) => {
      if (rate.shippingMode !== shippingMode) return false;
      if (
        shippingMode === ShippingMode.AIR &&
        rate.airShippingType !== airShippingType
      )
        return false;
      return !rate.effectiveTo || rate.effectiveTo > selectedDate; // Active or future rates
    });

    // Check for overlaps
    for (const rate of relevantRates) {
      if (
        rate.effectiveFrom <= selectedDate &&
        (!rate.effectiveTo || rate.effectiveTo > selectedDate)
      ) {
        const conflictType = rate.airShippingType
          ? `AIR - ${rate.airShippingType.replace("_", " ")}`
          : "SEA";
        return {
          isValid: false,
          message: `Date overlaps with existing ${conflictType} rate effective from ${dayjs(
            rate.effectiveFrom
          ).format("YYYY-MM-DD HH:mm")}`,
        };
      }
    }

    return { isValid: true };
  };

  // Table data
  const {
    data: exchangeHistoryData,
    isLoading: exchangeHistoryLoading,
    refetch: refetchExchangeHistory,
  } = useRateHistory({
    page: exchangePage,
    limit: exchangeLimit,
    sortBy: "createdAt",
    sortOrder: "desc",
  });

  const {
    data: shippingHistoryData,
    isLoading: shippingHistoryLoading,
    refetch: refetchShippingHistory,
  } = useShippingRateHistory({ page: shippingPage, limit: shippingLimit });

  // Cities for dropdown
  const { data: citiesData, isLoading: citiesLoading } = useCities({
    sortBy: "name",
    sortOrder: "asc",
  });

  // Notification handlers
  if (setExchangeError) {
    notification.error({
      message: "Failed to set exchange rate",
      description: setExchangeError.message,
      duration: 3,
    });
    resetExchangeSet();
  }
  if (setExchangeSuccess) {
    notification.success({
      message: "Exchange rate updated",
      duration: 2,
    });
    refetchActive();
    refetchExchangeHistory();
    resetExchangeSet();
  }

  if (setShippingError) {
    notification.error({
      message: "Failed to set shipping rate",
      description: setShippingError.message,
      duration: 3,
    });
    resetShippingSet();
  }
  if (isShippingSetSuccess) {
    notification.success({
      message: "Shipping rate updated",
      duration: 2,
    });
    refetchActiveShipping();
    refetchShippingHistory();
    resetShippingSet();
  }

  // Exchange rate columns
  const exchangeRateColumns = [
    {
      title: "Rate",
      dataIndex: "rate",
      key: "rate",
      render: (rate: number) => rate.toFixed(4),
    },
    {
      title: "Effective From",
      dataIndex: "effectiveFrom",
      key: "effectiveFrom",
      render: (date: string) => new Date(date).toLocaleString(),
    },
    {
      title: "Set By",
      dataIndex: "setBy",
      key: "setBy",
      render: (setBy: any) => setBy?.name || "-",
    },
    {
      title: "Active",
      dataIndex: "isActive",
      key: "isActive",
      render: (isActive: boolean) => (
        <Tag color={isActive ? "green" : "red"}>
          {isActive ? "Active" : "Inactive"}
        </Tag>
      ),
    },
    {
      title: "Created At",
      dataIndex: "createdAt",
      key: "createdAt",
      render: (date: string) => new Date(date).toLocaleString(),
    },
    {
      title: "Actions",
      key: "actions",
      render: (record: ExchangeRate) => (
        <Space size="middle">
          {!record.isActive && (
            <Popconfirm
              title="Delete Exchange Rate"
              description="Are you sure you want to delete this exchange rate?"
              onConfirm={() => deleteExchangeRate(record.id)}
              okText="Yes"
              cancelText="No"
            >
              <Button danger>Delete</Button>
            </Popconfirm>
          )}
        </Space>
      ),
    },
  ];

  // Shipping rate columns
  const shippingRateColumns = [
    {
      title: "Mode",
      dataIndex: "shippingMode",
      key: "shippingMode",
      render: (mode: ShippingMode) => (
        <Tag color={mode === ShippingMode.SEA ? "blue" : "green"}>{mode}</Tag>
      ),
    },
    {
      title: "Type",
      dataIndex: "airShippingType",
      key: "airShippingType",
      render: (type: AirShippingType) =>
        type ? (
          <Tag color="orange">{type.replace("_", " ")}</Tag>
        ) : (
          <span>-</span>
        ),
    },
    {
      title: "City",
      dataIndex: "cityId",
      key: "cityId",
      render: (_: any, record: ShippingRate) => {
        return `${record.city.name} (${record.city.country})` || "-";
      },
    },
    {
      title: "Rate per Unit",
      dataIndex: "ratePerUnit",
      key: "ratePerUnit",
      render: (ratePerUnit: number, record: ShippingRate) => {
        // Fallback to rate field for backward compatibility
        const rate = ratePerUnit;
        return rate ? `$${rate.toFixed(2)}` : "-";
      },
    },
    {
      title: "Currency",
      dataIndex: "currency",
      key: "currency",
    },
    {
      title: "Effective From",
      dataIndex: "effectiveFrom",
      key: "effectiveFrom",
      render: (date: string) => dayjs(date).format("YYYY-MM-DD HH:mm"),
    },
    {
      title: "Active",
      dataIndex: "isActive",
      key: "isActive",
      render: (isActive: boolean) => (
        <Tag color={isActive ? "green" : "red"}>
          {isActive ? "Active" : "Inactive"}
        </Tag>
      ),
    },
    {
      title:"Actions",
      key: "actions",
      render: (_: any, record: ShippingRate) => (
        <Space size="middle">
          {record.isActive ? (
            <Popconfirm
              title="Deactivate Shipping Rate"
              description="Are you sure you want to deactivate this shipping rate?"
              onConfirm={() => deactivateShippingRate(record.id)}
              okText="Yes"
              cancelText="No"
            >
              <Button size="small" danger>Deactivate</Button>
            </Popconfirm>
          ) : null}
        </Space>
      ),
    }
  ];

  

  return (
    <AuthGuard requiredRoles={ROLES_ALLOWED}>
      <AppLayout>
        <div className="px-4 md:px-6 lg:px-8 py-4 max-w-7xl mx-auto space-y-4">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 mb-4">
            <h1 className="text-2xl font-bold">Rate Management</h1>
          </div>

          <Tabs
            defaultActiveKey="exchange"
            type="card"
            items={[
              {
                key: "exchange",
                label: "Currency Exchange Rates",
                children: (
                  <>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6 mb-6">
                      <Card title="Current Active Rate" loading={activeLoading}>
                        {activeError ? (
                          <Empty description="Failed to load active rate" />
                        ) : activeRate ? (
                          <div className="flex flex-col gap-2">
                            <div>
                              <span className="font-semibold">Rate:</span>{" "}
                              {activeRate.rate}
                            </div>
                            <div>
                              <span className="font-semibold">Effective From:</span>{" "}
                              {dayjs(activeRate.effectiveFrom).format(
                                "YYYY-MM-DD HH:mm"
                              )}
                            </div>
                            <div>
                              <span className="font-semibold">Set By:</span>{" "}
                              {activeRate.setBy?.name}
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
                          validationSchema={exchangeRateValidationSchema}
                          onSubmit={async (values, { setErrors, resetForm }) => {
                            try {
                              // Validate date overlap before submission
                              const effectiveFrom = dayjs(values.effectiveFrom);
                              const overlapValidation =
                                validateExchangeRateDateOverlap(effectiveFrom);

                              if (!overlapValidation.isValid) {
                                toast.error(overlapValidation.message);
                                return;
                              }

                              const payload: ExchangeRateCreatePayload = {
                                rate: Number(values.rate),
                                effectiveFrom: dayjs(
                                  values.effectiveFrom
                                ).toISOString(),
                                fromCurrency: "USD",
                                toCurrency: "GHS",
                              };
                              await setActiveRate(payload);
                              toast.success("Exchange rate set successfully");
                              resetForm();
                            } catch (error: any) {
                              const fieldErrors = getServerValidationErrors(error);
                              if (fieldErrors) {
                                setErrors(fieldErrors);
                              } else {
                                toast.error(
                                  error.response?.data?.message ||
                                    "Failed to set exchange rate"
                                );
                              }
                            }
                          }}
                        >
                          {({ errors, touched, setFieldValue, isSubmitting }) => (
                            <FormikForm className="flex flex-col gap-4">
                              <Form.Item
                                label="Rate (USD → GHS)"
                                validateStatus={
                                  errors.rate && touched.rate ? "error" : ""
                                }
                                help={errors.rate && touched.rate ? errors.rate : ""}
                              >
                                <Field name="rate">
                                  {({ field }: any) => (
                                    <InputNumber
                                      {...field}
                                      min={0.0001}
                                      step={0.0001}
                                      style={{ width: "100%" }}
                                      onChange={(val) => setFieldValue("rate", val)}
                                      placeholder="e.g., 11.50"
                                    />
                                  )}
                                </Field>
                              </Form.Item>
                              <Form.Item
                                label="Effective From"
                                validateStatus={
                                  errors.effectiveFrom && touched.effectiveFrom
                                    ? "error"
                                    : ""
                                }
                                help={
                                  errors.effectiveFrom && touched.effectiveFrom
                                    ? errors.effectiveFrom
                                    : ""
                                }
                              >
                                <Field name="effectiveFrom">
                                  {({ field }: any) => (
                                    <DatePicker
                                      {...field}
                                      showTime
                                      style={{ width: "100%" }}
                                      onChange={(val) =>
                                        setFieldValue("effectiveFrom", val)
                                      }
                                    />
                                  )}
                                </Field>
                              </Form.Item>
                              <Button
                                type="primary"
                                htmlType="submit"
                                loading={setExchangePending || isSubmitting}
                                disabled={setExchangePending || isSubmitting}
                              >
                                Set Rate
                              </Button>
                            </FormikForm>
                          )}
                        </Formik>
                      </Card>
                    </div>

                    <Card title="Historical Exchange Rates">
                      <Table
                        columns={exchangeRateColumns}
                        dataSource={exchangeHistoryData?.data || []}
                        rowKey="id"
                        loading={exchangeHistoryLoading}
                        pagination={{
                          current: exchangePage,
                          pageSize: exchangeLimit,
                          total: exchangeHistoryData?.total || 0,
                          onChange: (p, ps) => {
                            setExchangePage(p);
                            setExchangeLimit(ps);
                          },
                        }}
                        locale={{
                          emptyText: (
                            <Empty description="No historical rates found" />
                          ),
                        }}
                        scroll={{ x: true }}
                        size="middle"
                      />
                    </Card>
                  </>
                ),
              },
              {
                key: "shipping",
                label: "Shipping Rates",
                children: (
                  <>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6 mb-6">
                      <Card
                        title="Active Shipping Rates"
                        loading={activeRatesLoading}
                      >
                        {activeRates && activeRates.length > 0 ? (
                          <div className="space-y-3">
                            {activeRates.map((rate) => (
                              <div
                                key={rate.id}
                                className="flex justify-between items-center py-2 border-b"
                              >
                                <div>
                                  <div className="font-medium">
                                    {rate.shippingMode === "SEA"
                                      ? "SEA (per CBM)"
                                      : `AIR - ${rate.airShippingType?.replace(
                                          "_",
                                          " "
                                        )} (per KG)`}
                                  </div>
                                  <div className="text-sm text-gray-500">
                                    Effective:{" "}
                                    {dayjs(rate.effectiveFrom).format("YYYY-MM-DD")}
                                  </div>
                                </div>
                                <div className="text-right">
                                  <div className="font-bold">${rate.ratePerUnit}</div>
                                  <div className="text-sm">{rate.currency}</div>
                                </div>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <Empty description="No active shipping rates" />
                        )}
                      </Card>

                      <Card title="Set New Shipping Rate">
                        <Formik
                          initialValues={{
                            shippingMode: ShippingMode.SEA,
                            airShippingType: undefined,
                            cityId: "",
                            ratePerUnit: "",
                            currency: "",
                            effectiveFrom: "",
                          }}
                          validationSchema={shippingRateValidationSchema}
                          onSubmit={async (values, { setErrors, resetForm }) => {
                            try {
                              // Validate date overlap before submission
                              const effectiveFrom = dayjs(values.effectiveFrom);
                              const overlapValidation =
                                validateShippingRateDateOverlap(
                                  effectiveFrom,
                                  values.shippingMode,
                                  values.airShippingType
                                );

                              if (!overlapValidation.isValid) {
                                toast.error(overlapValidation.message);
                                return;
                              }

                              const payload = {
                                shippingMode: values.shippingMode,
                                airShippingType: values.airShippingType,
                                cityId: values.cityId,
                                ratePerUnit: Number(values.ratePerUnit),
                                currency: values.currency,
                                effectiveFrom: dayjs(
                                  values.effectiveFrom
                                ).toISOString(),
                              };
                              await setShippingRate(payload);
                              toast.success("Shipping rate set successfully");
                              resetForm();
                            } catch (error: any) {
                              const fieldErrors = getServerValidationErrors(error);
                              if (fieldErrors) {
                                setErrors(fieldErrors);
                              } else {
                                toast.error(
                                  error.response?.data?.message ||
                                    "Failed to set shipping rate"
                                );
                              }
                            }
                          }}
                        >
                          {({
                            errors,
                            touched,
                            setFieldValue,
                            values,
                            isSubmitting,
                          }) => (
                            <FormikForm className="flex flex-col gap-4">
                              <Form.Item
                                label="Shipping Mode"
                                validateStatus={
                                  errors.shippingMode && touched.shippingMode
                                    ? "error"
                                    : ""
                                }
                                help={
                                  errors.shippingMode && touched.shippingMode
                                    ? errors.shippingMode
                                    : ""
                                }
                              >
                                <Field name="shippingMode">
                                  {({ field }: any) => (
                                    <Select
                                      style={{ width: "100%" }}
                                      onChange={(val) => {
                                        setFieldValue("shippingMode", val);
                                        if (val === ShippingMode.SEA) {
                                          setFieldValue("airShippingType", undefined);
                                        }
                                      }}
                                      value={values.shippingMode}
                                      placeholder="Select shipping mode"
                                    >
                                      <Select.Option value={ShippingMode.SEA}>
                                        SEA (per CBM)
                                      </Select.Option>
                                      <Select.Option value={ShippingMode.AIR}>
                                        AIR (per KG)
                                      </Select.Option>
                                    </Select>
                                  )}
                                </Field>
                              </Form.Item>

                              {values.shippingMode === ShippingMode.AIR && (
                                <Form.Item
                                  label="Air Shipping Type"
                                  validateStatus={
                                    errors.airShippingType && touched.airShippingType
                                      ? "error"
                                      : ""
                                  }
                                  help={
                                    errors.airShippingType && touched.airShippingType
                                      ? errors.airShippingType
                                      : ""
                                  }
                                >
                                  <Field name="airShippingType">
                                    {({ field }: any) => (
                                      <Select
                                        {...field}
                                        onChange={(val) =>
                                          setFieldValue("airShippingType", val)
                                        }
                                        style={{ width: "100%" }}
                                        placeholder="Select air shipping type"
                                      >
                                        <Select.Option
                                          value={AirShippingType.NORMAL_AIR}
                                        >
                                          Normal Air
                                        </Select.Option>
                                        <Select.Option
                                          value={AirShippingType.EXPRESS_AIR}
                                        >
                                          Express Air
                                        </Select.Option>
                                        <Select.Option
                                          value={AirShippingType.BATTERY_GOODS}
                                        >
                                          Battery Goods
                                        </Select.Option>
                                        <Select.Option value={AirShippingType.PHONES}>
                                          Phones
                                        </Select.Option>
                                      </Select>
                                    )}
                                  </Field>
                                </Form.Item>
                              )}

                              <Form.Item
                                label="City"
                                validateStatus={
                                  errors.cityId && touched.cityId ? "error" : ""
                                }
                                help={
                                  errors.cityId && touched.cityId ? errors.cityId : ""
                                }
                              >
                                <Field name="cityId">
                                  {({ field }: any) => (
                                    <Select
                                      style={{ width: "100%" }}
                                      placeholder="Select city"
                                      loading={citiesLoading}
                                      showSearch
                                      optionFilterProp="children"
                                      filterOption={(input, option) =>
                                        (option?.children as unknown as string)
                                          ?.toLowerCase()
                                          .includes(input.toLowerCase()) || false
                                      }
                                      onChange={(val) => setFieldValue("cityId", val)}
                                    >
                                      {citiesData?.data?.map((city: City) => (
                                        <Select.Option key={city.id} value={city.id}>
                                          {city.name}, {city.country}
                                        </Select.Option>
                                      ))}
                                    </Select>
                                  )}
                                </Field>
                              </Form.Item>
                              <Form.Item
                                label="Currency"
                                required
                                validateStatus={
                                  errors.currency && touched.currency ? "error" : ""
                                }
                                help={
                                  errors.currency && touched.currency
                                    ? errors.currency
                                    : ""
                                }
                              >
                                <Field name="currency">
                                  {({ field }: any) => (
                                    <Select
                                      {...field}
                                      style={{ width: "100%" }}
                                      placeholder="Select currency"
                                      onChange={(val) =>
                                        setFieldValue("currency", val)
                                      }
                                    >
                                      <Select.Option value="GHS">GHS</Select.Option>
                                      <Select.Option value="USD">USD</Select.Option>
                                    </Select>
                                  )}
                                </Field>
                              </Form.Item>

                              <Form.Item
                                label={`Rate per Unit (${
                                  values.shippingMode === ShippingMode.SEA
                                    ? "per CBM"
                                    : "per KG"
                                })`}
                                validateStatus={
                                  errors.ratePerUnit && touched.ratePerUnit
                                    ? "error"
                                    : ""
                                }
                                help={
                                  errors.ratePerUnit && touched.ratePerUnit
                                    ? errors.ratePerUnit
                                    : ""
                                }
                              >
                                <Field name="ratePerUnit">
                                  {({ field }: any) => (
                                    <InputNumber
                                      {...field}
                                      min={0.01}
                                      step={0.01}
                                      style={{ width: "100%" }}
                                      onChange={(val) =>
                                        setFieldValue("ratePerUnit", val)
                                      }
                                      placeholder="e.g., 5.00"
                                    />
                                  )}
                                </Field>
                              </Form.Item>

                              <Form.Item
                                label="Effective From"
                                validateStatus={
                                  errors.effectiveFrom && touched.effectiveFrom
                                    ? "error"
                                    : ""
                                }
                                help={
                                  errors.effectiveFrom && touched.effectiveFrom
                                    ? errors.effectiveFrom
                                    : ""
                                }
                              >
                                <Field name="effectiveFrom">
                                  {({ field }: any) => (
                                    <DatePicker
                                      {...field}
                                      showTime
                                      style={{ width: "100%" }}
                                      onChange={(val) =>
                                        setFieldValue("effectiveFrom", val)
                                      }
                                    />
                                  )}
                                </Field>
                              </Form.Item>

                              <Button
                                type="primary"
                                htmlType="submit"
                                loading={setShippingPending || isSubmitting}
                                disabled={setShippingPending || isSubmitting}
                              >
                                Set Rate
                              </Button>
                            </FormikForm>
                          )}
                        </Formik>
                      </Card>
                    </div>

                    <Card title="Shipping Rate History">
                      <Table
                        columns={shippingRateColumns}
                        dataSource={shippingHistoryData?.data || []}
                        rowKey="id"
                        loading={shippingHistoryLoading}
                        pagination={{
                          current: shippingPage,
                          pageSize: shippingLimit,
                          total: shippingHistoryData?.total || 0,
                          onChange: (p, ps) => {
                            setShippingPage(p);
                            setShippingLimit(ps);
                          },
                        }}
                        locale={{
                          emptyText: (
                            <Empty description="No shipping rate history found" />
                          ),
                        }}
                        scroll={{ x: true }}
                        size="middle"
                      />
                    </Card>
                  </>
                ),
              },
            ]}
          />
        </div>
      </AppLayout>
    </AuthGuard>
  );
}
