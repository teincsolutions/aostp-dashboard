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
  message,
  Card,
  Row,
  Col,
  Statistic,
  Drawer,
  DatePicker,
  Divider,
  Descriptions,
  Tag,
  Transfer,
  Typography,
  Alert,
  Badge,
  Table as AntTable,
} from "antd";
import {
  PlusOutlined,
  SearchOutlined,
  FilterOutlined,
  FileTextOutlined,
  BoxPlotOutlined,
  BarChartOutlined,
  CheckOutlined,
  TruckOutlined,
  BoxPlotOutlined as PackageIcon,
} from "@ant-design/icons";
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
import {
  PackingListCreatePayload,
  PackingListUpdatePayload,
  PackingListStatus,
  PackingList,
  PackingListSummary,
  ExportFormat,
  PackageAssignment,
} from "@/types/packingList";
import { getPackingListColumns } from "./columns";
import { ShipmentType, Package } from "@/types/package";
import type { Dayjs } from "dayjs";
import type { RangePickerProps } from "antd/es/date-picker";
import { Role } from "@/types/user";

const { Option } = Select;
const { RangePicker } = DatePicker;
const { Title, Text } = Typography;

// Package table columns for assignment modal
const getPackageColumns = () => [
  {
    title: "Tracking Code",
    dataIndex: "trackingCode",
    key: "trackingCode",
  },
  {
    title: "Description",
    dataIndex: "description",
    key: "description",
  },
  {
    title: "Customer",
    dataIndex: ["customer", "firstName"],
    key: "customer",
    render: (_: any, record: Package) =>
      record.customer ? `${record.customer.firstName} ${record.customer.lastName}` : 'N/A',
  },
  {
    title: "Weight (kg)",
    dataIndex: "weight",
    key: "weight",
  },
  {
    title: "CBM",
    dataIndex: "cbm",
    key: "cbm",
  },
  {
    title: "Value",
    dataIndex: "value",
    key: "value",
    render: (value: number | undefined) => value ? `$${value.toFixed(2)}` : '$0.00',
  },
  {
    title: "Mode",
    dataIndex: "shippingMode",
    key: "shippingMode",
    render: (mode: string) => (
      <Tag color={mode === "AIR" ? "blue" : "green"}>{mode}</Tag>
    ),
  },
];

export default function PackingListsPage() {
  // State for UI
  const [searchText, setSearchText] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [loadingCityFilter, setLoadingCityFilter] = useState<string>("");
  const [dateRange, setDateRange] = useState<
    [Dayjs | null, Dayjs | null] | null
  >(null);
  const [shipmentModeFilter, setShipmentModeFilter] = useState<string>("");
  const [isCreateModalVisible, setIsCreateModalVisible] = useState(false);
  const [isEditModalVisible, setIsEditModalVisible] = useState(false);
  const [isDetailsDrawerVisible, setIsDetailsDrawerVisible] = useState(false);
  const [isPackageAssignmentModalVisible, setIsPackageAssignmentModalVisible] = useState(false);
  const [editingPackingList, setEditingPackingList] =
    useState<PackingList | null>(null);
  const [detailsPackingList, setDetailsPackingList] =
    useState<PackingList | null>(null);
  const [assignmentPackingList, setAssignmentPackingList] = useState<PackingList | null>(null);
  const [selectedPackageIds, setSelectedPackageIds] = useState<string[]>([]);
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
    loadingCity: loadingCityFilter,
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
    removePackagesToPackingList,
    exportPackingList,
    isCreating,
    isUpdating,
    isDeleting,
    isAddingPackages,
    isRemovingPackages,
    isExporting,
  } = usePackingListMutations();

  const { data: packingListDetails } = usePackingList(
    detailsPackingList?.id || ""
  );
  const { data: packingListSummary } = usePackingListSummary(
    detailsPackingList?.id || ""
  );
  const { data: unassignedPackages } = useUnassignedPackages({
    search: "",
    page: 1,
    limit: 100,
  });

  // Calculated values
  const selectedPackages = unassignedPackages?.data?.filter(pkg =>
    selectedPackageIds.includes(pkg.id)
  ) || [];
  const totalSelectedWeight = selectedPackages.reduce((sum, pkg) => sum + pkg.weight, 0);
  const totalSelectedCbm = selectedPackages.reduce((sum, pkg) => sum + pkg.cbm, 0);

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

  const handleLoadingCityFilter = (value: string) => {
    setLoadingCityFilter(value);
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
      message.success("Packing list created successfully");
      setIsCreateModalVisible(false);
      createForm.resetFields();
    } catch (error: any) {
      message.error("Failed to create packing list", error.response.data.message);
    }
  };

  const handleEditPackingList = (packingList: PackingList) => {
    setEditingPackingList(packingList);
    editForm.setFieldsValue({
      name: packingList.name,
      containerId: packingList.containerId,
      loadingDate: packingList.loadingDate
        ? new Date(packingList.loadingDate)
        : null,
      loadingCity: packingList.loadingCity,
      eta: packingList.eta ? new Date(packingList.eta) : null,
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
      message.success("Packing list updated successfully");
      setIsEditModalVisible(false);
      setEditingPackingList(null);
      editForm.resetFields();
    } catch (error: any) {
      message.error("Failed to update packing list", error.response.data.message);
    }
  };

  const handleDeletePackingList = async (id: string) => {
    try {
      await deletePackingList.mutateAsync(id);
      message.success("Packing list deleted successfully");
    } catch (error: any) {
      message.error("Failed to delete packing list", error.response.data.message);
    }
  };

  const handleViewDetails = (packingList: PackingList) => {
    setDetailsPackingList(packingList);
    setIsDetailsDrawerVisible(true);
  };

  const handleExportPackingList = async (
    id: string,
    format: ExportFormat
  ) => {
    try {
      await exportPackingList.mutateAsync({ id, format });
      message.success(`Packing list exported as ${format} successfully`);
    } catch (error: any) {
      message.error(`Failed to export packing list as ${format}`, error.response.data.message);
    }
  };

  const handleManagePackages = (packingList: PackingList) => {
    setAssignmentPackingList(packingList);
    setSelectedPackageIds([]);
    setIsPackageAssignmentModalVisible(true);
  };

  const handleAddPackages = async () => {
    if (!assignmentPackingList || selectedPackageIds.length === 0) return;

    try {
      await addPackagesToPackingList.mutateAsync({
        id: assignmentPackingList.id,
        packageIds: selectedPackageIds,
      });
      message.success(`${selectedPackageIds.length} packages added successfully`);
      setSelectedPackageIds([]);
      setIsPackageAssignmentModalVisible(false);
      setAssignmentPackingList(null);
    } catch (error: any) {
      message.error("Failed to add packages to packing list", error.response.data.message);
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
    <AuthGuard requiredRoles={[Role.OPERATIONS_CLERK, Role.FINANCE_MANAGER, Role.SUPER_ADMIN]}>
      <AppLayout>
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <Title level={2}>Packing List Management</Title>
            <Button
              type="primary"
              icon={<PlusOutlined />}
              href="/packing-lists/create"
            >
              Create Packing List
            </Button>
          </div>

          {/* Statistics Cards */}
          <Row gutter={16} className="mb-6">
            <Col span={6}>
              <Card>
                <Statistic
                  title="Total Packing Lists"
                  value={totalPackingLists}
                  prefix={<FileTextOutlined />}
                />
              </Card>
            </Col>
            <Col span={6}>
              <Card>
                <Statistic
                  title="Active Lists"
                  value={activePackingLists}
                  prefix={<BoxPlotOutlined />}
                  valueStyle={{ color: "#1890ff" }}
                />
              </Card>
            </Col>
            <Col span={6}>
              <Card>
                <Statistic
                  title="Completed"
                  value={completedPackingLists}
                  prefix={<BarChartOutlined />}
                  valueStyle={{ color: "#52c41a" }}
                />
              </Card>
            </Col>
            <Col span={6}>
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
            <Row gutter={16} className="mb-4">
              <Col span={6}>
                <Input
                  placeholder="Search packing lists..."
                  prefix={<SearchOutlined />}
                  value={searchText}
                  onChange={(e) => handleSearch(e.target.value)}
                  allowClear
                />
              </Col>
              <Col span={4}>
                <Select
                  placeholder="Filter by status"
                  value={statusFilter}
                  onChange={handleStatusFilter}
                  className="w-full"
                  allowClear
                >
                  {statusOptions.map((option) => (
                    <Option key={option.value} value={option.value}>
                      {option.label}
                    </Option>
                  ))}
                </Select>
              </Col>
              <Col span={4}>
                <Input
                  placeholder="Loading city"
                  value={loadingCityFilter}
                  onChange={(e) => handleLoadingCityFilter(e.target.value)}
                  allowClear
                />
              </Col>
              <Col span={4}>
                <Select
                  placeholder="Shipment Mode"
                  value={shipmentModeFilter}
                  onChange={handleShipmentModeFilter}
                  className="w-full"
                  allowClear
                >
                  {shipmentModeOptions.map((option) => (
                    <Option key={option.value} value={option.value}>
                      {option.label}
                    </Option>
                  ))}
                </Select>
              </Col>
              <Col span={6}>
                <RangePicker
                  placeholder={["From date", "To date"]}
                  value={dateRange}
                  onChange={handleDateRangeChange}
                  className="w-full"
                  allowClear
                />
              </Col>
            </Row>
            <Row>
              <Col span={24}>
                <Button
                  icon={<FilterOutlined />}
                  onClick={() => {
                    setSearchText("");
                    setStatusFilter("");
                    setLoadingCityFilter("");
                    setShipmentModeFilter("");
                    setDateRange(null);
                    setCurrentPage(1);
                  }}
                >
                  Clear Filters
                </Button>
              </Col>
            </Row>
          </Card>

          {/* Packing Lists Table */}
          <Card>
            <Table
              columns={columns}
              dataSource={packingLists?.data || []}
              loading={isLoading}
              rowKey="id"
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
                        (option?.children?.toString() ?? "").toLowerCase().includes(input.toLowerCase())
                      }
                      loading={!activeContainers}
                    >
                      {filteredContainers?.map((container) => (
                        <Option key={container.id} value={container.id}>
                          {container.containerNumber} - {container.destinationCity} ({container.status})
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
                        (option?.children?.toString() ?? "").toLowerCase().includes(input.toLowerCase())
                      }
                      loading={!activeContainers}
                    >
                      {filteredContainers?.map((container) => (
                        <Option key={container.id} value={container.id}>
                          {container.containerNumber} - {container.destinationCity} ({container.status})
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
          <Modal
            title={`Manage Packages - ${assignmentPackingList?.name}`}
            open={isPackageAssignmentModalVisible}
            onCancel={() => {
              setIsPackageAssignmentModalVisible(false);
              setAssignmentPackingList(null);
              setSelectedPackageIds([]);
            }}
            width={1200}
            footer={[
              <Button
                key="cancel"
                onClick={() => {
                  setIsPackageAssignmentModalVisible(false);
                  setAssignmentPackingList(null);
                  setSelectedPackageIds([]);
                }}
              >
                Cancel
              </Button>,
              <Button
                key="add"
                type="primary"
                onClick={handleAddPackages}
                loading={isAddingPackages}
                disabled={selectedPackageIds.length === 0}
              >
                Add Selected Packages ({selectedPackageIds.length})
              </Button>,
            ]}
          >
            <div className="space-y-4">
              {selectedPackageIds.length > 0 && (
                <Alert
                  message="Selected Packages Summary"
                  description={
                    <div className="grid grid-cols-3 gap-4 mt-2">
                      <div>
                        <Text strong>Total Weight:</Text> {totalSelectedWeight.toFixed(2)} kg
                      </div>
                      <div>
                        <Text strong>Total CBM:</Text> {totalSelectedCbm.toFixed(2)}
                      </div>
                    </div>
                  }
                  type="info"
                  showIcon
                />
              )}

              <AntTable
                columns={getPackageColumns()}
                dataSource={unassignedPackages?.data || []}
                rowKey="id"
                rowSelection={{
                  selectedRowKeys: selectedPackageIds,
                  onChange: (selectedRowKeys) => {
                    setSelectedPackageIds(selectedRowKeys as string[]);
                  },
                }}
                pagination={false}
                scroll={{ y: 400 }}
                size="small"
              />
            </div>
          </Modal>

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
                  <Descriptions.Item label="Loading City">
                    {packingListDetails.loadingCity || "N/A"}
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
                      {packingListSummary.data.customerGroups.map(
                        (group: PackingListSummary["customerGroups"][0]) => (
                          <Card key={group.customerId} size="small">
                            <div className="flex justify-between items-center">
                              <div>
                                <h4 className="font-medium">
                                  {group.customerName}
                                </h4>
                                <p className="text-sm text-gray-600">
                                  {group.packageCount} packages •{" "}
                                  {group.totalWeight}kg • {group.totalCbm}m³
                                </p>
                              </div>
                            </div>
                          </Card>
                        )
                      )}
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
