"use client";

import React, { useState, useMemo } from "react";
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
} from "@ant-design/icons";
import { PackageAssignmentModal } from "@/components/PackageAssignmentModal";
import { AppLayout } from "@/components/AppLayout";
import { AuthGuard } from "@/components/AuthGuard";
import {
  usePackingLists,
  usePackingListMutations,
  usePackingListSummary,
  usePackingList,
  useUnassignedPackages,
} from "@/hooks/usePackingLists";
import { useActiveContainers } from "@/hooks/useContainers";
import { useShippingRates } from "@/hooks/useShippingRates";
import {
  PackingListCreatePayload,
  PackingListUpdatePayload,
  PackingListStatus,
  PackingList,
  PackingListSummary,
  ExportFormat,
  CustomerPackingSummary,
} from "@/types/packingList";
import { getPackingListColumns, packingListStatusColors } from "./columns";
import { Package, ShippingMode } from "@/types/package";
import type { Dayjs } from "dayjs";
import type { RangePickerProps } from "antd/es/date-picker";
import { Role } from "@/types/user";
import dayjs from "dayjs";
import { on } from "events";
import { getPacklistTotals } from "@/utils/forms/getPacklistTotals";
import { useExchangeRate } from "@/hooks/useExchangeRate";

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

const containerTypeMap = {
  CONTAINER: ShippingMode.SEA,
  BAG: ShippingMode.AIR,
};
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

  const {
    updatePackingList,
    deletePackingList,
    exportPackingList,
    isUpdating,
    isDeleting,
    isExporting,
  } = usePackingListMutations();

  const { data: packingListDetails } = usePackingList(
    detailsPackingList?.id || ""
  );
  const { data: packingListSummary } = usePackingListSummary(
    detailsPackingList?.id || ""
  );

    const { useCurrentActiveRates } = useShippingRates();
    const { activeRate } = useExchangeRate();

    const shippingMode =
      containerTypeMap[detailsPackingList?.container?.containerType || "BAG"];
    // Get current shipping rate for calculations
    const { data: currentShippingRates } = useCurrentActiveRates(shippingMode);

  const packageListTotals = useMemo(() => {
    return getPacklistTotals(detailsPackingList?.packages || [], currentShippingRates, activeRate?.rate);
  }, [detailsPackingList, currentShippingRates, activeRate]);

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
  const totalPackages =
    packingLists?.data?.reduce(
      (sum: number, pl: PackingList) => sum + (pl.totalPackages || 0),
      0
    ) || 0;

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
            <Button
              type="primary"
              icon={<PlusOutlined />}
              href="/packing-lists/create"
              block
              className="max-w-xs"
            >
              Create Packing List
            </Button>
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
                          {container.destinationCity} ({container.status})
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
                  <Form.Item name="destinationCity" label="Destination City">
                    <Input />
                  </Form.Item>
                </Col>
              </Row>

              <Row gutter={16}>
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
            }}
            onConfirm={() => {
              setIsPackageAssignmentModalVisible(false);
              setCurrentAssignmentsPackingListId("");
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
                    {packingListDetails.destinationCity || "N/A"}
                  </Descriptions.Item>
                  <Descriptions.Item label="Loading Date">
                    {packingListDetails.loadingDate
                      ? new Date(
                          packingListDetails.loadingDate
                        ).toLocaleDateString()
                      : "N/A"}
                  </Descriptions.Item>
                  <Descriptions.Item label="ETA">
                    {packingListDetails.eta
                      ? new Date(packingListDetails.eta).toLocaleDateString()
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
                    {packingListDetails.totalPackages || 0}
                  </Descriptions.Item>
                  <Descriptions.Item label="Notes" span={2}>
                    {packingListDetails.notes || "N/A"}
                  </Descriptions.Item>
                </Descriptions>

                {packingListSummary && (
                  <>
                    <Divider>Summary by Customer</Divider>
                    <div className="space-y-4">
                      {packingListSummary.customerSummaries.map(
                        (summary: CustomerPackingSummary) => (
                          <Card key={summary.customer.id} size="small">
                            <div>
                              <h4 className="font-medium mb-2">
                                {summary.customer.firstName}{" "}
                                {summary.customer.lastName} ({" "}
                                {summary.customer.customerCode})
                              </h4>
                              <p className="text-sm text-gray-600 mb-2">
                                {summary.packageCount} packages •{" "}
                                {summary.totalWeight}kg • {summary.totalCBM}m³
                              </p>
                              <div className="mt-2">
                                <Text strong className="text-xs">
                                  Packages:
                                </Text>
                                <div className="mt-1 max-h-20 overflow-y-auto">
                                  {summary.packages.map((pkg) => (
                                    <div
                                      key={pkg.id}
                                      className="text-xs text-gray-600 border-b pb-1 mb-1 last:border-b-0"
                                    >
                                      {pkg.trackingCode} - {pkg.description} (
                                      {pkg.weight}kg, {pkg.cbm}m³)
                                    </div>
                                  ))}
                                </div>
                              </div>
                            </div>
                          </Card>
                        )
                      )}

                      {/* Overall Totals */}
                      <Divider>Overall Totals</Divider>
                      <Card size="small">
                        <Row gutter={16}>
                          <Col span={6}>
                            <Statistic
                              title="Total Packages"
                              value={
                                packingListSummary.packingList.totalPackages ||
                                0
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
                                packageListTotals?.usdTotal?.toFixed(2) ||
                                "0.00"
                              }`}
                              valueStyle={{ color: "#faad14", fontSize: 14 }}
                              className="text-small"
                            />
                            <Statistic
                              title="Total Shipping Cost (GHS)"
                              value={`$${
                                packageListTotals?.ghsTotal?.toFixed(2) ||
                                "0.00"
                              }`}
                              className="text-small"
                              valueStyle={{ color: "#2ffa14ff", fontSize: 14 }}
                            />
                          </Col>
                        </Row>
                      </Card>
                    </div>
                  </>
                )}
              </div>
            )}
          </Drawer>
        </div>
      </AppLayout>
    </AuthGuard>
  );
}
