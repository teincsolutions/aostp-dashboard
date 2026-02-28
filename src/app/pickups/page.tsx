"use client";

import React, { useState } from "react";
import {
  Table,
  Input,
  Select,
  Button,
  Card,
  Row,
  Col,
  Tag,
  Space,
  Modal,
  Image,
  Typography,
  Descriptions,
  DatePicker,
  Divider,
  Checkbox,
  Statistic,
  Tooltip,
} from "antd";
import {
  SearchOutlined,
  FilterOutlined,
  EyeOutlined,
  DownloadOutlined,
  ReloadOutlined,
} from "@ant-design/icons";
import type { RangePickerProps } from "antd/es/date-picker";
import type { ColumnsType } from "antd/es/table";
import { AppLayout } from "@/components/AppLayout";
import { AuthGuard } from "@/components/AuthGuard";
import { CustomerSearchSelect } from "@/components/CustomerSearchSelect";
import { useAllPackageDeliveries } from "@/hooks/usePackageDelivery";
import { useWarehouses } from "@/hooks/useWarehouse";
import { PackageDelivery, GetPackageDeliveriesParams } from "@/types/package";
import { Role } from "@/types/user";
import dayjs from "dayjs";
import { toast } from "sonner";

const { RangePicker } = DatePicker;
const { Title, Text } = Typography;

export default function PickupsListPage() {
  // Pagination
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);

  // Filters
  const [searchDeliveryId, setSearchDeliveryId] = useState("");
  const [searchTrackingCode, setSearchTrackingCode] = useState("");
  const [searchReceiverName, setSearchReceiverName] = useState("");
  const [filterCustomerId, setFilterCustomerId] = useState<string | undefined>();
  const [filterWarehouseId, setFilterWarehouseId] = useState<string | undefined>();
  const [dateRange, setDateRange] = useState<[string, string] | undefined>();

  // Modal
  const [detailsVisible, setDetailsVisible] = useState(false);
  const [selectedDelivery, setSelectedDelivery] = useState<PackageDelivery | null>(null);

  // Export
  const [exportModalVisible, setExportModalVisible] = useState(false);
  const [selectedExportColumns, setSelectedExportColumns] = useState<string[]>([
    "deliveryId",
    "customer",
    "invoice",
    "trackingCode",
    "quantity",
    "receiverName",
    "warehouse",
    "releaseDate",
  ]);

  const params: GetPackageDeliveriesParams = {
    page,
    limit: pageSize,
    deliveryId: searchDeliveryId || undefined,
    trackingCode: searchTrackingCode || undefined,
    receiverName: searchReceiverName || undefined,
    customerId: filterCustomerId || undefined,
    warehouseId: filterWarehouseId || undefined,
    dateFrom: dateRange?.[0] || undefined,
    dateTo: dateRange?.[1] || undefined,
    sortBy: "releaseDate",
    sortOrder: "desc",
  };

  const { data, isLoading, refetch } = useAllPackageDeliveries(params);
  const { data: warehousesData } = useWarehouses({ limit: 100 });

  const deliveries = data?.data || [];
  const total = data?.meta?.total || 0;

  const handleDateChange: RangePickerProps["onChange"] = (_, dateStrings) => {
    if (dateStrings[0] && dateStrings[1]) {
      setDateRange([dateStrings[0], dateStrings[1]]);
    } else {
      setDateRange(undefined);
    }
    setPage(1);
  };

  const handleViewDetails = (record: PackageDelivery) => {
    setSelectedDelivery(record);
    setDetailsVisible(true);
  };

  const handleClearFilters = () => {
    setSearchDeliveryId("");
    setSearchTrackingCode("");
    setSearchReceiverName("");
    setFilterCustomerId(undefined);
    setFilterWarehouseId(undefined);
    setDateRange(undefined);
    setPage(1);
  };

  // Export helpers
  const exportColumnOptions = [
    { label: "Pickup ID", value: "deliveryId" },
    { label: "Customer", value: "customer" },
    { label: "Invoice", value: "invoice" },
    { label: "Tracking Code", value: "trackingCode" },
    { label: "Description", value: "description" },
    { label: "Quantity", value: "quantity" },
    { label: "Receiver Name", value: "receiverName" },
    { label: "Warehouse", value: "warehouse" },
    { label: "Container", value: "container" },
    { label: "Release Date", value: "releaseDate" },
    { label: "Notes", value: "notes" },
  ];

  const buildExportData = () =>
    deliveries.map((d) => {
      const row: Record<string, string | number> = {};
      selectedExportColumns.forEach((col) => {
        switch (col) {
          case "deliveryId":
            row["Pickup ID"] = d.deliveryId;
            break;
          case "customer":
            row["Customer"] = d.customer
              ? `${d.customer.customerCode} - ${d.customer.firstName} ${d.customer.lastName || ""}`
              : "N/A";
            break;
          case "invoice":
            row["Invoice"] = d.invoice?.invoiceNumber || "N/A";
            break;
          case "trackingCode":
            row["Tracking Code"] = d.package?.trackingCode || "N/A";
            break;
          case "description":
            row["Description"] = d.package?.description || "N/A";
            break;
          case "quantity":
            row["Quantity"] = d.quantity;
            break;
          case "receiverName":
            row["Receiver Name"] = d.receiverName || "N/A";
            break;
          case "warehouse":
            row["Warehouse"] = d.package?.warehouse?.name || "N/A";
            break;
          case "container":
            row["Container"] =
              d.invoice?.packingList?.container?.containerNumber || "N/A";
            break;
          case "releaseDate":
            row["Release Date"] = dayjs(d.releaseDate).format("DD MMM YYYY HH:mm");
            break;
          case "notes":
            row["Notes"] = d.notes || "";
            break;
        }
      });
      return row;
    });

  const exportToCSV = () => {
    const exportData = buildExportData();
    if (!exportData.length) { toast.error("No data to export"); return; }
    const headers = Object.keys(exportData[0]);
    const csv = [headers.join(","), ...exportData.map((r) => headers.map((h) => `"${r[h] ?? ""}"`).join(","))].join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `pickups-${dayjs().format("YYYY-MM-DD")}.csv`;
    link.click();
    setExportModalVisible(false);
    toast.success("Exported as CSV");
  };

  const exportToExcel = () => {
    const exportData = buildExportData();
    if (!exportData.length) { toast.error("No data to export"); return; }
    const headers = Object.keys(exportData[0]);
    const csv = [headers.join(","), ...exportData.map((r) => headers.map((h) => `"${r[h] ?? ""}"`).join(","))].join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `pickups-${dayjs().format("YYYY-MM-DD")}.xlsx`;
    link.click();
    setExportModalVisible(false);
    toast.success("Exported as Excel");
  };

  const exportToPDF = () => {
    const exportData = buildExportData();
    if (!exportData.length) { toast.error("No data to export"); return; }
    const headers = Object.keys(exportData[0]);
    const html = `<!DOCTYPE html><html><head><title>Pickups</title><style>body{font-family:Arial,sans-serif;margin:20px}h1{text-align:center}table{width:100%;border-collapse:collapse;font-size:11px}th,td{border:1px solid #ddd;padding:6px;text-align:left}th{background:#1890ff;color:#fff}tr:nth-child(even){background:#f5f5f5}</style></head><body><h1>Pickups List — ${dayjs().format("DD MMM YYYY")}</h1><table><thead><tr>${headers.map((h) => `<th>${h}</th>`).join("")}</tr></thead><tbody>${exportData.map((r) => `<tr>${headers.map((h) => `<td>${r[h] ?? ""}</td>`).join("")}</tr>`).join("")}</tbody></table></body></html>`;
    const w = window.open("", "_blank");
    if (w) { w.document.write(html); w.document.close(); w.print(); }
    setExportModalVisible(false);
  };

  // Table columns
  const columns: ColumnsType<PackageDelivery> = [
    {
      title: "Pickup ID",
      dataIndex: "deliveryId",
      key: "deliveryId",
      width: 150,
      fixed: "left",
    },
    {
      title: "Customer",
      key: "customer",
      width: 200,
      ellipsis: true,
      render: (_, r) =>
        r.customer
          ? `${r.customer.customerCode} — ${r.customer.firstName} ${r.customer.lastName || ""}`
          : "N/A",
    },
    {
      title: "Invoice",
      key: "invoice",
      width: 140,
      render: (_, r) => r.invoice?.invoiceNumber || "N/A",
    },
    {
      title: "Tracking Code",
      key: "trackingCode",
      width: 160,
      render: (_, r) => r.package?.trackingCode || "N/A",
    },
    {
      title: "Description",
      key: "description",
      width: 200,
      ellipsis: true,
      render: (_, r) => r.package?.description || "N/A",
    },
    {
      title: "Qty",
      dataIndex: "quantity",
      key: "quantity",
      width: 70,
      align: "center",
    },
    {
      title: "Receiver",
      dataIndex: "receiverName",
      key: "receiverName",
      width: 150,
      render: (v: string) => v || "N/A",
    },
    {
      title: "Warehouse",
      key: "warehouse",
      width: 130,
      render: (_, r) => r.package?.warehouse?.name || "N/A",
    },
    {
      title: "Container",
      key: "container",
      width: 140,
      render: (_, r) =>
        r.invoice?.packingList?.container?.containerNumber || "N/A",
    },
    {
      title: "Photos",
      key: "photos",
      width: 90,
      render: (_, r) => {
        if (!r.photos?.length) return <Tag>None</Tag>;
        return (
          <Tag color="blue" icon={<EyeOutlined />}>
            {r.photos.length}
          </Tag>
        );
      },
    },
    {
      title: "Release Date",
      dataIndex: "releaseDate",
      key: "releaseDate",
      width: 160,
      render: (v: string) => (v ? dayjs(v).format("DD MMM YYYY HH:mm") : "N/A"),
      sorter: (a, b) =>
        new Date(a.releaseDate).getTime() - new Date(b.releaseDate).getTime(),
    },
    {
      title: "Notes",
      dataIndex: "notes",
      key: "notes",
      width: 180,
      ellipsis: true,
      render: (v: string) => v || "—",
    },
    {
      title: "Actions",
      key: "actions",
      width: 100,
      fixed: "right",
      render: (_, r) => (
        <Tooltip title="View Details">
          <Button
            type="link"
            icon={<EyeOutlined />}
            onClick={() => handleViewDetails(r)}
          >
            Details
          </Button>
        </Tooltip>
      ),
    },
  ];

  return (
    <AuthGuard requiredRoles={[Role.SUPER_ADMIN, Role.OPERATIONS_CLERK, Role.FINANCE_MANAGER]}>
      <AppLayout>
        <div className="p-6">
          {/* Header */}
          <div className="flex flex-col gap-4 md:flex-row md:justify-between md:items-center mb-6">
            <Title level={2} className="!mb-0">
              Pickups List
            </Title>
            <Space>
              <Button icon={<ReloadOutlined />} onClick={() => refetch()}>
                Refresh
              </Button>
              <Button
                icon={<DownloadOutlined />}
                onClick={() => setExportModalVisible(true)}
              >
                Export
              </Button>
            </Space>
          </div>

          {/* Stats */}
          <Row gutter={[16, 16]} className="mb-6">
            <Col xs={24} sm={12} md={6}>
              <Card>
                <Statistic title="Total Pickups" value={total} />
              </Card>
            </Col>
            <Col xs={24} sm={12} md={6}>
              <Card>
                <Statistic
                  title="On This Page"
                  value={deliveries.length}
                />
              </Card>
            </Col>
          </Row>

          {/* Filters */}
          <Card className="mb-6">
            <Row gutter={[12, 12]}>
              <Col xs={24} sm={12} md={6}>
                <Input
                  placeholder="Search Pickup ID"
                  prefix={<SearchOutlined />}
                  value={searchDeliveryId}
                  onChange={(e) => {
                    setSearchDeliveryId(e.target.value);
                    setPage(1);
                  }}
                  allowClear
                />
              </Col>
              <Col xs={24} sm={12} md={6}>
                <Input
                  placeholder="Search Tracking Code"
                  prefix={<SearchOutlined />}
                  value={searchTrackingCode}
                  onChange={(e) => {
                    setSearchTrackingCode(e.target.value);
                    setPage(1);
                  }}
                  allowClear
                />
              </Col>
              <Col xs={24} sm={12} md={6}>
                <Input
                  placeholder="Search Receiver Name"
                  prefix={<SearchOutlined />}
                  value={searchReceiverName}
                  onChange={(e) => {
                    setSearchReceiverName(e.target.value);
                    setPage(1);
                  }}
                  allowClear
                />
              </Col>
              <Col xs={24} sm={12} md={6}>
                <CustomerSearchSelect
                  value={filterCustomerId}
                  onChange={(v) => {
                    setFilterCustomerId(v || undefined);
                    setPage(1);
                  }}
                  placeholder="Filter by Customer"
                />
              </Col>
              <Col xs={24} sm={12} md={6}>
                <Select
                  placeholder="Filter by Warehouse"
                  style={{ width: "100%" }}
                  value={filterWarehouseId}
                  onChange={(v) => {
                    setFilterWarehouseId(v || undefined);
                    setPage(1);
                  }}
                  allowClear
                  options={warehousesData?.data?.map((w) => ({
                    label: w.name,
                    value: w.id,
                  }))}
                />
              </Col>
              <Col xs={24} sm={12} md={8}>
                <RangePicker
                  style={{ width: "100%" }}
                  placeholder={["Release From", "Release To"]}
                  onChange={handleDateChange}
                  value={
                    dateRange
                      ? [dayjs(dateRange[0]), dayjs(dateRange[1])]
                      : null
                  }
                />
              </Col>
              <Col xs={24} sm={12} md={4}>
                <Button
                  icon={<FilterOutlined />}
                  onClick={handleClearFilters}
                  block
                >
                  Clear Filters
                </Button>
              </Col>
            </Row>
          </Card>

          {/* Table */}
          <Card>
            <Table<PackageDelivery>
              columns={columns}
              dataSource={deliveries}
              rowKey="id"
              loading={isLoading}
              scroll={{ x: 1800 }}
              size="middle"
              pagination={{
                current: page,
                pageSize,
                total,
                showSizeChanger: true,
                showQuickJumper: true,
                pageSizeOptions: ["10", "20", "50", "100"],
                showTotal: (t, range) =>
                  `${range[0]}-${range[1]} of ${t} pickups`,
                onChange: (p, size) => {
                  setPage(p);
                  setPageSize(size);
                },
              }}
            />
          </Card>
        </div>

        {/* Details Modal */}
        <Modal
          open={detailsVisible}
          onCancel={() => {
            setDetailsVisible(false);
            setSelectedDelivery(null);
          }}
          footer={[
            <Button
              key="close"
              onClick={() => {
                setDetailsVisible(false);
                setSelectedDelivery(null);
              }}
            >
              Close
            </Button>,
          ]}
          title={
            selectedDelivery ? (
              <Space>
                <span>Pickup Details</span>
                <Tag color="blue">{selectedDelivery.deliveryId}</Tag>
              </Space>
            ) : (
              "Pickup Details"
            )
          }
          width={800}
          destroyOnClose
        >
          {selectedDelivery && (
            <Space direction="vertical" size="middle" style={{ width: "100%" }}>
              <Descriptions bordered column={2} size="small">
                <Descriptions.Item label="Pickup ID" span={2}>
                  <Text strong>{selectedDelivery.deliveryId}</Text>
                </Descriptions.Item>
                <Descriptions.Item label="Release Date">
                  {dayjs(selectedDelivery.releaseDate).format("DD MMM YYYY HH:mm")}
                </Descriptions.Item>
                <Descriptions.Item label="Quantity">
                  {selectedDelivery.quantity}
                </Descriptions.Item>
                <Descriptions.Item label="Receiver Name">
                  {selectedDelivery.receiverName || "N/A"}
                </Descriptions.Item>
                <Descriptions.Item label="Warehouse">
                  {selectedDelivery.package?.warehouse?.name || "N/A"}
                </Descriptions.Item>
              </Descriptions>

              <Divider orientation="left" plain>
                Customer &amp; Invoice
              </Divider>
              <Descriptions bordered column={2} size="small">
                <Descriptions.Item label="Customer Code">
                  {selectedDelivery.customer?.customerCode || "N/A"}
                </Descriptions.Item>
                <Descriptions.Item label="Customer Name">
                  {selectedDelivery.customer
                    ? `${selectedDelivery.customer.firstName} ${selectedDelivery.customer.lastName || ""}`
                    : "N/A"}
                </Descriptions.Item>
                <Descriptions.Item label="Phone">
                  {selectedDelivery.customer?.phoneNumber || "N/A"}
                </Descriptions.Item>
                <Descriptions.Item label="Invoice">
                  {selectedDelivery.invoice?.invoiceNumber || "N/A"}
                </Descriptions.Item>
              </Descriptions>

              <Divider orientation="left" plain>
                Package
              </Divider>
              <Descriptions bordered column={2} size="small">
                <Descriptions.Item label="Tracking Code">
                  {selectedDelivery.package?.trackingCode || "N/A"}
                </Descriptions.Item>
                <Descriptions.Item label="Description">
                  {selectedDelivery.package?.description || "N/A"}
                </Descriptions.Item>
                <Descriptions.Item label="Container">
                  {selectedDelivery.invoice?.packingList?.container
                    ?.containerNumber || "N/A"}
                </Descriptions.Item>
                <Descriptions.Item label="Notes">
                  {selectedDelivery.notes || "—"}
                </Descriptions.Item>
              </Descriptions>

              {selectedDelivery.photos?.length > 0 && (
                <>
                  <Divider orientation="left" plain>
                    Photos
                  </Divider>
                  <Image.PreviewGroup>
                    <Space wrap>
                      {selectedDelivery.photos.map((url, i) => (
                        <Image
                          key={i}
                          src={url}
                          width={120}
                          height={100}
                          style={{ objectFit: "cover", borderRadius: 4 }}
                          alt={`Photo ${i + 1}`}
                        />
                      ))}
                    </Space>
                  </Image.PreviewGroup>
                </>
              )}
            </Space>
          )}
        </Modal>

        {/* Export Modal */}
        <Modal
          title="Export Pickups"
          open={exportModalVisible}
          onCancel={() => setExportModalVisible(false)}
          footer={null}
          width={520}
        >
          <Space direction="vertical" size="middle" style={{ width: "100%" }}>
            <div>
              <Text strong className="block mb-2">
                Select Columns to Export:
              </Text>
              <Checkbox.Group
                options={exportColumnOptions}
                value={selectedExportColumns}
                onChange={(v) => setSelectedExportColumns(v as string[])}
                className="flex flex-col gap-1"
              />
            </div>
            <Divider />
            <Space direction="vertical" style={{ width: "100%" }}>
              <Button
                block
                icon={<DownloadOutlined />}
                onClick={exportToCSV}
                disabled={selectedExportColumns.length === 0}
              >
                Export as CSV
              </Button>
              <Button
                block
                icon={<DownloadOutlined />}
                onClick={exportToExcel}
                disabled={selectedExportColumns.length === 0}
              >
                Export as Excel
              </Button>
              <Button
                block
                icon={<DownloadOutlined />}
                onClick={exportToPDF}
                disabled={selectedExportColumns.length === 0}
              >
                Export as PDF (Print)
              </Button>
            </Space>
            <Text type="secondary" className="text-xs">
              * {deliveries.length} rows on current page will be exported
            </Text>
          </Space>
        </Modal>
      </AppLayout>
    </AuthGuard>
  );
}
