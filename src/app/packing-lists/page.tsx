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
} from "@/types/packingList";
import { getPackingListColumns } from "./columns";
import { Package } from "@/types/package";
import type { Dayjs } from "dayjs";
import type { RangePickerProps } from "antd/es/date-picker";
import { Role } from "@/types/user";
import dayjs from "dayjs";

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
  const [isCreateModalVisible, setIsCreateModalVisible] = useState(false);
  const [isEditModalVisible, setIsEditModalVisible] = useState(false);
  const [isDetailsDrawerVisible, setIsDetailsDrawerVisible] = useState(false);
  const [isPackageAssignmentModalVisible, setIsPackageAssignmentModalVisible] =
    useState(false);
  const [editingPackingList, setEditingPackingList] =
    useState<PackingList | null>(null);
  const [detailsPackingList, setDetailsPackingList] =
    useState<PackingList | null>(null);
  const [assignmentPackingList, setAssignmentPackingList] =
    useState<PackingList | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);

  // Forms
  const [createForm] = Form.useForm();
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
    createPackingList,
    updatePackingList,
    deletePackingList,
    addPackagesToPackingList,
    exportPackingList,
    isCreating,
    isUpdating,
    isDeleting,
    isAddingPackages,
    isExporting,
  } = usePackingListMutations();

  const { data: packingListDetails } = usePackingList(
    detailsPackingList?.id || ""
  );
  const { data: packingListSummary } = usePackingListSummary(
    detailsPackingList?.id || ""
  );
  const { data: assignedPackagesSummary } = usePackingListSummary(
    assignmentPackingList?.id || ""
  );
  const { data: unassignedPackagesForModal } = useUnassignedPackages({
    page: 1,
    limit: 1000,
  });
  const { activeRates: shippingRatesForModal = [] } = useShippingRates();

  // Get assigned package IDs to filter them out from available packages
  const assignedPackageIds = useMemo(() => {
    return assignedPackagesSummary?.data?.customerSummaries?.flatMap(
      (summary) => summary.packages.map((pkg) => pkg.id)
    ) || [];
  }, [assignedPackagesSummary?.data?.customerSummaries]);

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

  const handleCreatePackingList = async (values: PackingListCreatePayload) => {
    try {
      await createPackingList.mutateAsync(values);
      toast.success("Packing list created successfully");
      setIsCreateModalVisible(false);
      createForm.resetFields();
    } catch (error: any) {
      toast.error("Failed to create packing list", error.response.data.message);
    }
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

  const handleManagePackages = (packingList: PackingList) => {
    setAssignmentPackingList(packingList);
    setIsPackageAssignmentModalVisible(true);
  };

  const handlePackageAssignmentConfirm = async (packageIds: string[]) => {
    if (!assignmentPackingList) return;

    try {
      await addPackagesToPackingList.mutateAsync({
        id: assignmentPackingList.id,
        packageIds,
      });
      toast.success(`${packageIds.length} packages added successfully`);
      setIsPackageAssignmentModalVisible(false);
      setAssignmentPackingList(null);
    } catch (error: any) {
      toast.error(
        "Failed to add packages to packing list",
        error.response.data.message
      );
    }
  };

  // Filter options
  const statusOptions = [
    { label: "Draft", value: PackingListStatus.DRAFT },
    { label: "Planned", value: PackingListStatus.PLANNED },
    { label: "Loading", value: PackingListStatus.LOADING },
    { label: "Loaded", value: PackingListStatus.LOADED },
    { label: "In Transit", value: PackingListStatus.IN_TRANSIT },
    { label: "Delivered", value: PackingListStatus.DELIVERED },
    { label: "Cancelled", value: PackingListStatus.CANCELLED },
  ];

  const shipmentModeOptions = [
    { label: "SEA", value: "SEA" },
    { label: "AIR", value: "AIR" },
  ];

  // Statistics
  const totalPackingLists = packingLists?.meta?.totalItems || 0;
  const activePackingLists =
    packingLists?.data?.filter((pl: PackingList) =>
      [
        PackingListStatus.PLANNED,
        PackingListStatus.LOADING,
        PackingListStatus.LOADED,
        PackingListStatus.IN_TRANSIT,
      ].includes(pl.status)
    ).length || 0;
  const completedPackingLists =
    packingLists?.data?.filter(
      (pl: PackingList) => pl.status === PackingListStatus.DELIVERED
    ).length || 0;
  const totalPackages =
    packingLists?.data?.reduce(
      (sum: number, pl: PackingList) => sum + (pl.packageCount || 0),
      0
    ) || 0;

  // Table columns
  const columns = getPackingListColumns(
    handleEditPackingList,
    handleDeletePackingList,
    handleViewDetails,
    handleExportPackingList,
    isDeleting,
    isExporting,
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
                total: packingLists?.meta?.totalItems || 0,
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

          {/* Create Packing List Modal */}
          <Modal
            title="Create New Packing List"
            open={isCreateModalVisible}
            onCancel={() => {
              setIsCreateModalVisible(false);
              createForm.resetFields();
            }}
            footer={null}
            width={700}
          >
            <Form
              form={createForm}
              layout="vertical"
              onFinish={handleCreatePackingList}
            >
              <Row gutter={16}>
                <Col span={12}>
                  <Form.Item
                    name="name"
                    label="Packing List Name"
                    rules={[
                      {
                        required: true,
                        message: "Please enter packing list name",
                      },
                    ]}
                  >
                    <Input />
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item
                    name="containerId"
                    label="Container"
                    rules={[
                      {
                        required: true,
                        message: "Please select a container",
                      },
                    ]}
                  >
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
                  <Form.Item
                    name="loadingDate"
                    label="Loading Date"
                    rules={[
                      { required: true, message: "Please select loading date" },
                    ]}
                  >
                    <DatePicker className="w-full" />
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item name="loadingCity" label="Loading City">
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
                  <Button type="primary" htmlType="submit" loading={isCreating}>
                    Create Packing List
                  </Button>
                  <Button
                    onClick={() => {
                      setIsCreateModalVisible(false);
                      createForm.resetFields();
                    }}
                  >
                    Cancel
                  </Button>
                </Space>
              </Form.Item>
            </Form>
          </Modal>

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
                    <Input/>
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
              setAssignmentPackingList(null);
            }}
            onConfirm={handlePackageAssignmentConfirm}
            title={`Manage Packages - ${assignmentPackingList?.name}`}
            loading={isAddingPackages}
            assignedPackageIds={assignedPackageIds}
            unassignedPackages={unassignedPackagesForModal}
            shippingRates={shippingRatesForModal}
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
                  <Descriptions.Item label="Container ID">
                    {packingListDetails.containerId || "N/A"}
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
                      color={
                        packingListDetails.status ===
                        PackingListStatus.DELIVERED
                          ? "green"
                          : packingListDetails.status ===
                            PackingListStatus.CANCELLED
                          ? "red"
                          : packingListDetails.status ===
                            PackingListStatus.IN_TRANSIT
                          ? "cyan"
                          : "blue"
                      }
                    >
                      {packingListDetails.status.replace("_", " ")}
                    </Tag>
                  </Descriptions.Item>
                  <Descriptions.Item label="Package Count">
                    {packingListDetails.packageCount || 0}
                  </Descriptions.Item>
                  <Descriptions.Item label="Notes" span={2}>
                    {packingListDetails.notes || "N/A"}
                  </Descriptions.Item>
                </Descriptions>

                {packingListSummary && packingListSummary.data && (
                  <>
                    <Divider>Summary by Customer</Divider>
                    <div className="space-y-4">
                      {packingListSummary.data.customerSummaries.map(
                        (summary: PackingListSummary["customerSummaries"][0]) => (
                          <Card key={summary.customer.id} size="small">
                            <div>
                              <h4 className="font-medium mb-2">
                                {summary.customer.name}
                              </h4>
                              <p className="text-sm text-gray-600 mb-2">
                                {summary.totals.packageCount} packages •{" "}
                                {summary.totals.totalWeight}kg • {summary.totals.totalCbm}m³
                              </p>
                              <div className="text-xs text-gray-500">
                                Total Value: ${summary.totals.totalValue?.toFixed(2) || "0.00"}
                              </div>
                              <div className="mt-2">
                                <Text strong className="text-xs">Packages:</Text>
                                <div className="mt-1 max-h-20 overflow-y-auto">
                                  {summary.packages.map((pkg) => (
                                    <div key={pkg.id} className="text-xs text-gray-600 border-b pb-1 mb-1 last:border-b-0">
                                      {pkg.trackingCode} - {pkg.description} ({pkg.weight}kg, {pkg.cbm}m³)
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
                              value={packingListSummary.data.totals.packageCount}
                              valueStyle={{ color: '#722ed1' }}
                            />
                          </Col>
                          <Col span={6}>
                            <Statistic
                              title="Total Weight (kg)"
                              value={packingListSummary.data.totals.totalWeight.toFixed(2)}
                              valueStyle={{ color: '#1890ff' }}
                            />
                          </Col>
                          <Col span={6}>
                            <Statistic
                              title="Total CBM"
                              value={packingListSummary.data.totals.totalCbm.toFixed(2)}
                              valueStyle={{ color: '#52c41a' }}
                            />
                          </Col>
                          <Col span={6}>
                            <Statistic
                              title="Total Value"
                              value={`$${packingListSummary.data.totals.totalValue?.toFixed(2) || "0.00"}`}
                              valueStyle={{ color: '#faad14' }}
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
