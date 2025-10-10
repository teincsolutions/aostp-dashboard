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
  Progress,
} from "antd";
import {
  PlusOutlined,
  SearchOutlined,
  BarChartOutlined,
  ContainerOutlined,
  CheckOutlined,
  ClockCircleOutlined,
} from "@ant-design/icons";
import { AppLayout } from "@/components/AppLayout";
import { AuthGuard } from "@/components/AuthGuard";
import {
  useContainers,
  useContainerMutations,
  useContainerStatistics,
} from "@/hooks/useContainers";
import {
  ContainerCreatePayload,
  ContainerUpdatePayload,
  Container,
  ContainerStatus,
  ExportFormat,
} from "@/types/container";
import type { Dayjs } from "dayjs";
import { getContainerColumns } from "@/app/containers/columns";

const { Option } = Select;
const { RangePicker } = DatePicker;

interface CreateFormValues {
  containerNumber: string;
  vesselFlight?: string;
  loadingDate: Dayjs;
  departureCity: string;
  destinationCity: string;
  eta: Dayjs;
  status: ContainerStatus;
  notes?: string;
}

interface UpdateFormValues {
  containerNumber?: string;
  vesselFlight?: string;
  loadingDate?: Dayjs;
  departureCity?: string;
  destinationCity?: string;
  eta?: Dayjs;
  status?: ContainerStatus;
  notes?: string;
}

export default function ContainersPage() {
  // State for UI
  const [searchText, setSearchText] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [departureCityFilter, setDepartureCityFilter] = useState<string>("");
  const [destinationCityFilter, setDestinationCityFilter] =
    useState<string>("");
  const [dateRange, setDateRange] = useState<
    [Dayjs | null, Dayjs | null] | null
  >(null);

  // Modals and drawers
  const [isCreateModalVisible, setIsCreateModalVisible] = useState(false);
  const [isEditModalVisible, setIsEditModalVisible] = useState(false);
  const [isStatisticsDrawerVisible, setIsStatisticsDrawerVisible] =
    useState(false);
  const [isStatusUpdateModalVisible, setIsStatusUpdateModalVisible] =
    useState(false);

  // Current items
  const [editingContainer, setEditingContainer] = useState<Container | null>(
    null
  );
  const [viewingContainer, setViewingContainer] = useState<Container | null>(
    null
  );
  const [updatingContainer, setUpdatingContainer] = useState<Container | null>(
    null
  );
  const [newStatus, setNewStatus] = useState<ContainerStatus>(
    ContainerStatus.PLANNED
  );

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // Forms
  const [createForm] = Form.useForm();
  const [editForm] = Form.useForm();
  const [statusForm] = Form.useForm();

  // React Query hooks
  const { data: containers, isLoading } = useContainers({
    page: currentPage,
    limit: pageSize,
    dateFrom: dateRange?.[0]?.format("YYYY-MM-DD"),
    dateTo: dateRange?.[1]?.format("YYYY-MM-DD"),
  });

  const { data: statistics, isLoading: isLoadingStatistics, error: statisticsError } = useContainerStatistics(
    viewingContainer?.id || ""
  );

  const {
    createContainer,
    updateContainer,
    deleteContainer,
    updateContainerStatus,
    exportContainerManifest,
    isCreating,
    isUpdating,
    isDeleting,
    isUpdatingStatus,
    isExporting,
  } = useContainerMutations();

  // Handlers
  const handleSearch = (value: string) => {
    setSearchText(value);
    setCurrentPage(1);
  };

  const handleFilterChange =
    (setter: (value: string) => void) => (value: string) => {
      setter(value);
      setCurrentPage(1);
    };

  const handleCreateContainer = async (values: any) => {
    try {
      // Transform form values to payload
      const payload: ContainerCreatePayload = {
        containerNumber: values.containerNumber,
        vesselFlight: values.vesselFlight,
        loadingDate: values.loadingDate.format("YYYY-MM-DDTHH:mm:ssZ"),
        departureCity: values.departureCity,
        destinationCity: values.destinationCity,
        eta: values.eta.format("YYYY-MM-DDTHH:mm:ssZ"),
        containerType: values.containerType,
        status: values.status,
        notes: values.notes,
      };

      await createContainer(payload);
      message.success("Container created successfully");
      setIsCreateModalVisible(false);
      createForm.resetFields();
    } catch (error: any) {
      console.log(error.response.data);
      message.error("Failed to create container");
    }
  };

  const handleEditContainer = (container: Container) => {
    setEditingContainer(container);
    editForm.setFieldsValue({
      containerNumber: container.containerNumber,
      loadingDate: container.loadingDate
        ? new Date(container.loadingDate)
        : null,
      departureCity: container.departureCity,
      destinationCity: container.destinationCity,
      eta: container.eta ? new Date(container.eta) : null,
      status: container.status,
      notes: container.notes,
    });
    setIsEditModalVisible(true);
  };

  const handleUpdateContainer = async (values: UpdateFormValues) => {
    if (!editingContainer) return;

    try {
      const payload: ContainerUpdatePayload = {
        containerNumber: values.containerNumber,
        loadingDate: values.loadingDate?.format("YYYY-MM-DDTHH:mm:ssZ"),
        departureCity: values.departureCity,
        destinationCity: values.destinationCity,
        eta: values.eta?.format("YYYY-MM-DDTHH:mm:ssZ"),
        status: values.status,
        notes: values.notes,
      };

      await updateContainer({
        id: editingContainer.id,
        containerData: payload,
      });
      message.success("Container updated successfully");
      setIsEditModalVisible(false);
      setEditingContainer(null);
      editForm.resetFields();
    } catch (error: any) {
      console.log(error.response.data);
      message.error("Failed to update container");
    }
  };

  const handleDeleteContainer = async (id: string) => {
    try {
      await deleteContainer(id);
      message.success("Container deleted successfully");
    } catch (error: any) {
      console.log(error.response.data);
      message.error("Failed to delete container");
    }
  };

  const handleUpdateContainerStatus = async (
    id: string,
    status: ContainerStatus
  ) => {
    try {
      await updateContainerStatus({ id, status });
      message.success("Container status updated successfully");
      setIsStatusUpdateModalVisible(false);
      setUpdatingContainer(null);
    } catch (error: any) {
      console.log(error.response.data);
      message.error("Failed to update container status");
    }
  };

  const handleViewStatistics = (container: Container) => {
    setViewingContainer(container);
    setIsStatisticsDrawerVisible(true);
  };

  const handleExportManifest = async (id: string, format: ExportFormat) => {
    try {
      const result = await exportContainerManifest({ id, format });
      message.success("Manifest exported successfully");
      // Open the download URL in a new tab
      if (result.downloadUrl) {
        window.open(result.downloadUrl, "_blank");
      }
    } catch (error: any) {
      console.log(error.response.data);
      message.error("Failed to export manifest");
    }
  };

  // Table columns
  const columns = getContainerColumns(
    handleEditContainer,
    handleDeleteContainer,
    (id: string, status: ContainerStatus) => {
      setUpdatingContainer(
        containers?.data?.find((c: Container) => c.id === id) || null
      );
      setNewStatus(status);
      setIsStatusUpdateModalVisible(true);
    },
    handleViewStatistics,
    handleExportManifest,
    isDeleting,
    isUpdatingStatus,
    isExporting
  );

  // Statistics
  const totalContainers = containers?.meta?.totalItems || 0;
  const activeContainers =
    containers?.data?.filter((c) => c.status !== ContainerStatus.CLOSED)
      .length || 0;
  const plannedContainers =
    containers?.data?.filter((c) => c.status === ContainerStatus.PLANNED)
      .length || 0;
  const shippedContainers =
    containers?.data?.filter((c) => c.status === ContainerStatus.SHIPPED)
      .length || 0;
  const completedContainers =
    containers?.data?.filter((c) => c.status === ContainerStatus.ARRIVED)
      .length || 0;

  // Filter options
  const statusOptions = [
    { label: "Planned", value: ContainerStatus.PLANNED },
    { label: "Loaded", value: ContainerStatus.LOADED },
    { label: "Shipped", value: ContainerStatus.SHIPPED },
    { label: "Arrived", value: ContainerStatus.ARRIVED },
    { label: "Closed", value: ContainerStatus.CLOSED },
  ];

  return (
    <AuthGuard>
      <AppLayout>
        <div className="p-6">
          <div className="flex flex-col gap-4 md:flex-row md:justify-between md:items-center mb-6">
            <h1 className="text-2xl font-bold">Container Management</h1>
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={() => setIsCreateModalVisible(true)}
              block
              className="md:w-auto"
            >
              Add Container
            </Button>
          </div>

          {/* Statistics Cards */}
          <Row gutter={[16, 16]} className="mb-6">
            <Col xs={24} sm={12} md={8} lg={4}>
              <Card>
                <Statistic
                  title="Total Containers"
                  value={totalContainers}
                  prefix={<ContainerOutlined />}
                />
              </Card>
            </Col>
            <Col xs={24} sm={12} md={8} lg={4}>
              <Card>
                <Statistic
                  title="Active Containers"
                  value={activeContainers}
                  prefix={<CheckOutlined />}
                  valueStyle={{ color: "#3f8600" }}
                />
              </Card>
            </Col>
            <Col xs={24} sm={12} md={8} lg={4}>
              <Card>
                <Statistic
                  title="Planned"
                  value={plannedContainers}
                  prefix={<ClockCircleOutlined />}
                  valueStyle={{ color: "#1890ff" }}
                />
              </Card>
            </Col>
            <Col xs={24} sm={12} md={8} lg={4}>
              <Card>
                <Statistic
                  title="Shipped"
                  value={shippedContainers}
                  prefix={<CheckOutlined />}
                  valueStyle={{ color: "#722ed1" }}
                />
              </Card>
            </Col>
            <Col xs={24} sm={12} md={8} lg={4}>
              <Card>
                <Statistic
                  title="Completed"
                  value={completedContainers}
                  prefix={<CheckOutlined />}
                  valueStyle={{ color: "#52c41a" }}
                />
              </Card>
            </Col>
            <Col xs={24} sm={12} md={8} lg={4}>
              <Card>
                <Statistic
                  title="Success Rate"
                  value={
                    totalContainers > 0
                      ? Math.round(
                          (completedContainers / totalContainers) * 100
                        )
                      : 0
                  }
                  prefix={<CheckOutlined />}
                  suffix="%"
                  valueStyle={{ color: "#52c41a" }}
                />
              </Card>
            </Col>
          </Row>

          {/* Filters */}
          <Card className="mb-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-4">
              <Input
                placeholder="Search containers..."
                prefix={<SearchOutlined />}
                value={searchText}
                onChange={(e) => handleSearch(e.target.value)}
                allowClear
              />
              <Select
                placeholder="Filter by status"
                value={statusFilter}
                onChange={handleFilterChange(setStatusFilter)}
                allowClear
              >
                {statusOptions.map((option) => (
                  <Option key={option.value} value={option.value}>
                    {option.label}
                  </Option>
                ))}
              </Select>
              <Input
                placeholder="Departure city"
                value={departureCityFilter}
                onChange={(e) =>
                  handleFilterChange(setDepartureCityFilter)(e.target.value)
                }
                allowClear
              />
              <Input
                placeholder="Destination city"
                value={destinationCityFilter}
                onChange={(e) =>
                  handleFilterChange(setDestinationCityFilter)(e.target.value)
                }
                allowClear
              />
              <RangePicker
                placeholder={["From date", "To date"]}
                value={dateRange}
                onChange={setDateRange}
              />
            </div>
          </Card>

          {/* Containers Table */}
          <Card>
            <Table
              columns={columns}
              dataSource={containers?.data || []}
              loading={isLoading}
              rowKey="id"
              pagination={{
                current: currentPage,
                pageSize,
                total: containers?.meta?.totalItems || 0,
                showSizeChanger: true,
                showQuickJumper: true,
                showTotal: (total, range) =>
                  `${range[0]}-${range[1]} of ${total} containers`,
                onChange: (page, size) => {
                  setCurrentPage(page);
                  setPageSize(size);
                },
              }}
            />
          </Card>

          {/* Create Container Modal */}
          <Modal
            title="Create New Container"
            open={isCreateModalVisible}
            onCancel={() => {
              setIsCreateModalVisible(false);
              createForm.resetFields();
            }}
            footer={null}
            width={800}
          >
            <Form
              form={createForm}
              layout="vertical"
              onFinish={handleCreateContainer}
              initialValues={{
                status: ContainerStatus.PLANNED,
              }}
            >
              <Row gutter={16}>
                <Col span={12}>
                  <Form.Item
                    name="containerNumber"
                    label="Container Number"
                    rules={[
                      {
                        required: true,
                        message: "Please enter container number",
                      },
                    ]}
                  >
                    <Input />
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item
                    name="containerType"
                    label="Container Type"
                    rules={[
                      { required: true, message: "Please select container type" },
                    ]}
                  >
                    <Select>
                      <Option value="CONTAINER">Container (Sea Freight)</Option>
                      <Option value="BAG">Bag (Air Freight)</Option>
                    </Select>
                  </Form.Item>
                </Col>
              </Row>

              <Row gutter={16}>
                <Col span={12}>
                  <Form.Item
                    name="status"
                    label="Status"
                    rules={[
                      { required: true, message: "Please select status" },
                    ]}
                  >
                    <Select>
                      {statusOptions.map((option) => (
                        <Option key={option.value} value={option.value}>
                          {option.label}
                        </Option>
                      ))}
                    </Select>
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item name="vesselFlight" label="Vessel/Flight Number">
                    <Input placeholder="e.g., MSC ALTA or EK 787" />
                  </Form.Item>
                </Col>
              </Row>

              <Row gutter={16}>
                <Col span={12}>
                  <Form.Item
                    name="departureCity"
                    label="Departure City"
                    rules={[
                      {
                        required: true,
                        message: "Please enter departure city",
                      },
                    ]}
                  >
                    <Input />
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item
                    name="destinationCity"
                    label="Destination City"
                    rules={[
                      {
                        required: true,
                        message: "Please enter destination city",
                      },
                    ]}
                  >
                    <Input />
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
                    <DatePicker showTime className="w-full" />
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item
                    name="eta"
                    label="ETA"
                    rules={[{ required: true, message: "Please select ETA" }]}
                  >
                    <DatePicker showTime className="w-full" />
                  </Form.Item>
                </Col>
              </Row>

              <Form.Item name="notes" label="Notes">
                <Input.TextArea rows={3} />
              </Form.Item>

              <Form.Item>
                <Space>
                  <Button type="primary" htmlType="submit" loading={isCreating}>
                    Create Container
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

          {/* Edit Container Modal */}
          <Modal
            title="Edit Container"
            open={isEditModalVisible}
            onCancel={() => {
              setIsEditModalVisible(false);
              setEditingContainer(null);
              editForm.resetFields();
            }}
            footer={null}
            width={800}
          >
            <Form
              form={editForm}
              layout="vertical"
              onFinish={handleUpdateContainer}
            >
              <Row gutter={16}>
                <Col span={12}>
                  <Form.Item name="containerNumber" label="Container Number">
                    <Input />
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item name="status" label="Status">
                    <Select>
                      {statusOptions.map((option) => (
                        <Option key={option.value} value={option.value}>
                          {option.label}
                        </Option>
                      ))}
                    </Select>
                  </Form.Item>
                </Col>
              </Row>

              <Row gutter={16}>
                <Col span={12}>
                  <Form.Item name="departureCity" label="Departure City">
                    <Input />
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
                  <Form.Item name="loadingDate" label="Loading Date">
                    <DatePicker showTime className="w-full" />
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item name="eta" label="ETA">
                    <DatePicker showTime className="w-full" />
                  </Form.Item>
                </Col>
              </Row>

              <Form.Item name="notes" label="Notes">
                <Input.TextArea rows={3} />
              </Form.Item>

              <Form.Item>
                <Space>
                  <Button type="primary" htmlType="submit" loading={isUpdating}>
                    Update Container
                  </Button>
                  <Button
                    onClick={() => {
                      setIsEditModalVisible(false);
                      setEditingContainer(null);
                      editForm.resetFields();
                    }}
                  >
                    Cancel
                  </Button>
                </Space>
              </Form.Item>
            </Form>
          </Modal>

          {/* Status Update Modal */}
          <Modal
            title="Update Container Status"
            open={isStatusUpdateModalVisible}
            onCancel={() => {
              setIsStatusUpdateModalVisible(false);
              setUpdatingContainer(null);
            }}
            footer={null}
            width={400}
          >
            <div className="mb-4">
              <p>
                Update status for container:{" "}
                <strong>{updatingContainer?.containerNumber}</strong>
              </p>
            </div>
            <Form
              form={statusForm}
              layout="vertical"
              onFinish={() =>
                handleUpdateContainerStatus(updatingContainer!.id, newStatus)
              }
            >
              <Form.Item
                name="status"
                label="New Status"
                rules={[{ required: true, message: "Please select status" }]}
              >
                <Select value={newStatus} onChange={setNewStatus}>
                  {statusOptions.map((option) => (
                    <Option key={option.value} value={option.value}>
                      {option.label}
                    </Option>
                  ))}
                </Select>
              </Form.Item>

              <Form.Item>
                <Space>
                  <Button
                    type="primary"
                    htmlType="submit"
                    loading={isUpdatingStatus}
                  >
                    Update Status
                  </Button>
                  <Button
                    onClick={() => {
                      setIsStatusUpdateModalVisible(false);
                      setUpdatingContainer(null);
                    }}
                  >
                    Cancel
                  </Button>
                </Space>
              </Form.Item>
            </Form>
          </Modal>

          {/* Statistics Drawer */}
          <Drawer
            title={`Container Statistics - ${viewingContainer?.containerNumber}`}
            open={isStatisticsDrawerVisible}
            onClose={() => {
              setIsStatisticsDrawerVisible(false);
              setViewingContainer(null);
            }}
            width={600}
          >
            {isLoadingStatistics ? (
              <div className="text-center text-gray-500">
                Loading statistics...
              </div>
            ) : statisticsError ? (
              <div className="text-center text-red-500">
                <p>Error loading statistics</p>
                <p className="text-sm mt-2">
                  {statisticsError.message || "Failed to fetch container statistics"}
                </p>
                {viewingContainer?.id && (
                  <p className="text-xs mt-1">Container ID: {viewingContainer.id}</p>
                )}
              </div>
            ) : statistics ? (
              <div className="space-y-6">
                <Row gutter={16}>
                  <Col span={12}>
                    <Card>
                      <Statistic
                        title="Total Packing Lists"
                        value={statistics.totalPackingLists}
                        prefix={<BarChartOutlined />}
                      />
                    </Card>
                  </Col>
                  <Col span={12}>
                    <Card>
                      <Statistic
                        title="Total Packages"
                        value={statistics.totalPackages}
                        prefix={<BarChartOutlined />}
                      />
                    </Card>
                  </Col>
                </Row>

                <Row gutter={16}>
                  <Col span={12}>
                    <Card>
                      <Statistic
                        title="Total Weight"
                        value={statistics.totalWeight}
                        prefix={<BarChartOutlined />}
                        suffix="kg"
                      />
                    </Card>
                  </Col>
                  <Col span={12}>
                    <Card>
                      <Statistic
                        title="Total CBM"
                        value={statistics.totalCBM}
                        prefix={<BarChartOutlined />}
                      />
                    </Card>
                  </Col>
                </Row>

                <Card title="Status Breakdown">
                  <div className="space-y-3">
                    {statistics.statusBreakdown ? Object.entries(statistics.statusBreakdown).map(
                      ([status, count]) => (
                        <div key={status}>
                          <div className="flex justify-between">
                            <span>{status.replace("_", " ")}</span>
                            <span>{count}</span>
                          </div>
                          <Progress
                            percent={
                              statistics.totalPackingLists > 0
                                ? (count / statistics.totalPackingLists) * 100
                                : 0
                            }
                            size="small"
                          />
                        </div>
                      )
                    ) : (
                      <div className="text-gray-500 text-center">No status breakdown available</div>
                    )}
                  </div>
                </Card>

                <Card title="Container Details">
                  <div className="space-y-2">
                    <div>
                      <strong>Route:</strong> {viewingContainer?.departureCity}{" "}
                      → {viewingContainer?.destinationCity}
                    </div>
                    <div>
                      <strong>Loading Date:</strong>{" "}
                      {new Date(
                        viewingContainer?.loadingDate || ""
                      ).toLocaleDateString()}
                    </div>
                    <div>
                      <strong>ETA:</strong>{" "}
                      {new Date(
                        viewingContainer?.eta || ""
                      ).toLocaleDateString()}
                    </div>
                    <div>
                      <strong>Current Status:</strong>{" "}
                      {viewingContainer?.status.replace("_", " ")}
                    </div>
                    {viewingContainer?.notes && (
                      <div>
                        <strong>Notes:</strong> {viewingContainer.notes}
                      </div>
                    )}
                  </div>
                </Card>
              </div>
            ) : (
              <div className="text-center text-gray-500">
                No statistics available
              </div>
            )}
          </Drawer>
        </div>
      </AppLayout>
    </AuthGuard>
  );
}
