"use client";

import React, { useState } from "react";
import {
  Table,
  Button,
  Input,
  Select,
  Space,
  Form,
  Card,
  Row,
  Col,
  Statistic,
  Drawer,
  DatePicker,
  Progress,
} from "antd";
import { toast } from "sonner";
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
import dayjs from "dayjs";
import { getContainerColumns } from "@/app/containers/columns";
import {
  ContainerCreateModal,
  ContainerUpdateModal,
  ContainerStatusUpdateModal,
} from "@/components/ContainerModals";
import { handleError } from "@/utils/forms/errorUtils";
import { useCities } from "@/hooks/useCities";
import { City } from "@/types/exchangeRate";

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

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // Forms
  const [createForm] = Form.useForm();

  // React Query hooks
  const { data: containers, isLoading } = useContainers({
    page: currentPage,
    limit: pageSize,
    dateFrom: dateRange?.[0]?.format("YYYY-MM-DD"),
    dateTo: dateRange?.[1]?.format("YYYY-MM-DD"),
  });

  const {
    data: statistics,
    isLoading: isLoadingStatistics,
    error: statisticsError,
  } = useContainerStatistics(viewingContainer?.id || "");

  const { data: citiesData } = useCities({ limit: 100 });
  const cities = citiesData?.data || [];

  const getCityName = (cityId: string) => {
    const city = cities.find((c) => c.id === cityId);
    return city ? `${city.name}, ${city.country}` : cityId;
  };

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

  const handleCreateContainer = async (values: ContainerCreatePayload) => {
    try {
      await createContainer(values);
      setIsCreateModalVisible(false);
      toast.success("Container created successfully");
      createForm.resetFields();
    } catch (error) {
      handleError(error);
    }
  };
  const handleEditContainer = (container: Container) => {
    setEditingContainer(container);
    setIsEditModalVisible(true);
  };

  const handleUpdateContainer = async (
    containerId: string,
    payload: ContainerUpdatePayload
  ) => {
    try {
      await updateContainer({ id: containerId, containerData: payload });
      setIsEditModalVisible(false);
      setEditingContainer(null);
      toast.success("Container updated successfully");
      createForm.resetFields();
    } catch (error) {
      handleError(error);
    }
  };

  const handleDeleteContainer = async (id: string) => {
    try {
      await deleteContainer(id);
      toast.success("Container deleted successfully");
    } catch (error: any) {
      handleError(error);
    }
  };

  const handleUpdateContainerStatus = async (
    id: string,
    status: ContainerStatus
  ) => {
    try {
      await updateContainerStatus({ id, status });
      toast.success("Container status updated successfully");
      setIsStatusUpdateModalVisible(false);
      setUpdatingContainer(null);
    } catch (error: any) {
      handleError(error);
    }
  };

  const handleViewStatistics = (container: Container) => {
    setViewingContainer(container);
    setIsStatisticsDrawerVisible(true);
  };

  const handleExportManifest = async (id: string, format: ExportFormat) => {
    try {
      const result = await exportContainerManifest({ id, format });
      toast.success("Manifest exported successfully");
      // Open the download URL in a new tab
      if (result.downloadUrl) {
        window.open(result.downloadUrl, "_blank");
      }
    } catch (error: any) {
      console.log(error.response.data);
      toast.error("Failed to export manifest");
    }
  };

  // Table columns
  const handleStatusUpdateClick = (id: string, status: ContainerStatus) => {
    setUpdatingContainer(
      containers?.data?.find((c: Container) => c.id === id) || null
    );
    setIsStatusUpdateModalVisible(true);
  };

  const columns = getContainerColumns(
    handleEditContainer,
    handleDeleteContainer,
    handleStatusUpdateClick,
    handleViewStatistics,
    handleExportManifest,
    isDeleting,
    isUpdatingStatus,
    isExporting,
    cities
  );

  // Statistics
  const totalContainers = containers?.meta?.total || 0;
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
              className="max-md:w-full md:max-w-xs"
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
              <Select
                placeholder="Departure city"
                value={departureCityFilter}
                onChange={handleFilterChange(setDepartureCityFilter)}
                allowClear
                showSearch
              >
                {cities.map((city: City) => (
                  <Option key={city.id} value={city.id}>
                    {city.name}, {city.country}
                  </Option>
                ))}
              </Select>
              <Select
                placeholder="Destination city"
                value={destinationCityFilter}
                onChange={handleFilterChange(setDestinationCityFilter)}
                allowClear
                showSearch
              >
                {cities.map((city: City) => (
                  <Option key={city.id} value={city.id}>
                    {city.name}, {city.country}
                  </Option>
                ))}
              </Select>
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
              scroll={{ x: true }}
              pagination={{
                current: currentPage,
                pageSize,
                total: containers?.meta?.total || 0,
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
          <ContainerCreateModal
            isOpen={isCreateModalVisible}
            onClose={() => setIsCreateModalVisible(false)}
            onSubmit={handleCreateContainer}
            loading={isCreating}
          />

          {/* Edit Container Modal */}
          <ContainerUpdateModal
            container={editingContainer}
            isOpen={isEditModalVisible}
            onClose={() => {
              setIsEditModalVisible(false);
              setEditingContainer(null);
            }}
            onSubmit={handleUpdateContainer}
            loading={isUpdating}
          />

          {/* Status Update Modal */}
          <ContainerStatusUpdateModal
            container={updatingContainer}
            isOpen={isStatusUpdateModalVisible}
            onClose={() => {
              setIsStatusUpdateModalVisible(false);
              setUpdatingContainer(null);
            }}
            onSubmit={handleUpdateContainerStatus}
            loading={isUpdatingStatus}
          />

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
                  {statisticsError.message ||
                    "Failed to fetch container statistics"}
                </p>
                {viewingContainer?.id && (
                  <p className="text-xs mt-1">
                    Container ID: {viewingContainer.id}
                  </p>
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
                    {statistics.statusBreakdown ? (
                      Object.entries(statistics.statusBreakdown).map(
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
                      )
                    ) : (
                      <div className="text-gray-500 text-center">
                        No status breakdown available
                      </div>
                    )}
                  </div>
                </Card>

                <Card title="Container Details">
                  <div className="space-y-2">
                    <div>
                      <strong>Route:</strong>{" "}
                      {getCityName(viewingContainer?.departureCityId || "")} →{" "}
                      {getCityName(viewingContainer?.destinationCityId || "")}
                    </div>
                    <div>
                      <strong>Loading Date:</strong>{" "}
                      {dayjs(viewingContainer?.loadingDate).format(
                        "DD MMM, YYYY"
                      )}
                    </div>
                    <div>
                      <strong>ETA:</strong>{" "}
                      {dayjs(viewingContainer?.eta).format("DD MMM, YYYY")}
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
