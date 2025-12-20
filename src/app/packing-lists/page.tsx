"use client";

import React, { useState } from "react";
import {
  Table,
  Button,
  Input,
  Select,
  Space,
  Modal,
  Form,
  Card,
  Row,
  Col,
  Statistic,
  Drawer,
  DatePicker,
  Divider,
  Descriptions,
  Tag,
  Typography,
  Dropdown,
  Checkbox,
} from "antd";
import { toast } from "sonner";
import {
  PlusOutlined,
  SearchOutlined,
  FilterOutlined,
  FileTextOutlined,
  BoxPlotOutlined,
  BarChartOutlined,
  BoxPlotOutlined as PackageIcon,
  DownloadOutlined,
  DownOutlined,
} from "@ant-design/icons";
import { PackageAssignmentModal } from "@/components/PackageAssignmentModal";
import { AppLayout } from "@/components/AppLayout";
import { AuthGuard } from "@/components/AuthGuard";
import {
  usePackingLists,
  usePackingListMutations,
  usePackingListSummary,
  usePackingList,
} from "@/hooks/usePackingLists";
import { useActiveContainers } from "@/hooks/useContainers";
import {
  PackingListUpdatePayload,
  PackingListStatus,
  PackingList,
  ExportFormat,
  CustomerPackingSummary,
} from "@/types/packingList";
import { getPackingListColumns, packingListStatusColors } from "./columns";
import { ShippingMode } from "@/types/package";
import type { Dayjs } from "dayjs";
import type { RangePickerProps } from "antd/es/date-picker";
import { Role } from "@/types/user";
import dayjs from "dayjs";
import { useCities } from "@/hooks/useCities";

const { Option } = Select;
const { RangePicker } = DatePicker;
const { Title, Text } = Typography;

export default function PackingListsPage() {
  // State for UI
  const [searchText, setSearchText] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [dateRange, setDateRange] = useState<
    [Dayjs | null, Dayjs | null] | null
  >(null);
  const [shipmentModeFilter, setShipmentModeFilter] = useState<string>("");
  const [isEditModalVisible, setIsEditModalVisible] = useState(false);
  const [isDetailsDrawerVisible, setIsDetailsDrawerVisible] = useState(false);
  const [isPackageAssignmentModalVisible, setIsPackageAssignmentModalVisible] =
    useState(false);
  const [editingPackingList, setEditingPackingList] =
    useState<PackingList | null>(null);
  const [detailsPackingList, setDetailsPackingList] =
    useState<PackingList | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [isExportModalVisible, setIsExportModalVisible] = useState(false);
  const [selectedColumns, setSelectedColumns] = useState<string[]>([
    "name",
    "loadingDate",
    "eta",
    "destinationCity",
    "container",
    "totalPackages",
    "status",
    "createdAt",
  ]);

  // Forms
  const [editForm] = Form.useForm();

  // React Query hooks
  const { data: packingLists, isLoading } = usePackingLists({
    page: currentPage,
    limit: pageSize,
    search: searchText,
    status: statusFilter ? (statusFilter as PackingListStatus) : undefined,
    dateFrom:
      dateRange && dateRange[0] ? dateRange[0].format("YYYY-MM-DD") : undefined,
    dateTo:
      dateRange && dateRange[1] ? dateRange[1].format("YYYY-MM-DD") : undefined,
  });

  const { data: activeContainers = [] } = useActiveContainers();

  const { data: citiesData } = useCities({ limit: 100 });
  const cities = citiesData?.data || [];

  const getCityName = (cityId: string) => {
    const city = cities.find((c) => c.id === cityId);
    return city ? `${city.name}, ${city.country}` : cityId;
  };

  const {
    updatePackingList,
    deletePackingList,
    exportPackingList,
    isUpdating,
    isDeleting,
  } = usePackingListMutations();

  const { data: packingListDetails, refetch: refetchPackingListDetails } =
    usePackingList(detailsPackingList?.id || "");
  const { data: packingListSummary, refetch: refetchPackingListSummary } =
    usePackingListSummary(detailsPackingList?.id || "");

  // Use all active containers
  const filteredContainers = activeContainers;

  // Handlers
  const handleSearch = (value: string) => {
    setSearchText(value);
    setCurrentPage(1);
  };

  const handleStatusFilter = (value: string) => {
    setStatusFilter(value);
    setCurrentPage(1);
  };

  const handleShipmentModeFilter = (value: string) => {
    setShipmentModeFilter(value);
    setCurrentPage(1);
  };

  const handleDateRangeChange: RangePickerProps["onChange"] = (dates) => {
    setDateRange(dates);
    setCurrentPage(1);
  };

  const handleEditPackingList = (packingList: PackingList) => {
    setEditingPackingList(packingList);
    editForm.setFieldsValue({
      name: packingList.name,
      containerId: packingList.containerId,
      loadingDate: packingList.loadingDate
        ? dayjs(packingList.loadingDate)
        : null,
      destinationCity: packingList.destinationCity,
      eta: packingList.eta ? dayjs(packingList.eta) : null,
      notes: packingList.notes,
    });
    setIsEditModalVisible(true);
  };

  const handleUpdatePackingList = async (values: PackingListUpdatePayload) => {
    if (!editingPackingList) return;

    try {
      await updatePackingList.mutateAsync({
        id: editingPackingList.id,
        packingListData: {
          ...values,
          loadingDate: values.loadingDate
            ? new Date(values.loadingDate).toISOString()
            : undefined,
          eta: values.eta ? new Date(values.eta).toISOString() : undefined,
        },
      });
      toast.success("Packing list updated successfully");
      setIsEditModalVisible(false);
      setEditingPackingList(null);
      editForm.resetFields();
    } catch (error: any) {
      toast.error("Failed to update packing list", error.response.data.message);
    }
  };

  const handleDeletePackingList = async (id: string) => {
    try {
      await deletePackingList.mutateAsync(id);
      toast.success("Packing list deleted successfully");
    } catch (error: any) {
      toast.error("Failed to delete packing list", error.response.data.message);
    }
  };

  const handleViewDetails = (packingList: PackingList) => {
    setDetailsPackingList(packingList);
    setIsDetailsDrawerVisible(true);
  };

  const handleExportPackingList = async (id: string, format: ExportFormat) => {
    try {
      await exportPackingList.mutateAsync({ id, format });
      toast.success(`Packing list exported as ${format} successfully`);
    } catch (error: any) {
      toast.error(
        `Failed to export packing list as ${format}`,
        error.response.data.message
      );
    }
  };

  // Available columns for export
  const exportColumnOptions = [
    { label: "Name", value: "name" },
    { label: "Loading Date", value: "loadingDate" },
    { label: "ETA", value: "eta" },
    { label: "Destination City", value: "destinationCity" },
    { label: "Container", value: "container" },
    { label: "Total Packages", value: "totalPackages" },
    { label: "Status", value: "status" },
    { label: "Created At", value: "createdAt" },
  ];

  const handleBulkExport = (format: "csv" | "excel" | "pdf") => {
    if (selectedColumns.length === 0) {
      toast.error("Please select at least one column to export");
      return;
    }

    // Get data to export based on selected columns
    const dataToExport = packingLists?.data?.map((pl: PackingList) => {
      const row: any = {};
      selectedColumns.forEach((col) => {
        switch (col) {
          case "name":
            row["Name"] = pl.name;
            break;
          case "loadingDate":
            row["Loading Date"] = pl.loadingDate
              ? dayjs(pl.loadingDate).format("DD MMM, YYYY")
              : "N/A";
            break;
          case "eta":
            row["ETA"] = pl.eta ? dayjs(pl.eta).format("DD MMM, YYYY") : "N/A";
            break;
          case "destinationCity":
            row["Destination City"] = pl.container?.destinationCity
              ? `${pl.container.destinationCity.name}, ${pl.container.destinationCity.country}`
              : "N/A";
            break;
          case "container":
            row["Container"] = pl.container
              ? `${pl.container.containerNumber} (${pl.container.containerType})`
              : "N/A";
            break;
          case "totalPackages":
            row["Total Packages"] = pl.totalPackages || 0;
            break;
          case "status":
            row["Status"] = pl.status.replace("_", " ");
            break;
          case "createdAt":
            row["Created At"] = dayjs(pl.createdAt).format("DD MMM, YYYY");
            break;
        }
      });
      return row;
    });

    // Export based on format
    if (format === "csv") {
      exportToCSV(dataToExport || []);
    } else if (format === "excel") {
      exportToExcel(dataToExport || []);
    } else if (format === "pdf") {
      exportToPDF(dataToExport || []);
    }

    setIsExportModalVisible(false);
    toast.success(`Data exported as ${format.toUpperCase()} successfully`);
  };

  const exportToCSV = (data: any[]) => {
    if (!data || data.length === 0) return;

    const headers = Object.keys(data[0]);
    const csvContent = [
      headers.join(","),
      ...data.map((row) =>
        headers.map((header) => `"${row[header] || ""}"`).join(",")
      ),
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `packing-lists-${dayjs().format("YYYY-MM-DD")}.csv`;
    link.click();
  };

  const exportToExcel = (data: any[]) => {
    // For Excel export, we'll use CSV format with .xlsx extension
    // In a real application, you'd use a library like xlsx
    if (!data || data.length === 0) return;

    const headers = Object.keys(data[0]);
    const csvContent = [
      headers.join(","),
      ...data.map((row) =>
        headers.map((header) => `"${row[header] || ""}"`).join(",")
      ),
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `packing-lists-${dayjs().format("YYYY-MM-DD")}.xlsx`;
    link.click();
  };

  const exportToPDF = (data: any[]) => {
    // For PDF export, create a simple HTML table and print
    if (!data || data.length === 0) return;

    const headers = Object.keys(data[0]);
    const htmlContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Packing Lists Export</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 20px; }
            h1 { text-align: center; }
            table { width: 100%; border-collapse: collapse; margin-top: 20px; }
            th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
            th { background-color: #4CAF50; color: white; }
            tr:nth-child(even) { background-color: #f2f2f2; }
          </style>
        </head>
        <body>
          <h1>Packing Lists - ${dayjs().format("DD MMM, YYYY")}</h1>
          <table>
            <thead>
              <tr>${headers.map((h) => `<th>${h}</th>`).join("")}</tr>
            </thead>
            <tbody>
              ${data
                .map(
                  (row) =>
                    `<tr>${headers
                      .map((h) => `<td>${row[h] || ""}</td>`)
                      .join("")}</tr>`
                )
                .join("")}
            </tbody>
          </table>
        </body>
      </html>
    `;

    const printWindow = window.open("", "_blank");
    if (printWindow) {
      printWindow.document.write(htmlContent);
      printWindow.document.close();
      printWindow.print();
    }
  };

  const [currentAssignmentsPackingListId, setCurrentAssignmentsPackingListId] =
    useState<string>("");

  const handleManagePackages = (packingList: PackingList) => {
    setCurrentAssignmentsPackingListId(packingList.id);
    setIsPackageAssignmentModalVisible(true);
  };

  // Filter options
  const statusOptions = [
    { label: "Draft", value: PackingListStatus.DRAFT },
    { text: "Posted", value: PackingListStatus.POSTED },
    { text: "Finalized", value: PackingListStatus.FINALIZED },
  ];

  const shipmentModeOptions = [
    { label: "SEA", value: "SEA" },
    { label: "AIR", value: "AIR" },
  ];

  // Statistics
  const totalPackingLists = packingLists?.meta.total || 0;
  const activePackingLists =
    packingLists?.data?.filter((pl: PackingList) =>
      [
        PackingListStatus.DRAFT,
        PackingListStatus.FINALIZED,
        PackingListStatus.POSTED,
      ].includes(pl.status)
    ).length || 0;
  const completedPackingLists =
    packingLists?.data?.filter(
      (pl: PackingList) => pl.status === PackingListStatus.FINALIZED
    ).length || 0;
  // Total packages = sum of all package quantities across all packing lists
  const totalPackages =
    packingLists?.data?.reduce((sum: number, pl: PackingList) => {
      // Sum all package quantities in this packing list
      const plQuantity =
        pl.packages?.reduce((s, pkg) => s + (pkg.quantity || 0), 0) || 0;
      return sum + plQuantity;
    }, 0) || 0;

  // Table columns
  const columns = getPackingListColumns(
    handleEditPackingList,
    handleDeletePackingList,
    handleViewDetails,
    isDeleting,
    handleManagePackages
  );

  return (
    <AuthGuard
      requiredRoles={[
        Role.SUPER_ADMIN,
        Role.OPERATIONS_CLERK,
        Role.FINANCE_MANAGER,
      ]}
    >
      <AppLayout>
        <div className="p-6">
          <div className="flex flex-col gap-4 md:flex-row md:justify-between md:items-center mb-6">
            <Title level={2}>Packing List Management</Title>
            <Space>
              <Button
                icon={<DownloadOutlined />}
                onClick={() => setIsExportModalVisible(true)}
              >
                Export Data
              </Button>
              <Button
                type="primary"
                icon={<PlusOutlined />}
                href="/packing-lists/create"
              >
                Create Packing List
              </Button>
            </Space>
          </div>

          {/* Statistics Cards */}
          <Row gutter={[16, 16]} className="mb-6">
            <Col xs={24} sm={12} md={8} lg={6}>
              <Card>
                <Statistic
                  title="Total Packing Lists"
                  value={totalPackingLists}
                  prefix={<FileTextOutlined />}
                />
              </Card>
            </Col>
            <Col xs={24} sm={12} md={8} lg={6}>
              <Card>
                <Statistic
                  title="Active Lists"
                  value={activePackingLists}
                  prefix={<BoxPlotOutlined />}
                  valueStyle={{ color: "#1890ff" }}
                />
              </Card>
            </Col>
            <Col xs={24} sm={12} md={8} lg={6}>
              <Card>
                <Statistic
                  title="Completed"
                  value={completedPackingLists}
                  prefix={<BarChartOutlined />}
                  valueStyle={{ color: "#52c41a" }}
                />
              </Card>
            </Col>
            <Col xs={24} sm={12} md={8} lg={6}>
              <Card>
                <Statistic
                  title="Total Packages"
                  value={totalPackages}
                  prefix={<PackageIcon />}
                  valueStyle={{ color: "#722ed1" }}
                />
              </Card>
            </Col>
          </Row>

          {/* Filters */}
          <Card className="mb-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
              <Input
                placeholder="Search packing lists..."
                prefix={<SearchOutlined />}
                value={searchText}
                onChange={(e) => handleSearch(e.target.value)}
                allowClear
              />
              <Select
                placeholder="Filter by status"
                value={statusFilter}
                onChange={handleStatusFilter}
                allowClear
              >
                {statusOptions.map((option) => (
                  <Option key={option.value} value={option.value}>
                    {option.label}
                  </Option>
                ))}
              </Select>
              <Select
                placeholder="Shipment Mode"
                value={shipmentModeFilter}
                onChange={handleShipmentModeFilter}
                allowClear
              >
                {shipmentModeOptions.map((option) => (
                  <Option key={option.value} value={option.value}>
                    {option.label}
                  </Option>
                ))}
              </Select>
              <RangePicker
                placeholder={["From date", "To date"]}
                value={dateRange}
                onChange={handleDateRangeChange}
                allowClear
              />
            </div>
            <div className="flex justify-start">
              <Button
                icon={<FilterOutlined />}
                onClick={() => {
                  setSearchText("");
                  setStatusFilter("");
                  setShipmentModeFilter("");
                  setDateRange(null);
                  setCurrentPage(1);
                }}
              >
                Clear Filters
              </Button>
            </div>
          </Card>

          {/* Packing Lists Table */}
          <Card>
            <Table
              columns={columns}
              dataSource={packingLists?.data || []}
              loading={isLoading}
              rowKey="id"
              scroll={{ x: true }}
              pagination={{
                current: currentPage,
                pageSize,
                total: packingLists?.meta?.total || 0,
                showSizeChanger: true,
                showQuickJumper: true,
                showTotal: (total, range) =>
                  `${range[0]}-${range[1]} of ${total} packing lists`,
                onChange: (page, size) => {
                  setCurrentPage(page);
                  setPageSize(size);
                },
              }}
            />
          </Card>

          {/* Edit Packing List Modal */}
          <Modal
            title="Edit Packing List"
            open={isEditModalVisible}
            onCancel={() => {
              setIsEditModalVisible(false);
              setEditingPackingList(null);
              editForm.resetFields();
            }}
            footer={null}
            width={700}
          >
            <Form
              form={editForm}
              layout="vertical"
              onFinish={handleUpdatePackingList}
            >
              <Row gutter={16}>
                <Col span={12}>
                  <Form.Item name="name" label="Packing List Name">
                    <Input />
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item name="containerId" label="Container">
                    <Select
                      showSearch
                      placeholder="Search and select container"
                      filterOption={(input, option) =>
                        (option?.children?.toString() ?? "")
                          .toLowerCase()
                          .includes(input.toLowerCase())
                      }
                      loading={!activeContainers}
                    >
                      {filteredContainers?.map((container) => (
                        <Option key={container.id} value={container.id}>
                          {container.containerNumber} -{" "}
                          {getCityName(container.destinationCityId || "")} (
                          {container.status})
                        </Option>
                      ))}
                    </Select>
                  </Form.Item>
                </Col>
              </Row>

              <Row gutter={16}>
                <Col span={12}>
                  <Form.Item name="loadingDate" label="Loading Date">
                    <DatePicker className="w-full" />
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item name="eta" label="Estimated Time of Arrival">
                    <DatePicker className="w-full" />
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item name="notes" label="Notes">
                    <Input.TextArea rows={3} />
                  </Form.Item>
                </Col>
              </Row>

              <Form.Item>
                <Space>
                  <Button type="primary" htmlType="submit" loading={isUpdating}>
                    Update Packing List
                  </Button>
                  <Button
                    onClick={() => {
                      setIsEditModalVisible(false);
                      setEditingPackingList(null);
                      editForm.resetFields();
                    }}
                  >
                    Cancel
                  </Button>
                </Space>
              </Form.Item>
            </Form>
          </Modal>

          {/* Package Assignment Modal */}
          <PackageAssignmentModal
            visible={isPackageAssignmentModalVisible}
            onCancel={() => {
              setIsPackageAssignmentModalVisible(false);
              setCurrentAssignmentsPackingListId("");
              // Refetch details and summary when modal closes
              if (detailsPackingList?.id) {
                refetchPackingListDetails();
                refetchPackingListSummary();
              }
            }}
            onConfirm={() => {
              setIsPackageAssignmentModalVisible(false);
              setCurrentAssignmentsPackingListId("");
              // Refetch details and summary when modal closes
              if (detailsPackingList?.id) {
                refetchPackingListDetails();
                refetchPackingListSummary();
              }
            }}
            packingListId={currentAssignmentsPackingListId}
          />

          {/* Packing List Details Drawer */}
          <Drawer
            title={`Packing List Details - ${detailsPackingList?.name}`}
            open={isDetailsDrawerVisible}
            onClose={() => {
              setIsDetailsDrawerVisible(false);
              setDetailsPackingList(null);
            }}
            width={600}
          >
            {packingListDetails && (
              <div>
                <Descriptions column={2} bordered className="mb-6">
                  <Descriptions.Item label="Name" span={2}>
                    {packingListDetails.name}
                  </Descriptions.Item>
                  <Descriptions.Item label="Container Number">
                    {packingListDetails.container?.containerNumber || "N/A"}{" "}
                    <br />
                    <span className="text-gray-500 text-xs">
                      {packingListDetails.container?.containerType || "N/A"}
                    </span>
                  </Descriptions.Item>
                  <Descriptions.Item label="Destination City">
                    {packingListDetails.container?.destinationCity?.name ||
                      "N/A"}
                  </Descriptions.Item>
                  <Descriptions.Item label="Loading Date">
                    {packingListDetails.loadingDate
                      ? dayjs(packingListDetails.loadingDate).format(
                          "DD MMM, YYYY"
                        )
                      : "N/A"}
                  </Descriptions.Item>
                  <Descriptions.Item label="ETA">
                    {packingListDetails.eta
                      ? dayjs(packingListDetails.eta).format("DD MMM, YYYY")
                      : "N/A"}
                  </Descriptions.Item>
                  <Descriptions.Item label="Status">
                    <Tag
                      color={packingListStatusColors[packingListDetails.status]}
                    >
                      {packingListDetails.status.replace("_", " ")}
                    </Tag>
                  </Descriptions.Item>
                  <Descriptions.Item label="Package Count">
                    {(() => {
                      // total quantity = sum of package.quantity across the packing list
                      const totalQty =
                        packingListDetails?.packages?.reduce(
                          (sum, p) => sum + (p.quantity || 0),
                          0
                        ) || 0;
                      return totalQty;
                    })()}
                  </Descriptions.Item>
                  <Descriptions.Item label="Notes" span={2}>
                    {packingListDetails.notes || "N/A"}
                  </Descriptions.Item>
                </Descriptions>

                {packingListSummary && (
                  <>
                    <Divider>Packages by Customer</Divider>

                    {/* Single unified table with all packages */}
                    <Table
                      dataSource={packingListSummary.customerSummaries.flatMap(
                        (summary: CustomerPackingSummary) =>
                          summary.packages.map((pkg) => ({
                            ...pkg,
                            customerName: `${summary.customer.firstName} ${
                              summary.customer.lastName || ""
                            }`,
                            customerCode: summary.customer.customerCode,
                          }))
                      )}
                      rowKey="id"
                      size="small"
                      pagination={{
                        pageSize: 10,
                        showSizeChanger: true,
                        showTotal: (total, range) =>
                          `${range[0]}-${range[1]} of ${total} packages`,
                      }}
                      scroll={{ x: true }}
                      columns={[
                        {
                          title: "Customer",
                          key: "customer",
                          width: 180,
                          fixed: "left",
                          render: (_: any, record: any) =>
                            `${record.customerName} (${record.customerCode})`,
                        },
                        {
                          title: "Tracking Code",
                          dataIndex: "trackingCode",
                          key: "trackingCode",
                          width: 140,
                        },
                        {
                          title: "Description",
                          dataIndex: "description",
                          key: "description",
                          ellipsis: true,
                        },
                        {
                          title: "Qty",
                          dataIndex: "quantity",
                          key: "quantity",
                          width: 70,
                          align: "center",
                        },
                        {
                          title: "Weight (kg)",
                          dataIndex: "weight",
                          key: "weight",
                          width: 110,
                          align: "right",
                          render: (val: number) => val?.toFixed(2) || "0.00",
                        },
                        {
                          title: "CBM",
                          dataIndex: "cbm",
                          key: "cbm",
                          width: 90,
                          align: "right",
                          render: (val: number) => val?.toFixed(2) || "0.00",
                        },
                      ]}
                    />

                    {/* Customer Summary Cards */}
                    <Divider>Customer Summaries</Divider>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {packingListSummary.customerSummaries.map(
                        (summary: CustomerPackingSummary) => {
                          const totalQty =
                            summary.packages?.reduce(
                              (sum, pkg) => sum + (pkg.quantity || 0),
                              0
                            ) || 0;
                          return (
                            <Card key={summary.customer.id} size="small">
                              <div>
                                <h4 className="font-medium mb-1">
                                  {summary.customer.firstName}{" "}
                                  {summary.customer.lastName || ""} (
                                  {summary.customer.customerCode})
                                </h4>
                                <p className="text-sm text-gray-600">
                                  {summary.packageCount} packages • {totalQty}{" "}
                                  qty • {summary.totalWeight?.toFixed(2)}kg •{" "}
                                  {summary.totalCBM?.toFixed(2)}m³
                                </p>
                              </div>
                            </Card>
                          );
                        }
                      )}
                    </div>

                    {/* Overall Totals */}
                    <Divider>Overall Totals</Divider>
                    <Card size="small">
                      <Row gutter={16}>
                        <Col span={6}>
                          <Statistic
                            title="Total Quantity"
                            value={
                              // Sum quantities across all customer summaries
                              (
                                packingListSummary?.customerSummaries || []
                              ).reduce(
                                (acc, cs) =>
                                  acc +
                                  (cs.packages?.reduce(
                                    (s, pkg) => s + (pkg.quantity || 0),
                                    0
                                  ) || 0),
                                0
                              ) || 0
                            }
                            valueStyle={{ color: "#722ed1" }}
                          />
                        </Col>
                        <Col span={6}>
                          <Statistic
                            title="Total Weight (kg)"
                            value={packingListSummary.packingList.totalWeight?.toFixed(
                              2
                            )}
                            valueStyle={{ color: "#1890ff" }}
                          />
                        </Col>
                        <Col span={6}>
                          <Statistic
                            title="Total CBM"
                            value={packingListSummary.packingList.totalCBM?.toFixed(
                              2
                            )}
                            valueStyle={{ color: "#52c41a" }}
                          />
                        </Col>
                        <Col span={6}>
                          <Statistic
                            title="Total Shipping Cost (USD)"
                            value={`$${
                              packingListSummary.packingList.totalShippingCost?.toFixed(
                                2
                              ) || "0.00"
                            }`}
                            valueStyle={{ color: "#faad14", fontSize: 14 }}
                            className="text-small"
                          />
                        </Col>
                      </Row>
                    </Card>
                  </>
                )}
              </div>
            )}
          </Drawer>

          {/* Export Data Modal */}
          <Modal
            title="Export Packing Lists"
            open={isExportModalVisible}
            onCancel={() => setIsExportModalVisible(false)}
            footer={null}
            width={600}
          >
            <div className="space-y-4">
              <div>
                <h4 className="font-medium mb-3">Select Columns to Export:</h4>
                <Checkbox.Group
                  options={exportColumnOptions}
                  value={selectedColumns}
                  onChange={(values) => setSelectedColumns(values as string[])}
                  className="flex flex-col gap-2"
                />
              </div>

              <Divider />

              <div>
                <h4 className="font-medium mb-3">Select Export Format:</h4>
                <Space size="middle" className="w-full" direction="vertical">
                  <Button
                    block
                    icon={<DownloadOutlined />}
                    onClick={() => handleBulkExport("csv")}
                    disabled={selectedColumns.length === 0}
                  >
                    Export as CSV
                  </Button>
                  <Button
                    block
                    icon={<DownloadOutlined />}
                    onClick={() => handleBulkExport("excel")}
                    disabled={selectedColumns.length === 0}
                  >
                    Export as Excel
                  </Button>
                  <Button
                    block
                    icon={<DownloadOutlined />}
                    onClick={() => handleBulkExport("pdf")}
                    disabled={selectedColumns.length === 0}
                  >
                    Export as PDF (Print)
                  </Button>
                </Space>
              </div>

              <div className="text-xs text-gray-500 mt-4">
                * {packingLists?.data?.length || 0} rows will be exported based
                on current filters
              </div>
            </div>
          </Modal>
        </div>
      </AppLayout>
    </AuthGuard>
  );
}
