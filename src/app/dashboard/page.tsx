"use client";

import { useState } from "react";
import { Card, Button, Table, Skeleton, Empty } from "antd";
import { AppLayout } from "@/components/AppLayout";
import { AuthGuard } from "@/components/AuthGuard";
import { useDashboard } from "@/hooks/useDashboard";
import { columns as invoiceColumns } from "@/app/dashboard/invoices.columns";
import { columns as agingPackageColumns } from "@/app/dashboard/aging-packages.columns";
import { DashboardFilters } from "@/types/dashboard";
import { DatePicker, Select } from "antd";
import { Formik, Form, Field } from "formik";
import * as Yup from "yup";
import Link from "next/link";
import { Pie, Line } from "@ant-design/charts";
import {
  ArrowRightOutlined,
  ContainerOutlined,
  DollarOutlined,
  FileTextOutlined,
  InboxOutlined,
  TeamOutlined,
} from "@ant-design/icons";
import type { Dayjs } from "dayjs";
import { toast } from "sonner";

const statusOptions = [
  { value: "RECEIVED", label: "Received" },
  { value: "IN_TRANSIT", label: "In Transit" },
  { value: "DELIVERED", label: "Delivered" },
  { value: "PAID", label: "Paid" },
  { value: "PENDING", label: "Pending" },
];

const FilterSchema = Yup.object().shape({
  dateRange: Yup.array()
    .of(Yup.date())
    .nullable()
    .test("valid-range", "Select a valid date range", (value) => {
      if (!value || value.length !== 2) return true;
      return value[0] && value[1] && value[0] <= value[1];
    }),
  status: Yup.string().nullable(),
});

export default function DashboardPage() {
  const [filters, setFilters] = useState<DashboardFilters>({});
  const { kpis, charts, tables, isLoading, error } = useDashboard(filters);

  // Error notifications
  if (
    error.kpis ||
    error.packagesByStatus ||
    error.packagesByMonth ||
    error.revenueTrend ||
    error.topCustomers ||
    error.recentInvoices ||
    error.agingPackages
  ) {
    toast.error("Some dashboard data failed to load. Please try again.");
  }

  // KPI Cards
  const kpiItems = [
    {
      title: "Total Customers",
      value: 0,
      icon: <TeamOutlined />,
      caption: "",
      loading: isLoading.kpis,
    },
    {
      title: "Total Packages",
      value: 0,
      icon: <InboxOutlined />,
      caption: `SEA: ${kpis?.seaTotal ?? 0} | AIR: ${kpis?.airTotal ?? 0}`,
      loading: isLoading.kpis,
    },
    {
      title: "Active Containers",
      value: 0,
      icon: <ContainerOutlined />,
      caption: "",
      loading: isLoading.kpis,
    },
    {
      title: "Outstanding Invoices",
      value: kpis?.outstandingInvoicesCount ?? 0,
      icon: <DollarOutlined />,
      caption: kpis?.outstandingInvoicesAmount
        ? `GHS ${kpis.outstandingInvoicesAmount.toLocaleString()}`
        : "",
      loading: isLoading.kpis,
    },
  ];

  // Quick Links
  const quickLinks = [
    {
      href: "/package-intake",
      label: "Package Intake",
      icon: <InboxOutlined />,
    },
    { href: "/payments", label: "Payments", icon: <DollarOutlined /> },
    { href: "/containers", label: "Containers", icon: <ContainerOutlined /> },
    { href: "/reports", label: "Reports", icon: <FileTextOutlined /> },
  ];

  return (
    <AuthGuard>
      <AppLayout>
        <div className="px-4 md:px-6 lg:px-8 py-4 mx-auto space-y-4 flex-1">
          {/* Header row: title + filters */}
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
            <h1 className="text-2xl font-bold">Dashboard</h1>
            <Formik
              initialValues={{
                dateRange: null as [Dayjs | null, Dayjs | null] | null,
                status: "",
              }}
              validationSchema={FilterSchema}
              onSubmit={(values, { setSubmitting }) => {
                setFilters({
                  dateFrom: values.dateRange?.[0]?.toISOString(),
                  dateTo: values.dateRange?.[1]?.toISOString(),
                  status: values.status || undefined,
                });
                setSubmitting(false);
              }}
              onReset={() => setFilters({})}
            >
              {({ values, errors, touched, setFieldValue, isSubmitting }) => (
                <Form className="flex flex-row gap-2 items-center">
                  <div>
                    <Field name="dateRange">
                      {({
                        field,
                      }: {
                        field: { value: Dayjs[] | null; name: string };
                      }) => (
                        <DatePicker.RangePicker
                          {...field}
                          value={values.dateRange}
                          onChange={(
                            dates: [Dayjs | null, Dayjs | null] | null
                          ) => setFieldValue("dateRange", dates)}
                          allowClear
                          size="middle"
                        />
                      )}
                    </Field>
                  </div>
                  <div>
                    <Field name="status">
                      {({
                        field,
                      }: {
                        field: { value: string; name: string };
                      }) => (
                        <Select
                          {...field}
                          value={values.status}
                          onChange={(val) => setFieldValue("status", val)}
                          allowClear
                          placeholder="Status"
                          options={statusOptions}
                          style={{ minWidth: 120 }}
                          size="middle"
                        />
                      )}
                    </Field>
                  </div>
                  <Button
                    type="primary"
                    htmlType="submit"
                    loading={isSubmitting}
                  >
                    Filter
                  </Button>
                  <Button htmlType="reset" disabled={isSubmitting}>
                    Reset
                  </Button>
                  {/* Error display */}
                  <div>
                    {errors.dateRange && touched.dateRange && (
                      <span className="text-red-500 text-xs">
                        {errors.dateRange}
                      </span>
                    )}
                  </div>
                </Form>
              )}
            </Formik>
          </div>

          {/* KPI grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {kpiItems.map((kpi, idx) => (
              <Card key={kpi.title} className="rounded-2xl shadow-sm">
                <div className="flex items-center gap-3">
                  <div className="text-2xl">{kpi.icon}</div>
                  <div>
                    <div className="text-lg font-semibold">{kpi.title}</div>
                    {kpi.loading ? (
                      <Skeleton.Input active size="small" />
                    ) : (
                      <div className="text-2xl font-bold">{kpi.value}</div>
                    )}
                    <div className="text-xs text-gray-500">{kpi.caption}</div>
                  </div>
                </div>
                {/* Quick link button */}
                {quickLinks[idx] && (
                  <Link href={quickLinks[idx].href} passHref legacyBehavior>
                    <Button
                      type="link"
                      icon={quickLinks[idx].icon}
                      className="mt-2"
                      size="small"
                    >
                      {quickLinks[idx].label}
                      <ArrowRightOutlined />
                    </Button>
                  </Link>
                )}
              </Card>
            ))}
          </div>

          {/* Charts grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Card className="rounded-2xl shadow-sm" title="Packages by Status">
              {isLoading.packagesByStatus ? (
                <Skeleton active />
              ) : charts.packagesByStatus && charts.packagesByStatus.length ? (
                <Pie
                  data={charts.packagesByStatus}
                  angleField="count"
                  colorField="status"
                  legend={{ position: "bottom" }}
                  label={{ type: "outer", content: "{name}: {value}" }}
                  height={250}
                />
              ) : (
                <Empty />
              )}
            </Card>
            <Card className="rounded-2xl shadow-sm" title="Packages by Month">
              {isLoading.packagesByMonth ? (
                <Skeleton active />
              ) : charts.packagesByMonth && charts.packagesByMonth.length ? (
                <Line
                  data={charts.packagesByMonth}
                  xField="x"
                  yField="y"
                  height={250}
                  point={{ size: 4 }}
                  legend={{ position: "bottom" }}
                />
              ) : (
                <Empty />
              )}
            </Card>
            <Card className="rounded-2xl shadow-sm" title="Revenue Trend">
              {isLoading.revenueTrend ? (
                <Skeleton active />
              ) : charts.revenueTrend && charts.revenueTrend.length ? (
                <Line
                  data={charts.revenueTrend}
                  xField="x"
                  yField="y"
                  height={250}
                  point={{ size: 4 }}
                  legend={{ position: "bottom" }}
                />
              ) : (
                <Empty />
              )}
            </Card>
            <Card
              className="rounded-2xl shadow-sm"
              title="Top Customers by Spend/Packages"
            >
              {isLoading.topCustomers ? (
                <Skeleton active />
              ) : charts.topCustomers && charts.topCustomers.length ? (
                <Line
                  data={charts.topCustomers}
                  xField="x"
                  yField="y"
                  height={250}
                  point={{ size: 4 }}
                  legend={{ position: "bottom" }}
                />
              ) : (
                <Empty />
              )}
            </Card>
          </div>

          {/* Tables/Lists section */}
          <div className="space-y-4">
            <Card className="rounded-2xl shadow-sm" title="Recent Invoices">
              <Table
                columns={invoiceColumns}
                dataSource={tables.recentInvoices?.rows}
                rowKey="id"
                loading={isLoading.recentInvoices}
                pagination={{ pageSize: 10 }}
                locale={{ emptyText: <Empty /> }}
                scroll={{ x: true }}
                size="middle"
              />
            </Card>
            <Card
              className="rounded-2xl shadow-sm"
              title="Aging Packages (Top 10)"
            >
              <Table
                columns={agingPackageColumns}
                dataSource={tables.agingPackages?.rows}
                rowKey="id"
                loading={isLoading.agingPackages}
                pagination={false}
                locale={{ emptyText: <Empty /> }}
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
