"use client";
import { ShippingMode } from "@/types/exchangeRate";
import React, { useState, useEffect, useCallback } from "react";
import {
  Form,
  Input,
  Button,
  Card,
  Steps,
  Table,
  Space,
  Select,
  DatePicker,
  Row,
  Col,
  Typography,
  Alert,
  Popconfirm,
} from "antd";
import { toast } from "sonner";
import {
  LeftOutlined,
  RightOutlined,
  PlusOutlined,
  MinusOutlined,
} from "@ant-design/icons";
import { AppLayout } from "@/components/AppLayout";
import { AuthGuard } from "@/components/AuthGuard";
import { usePackingListMutations } from "@/hooks/usePackingLists";
import {
  useActiveContainers,
  useContainerMutations,
} from "@/hooks/useContainers";
import { useUnassignedPackages } from "@/hooks/usePackingLists";
import { useShippingRates } from "@/hooks/useShippingRates";
import {
  PackingListCreatePayload,
  PackageAssignment,
  PackingList,
} from "@/types/packingList";
import { Package } from "@/types/package";
import { ContainerCreatePayload } from "@/types/container";
import { useRouter } from "next/navigation";
import dayjs from "dayjs";
import { ContainerCreateModal } from "@/components/ContainerModals";
import { Role } from "@/types/user";
import {
  getServerValidationErrors,
  handleError,
} from "@/utils/forms/errorUtils";

const { Title, Text } = Typography;
const { Option } = Select;
const { Step } = Steps;

type PackageAssignmentWithCalc = PackageAssignment & {
  rate?: number;
  calculatedAmount?: number;
  currency?: string;
  unitType?: string; // 'CBM' or 'KG'
};

const PackingListCreatePage: React.FC = () => {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(0);
  const [packingListData, setPackingListData] = useState<Partial<PackingList>>(
    {}
  );
  const [selectedPackageIds, setSelectedPackageIds] = useState<string[]>([]);
  const [packageAssignments, setPackageAssignments] = useState<
    PackageAssignmentWithCalc[]
  >([]);
  const [containerModalVisible, setContainerModalVisible] = useState(false);
  const [loading, setLoading] = useState(false);

  // Forms
  const [basicInfoForm] = Form.useForm();
  const [containerForm] = Form.useForm();

  // React Query hooks
  const { data: activeContainers = [] } = useActiveContainers();

  // Show all active containers for selection
  const { data: unassignedPackages, isLoading: packagesLoading } =
    useUnassignedPackages({
      page: 1,
      limit: 100,
    });
  const { activeRates: shippingRates = [] } = useShippingRates();

  const {
    createPackingList,
    finalizePackingList,
    addPackagesToPackingList,
    removePackagesFromPackingList,
    isCreating,
    isFinalizing,
  } = usePackingListMutations();

  const { createContainer, isCreating: isCreatingContainer } =
    useContainerMutations();

  // Filter unassigned packages
  const availablePackages: Package[] =
    unassignedPackages?.filter(
      (pkg: { id: string }) => !selectedPackageIds.includes(pkg.id)
    ) || [];

  // Calculate package assignments with shipping rates
  useEffect(() => {
    if (selectedPackageIds.length > 0) {
      const assignments: PackageAssignmentWithCalc[] = selectedPackageIds
        .map((id) => {
          const pkg = unassignedPackages?.find((p) => p.id === id);
          if (!pkg) return null;

          // Find appropriate rate based on shipping mode and type
          const rate = shippingRates.find((r) => {
            if (pkg.shippingMode === r.shippingMode) {
              if (r.shippingMode === ShippingMode.AIR) {
                return r.airShippingType === pkg.airShippingType;
              }
              return true; // SEA mode matches all
            }
            return false;
          });

          let calculatedAmount = 0;
          let unitType = "CBM";
          let rateValue = 0;

          if (rate) {
            rateValue = rate.rate || 0;
            if (rate.shippingMode === ShippingMode.SEA) {
              // SEA: CBM × Rate
              calculatedAmount = pkg.cbm * (rate.rate || 0);
            } else {
              // AIR: Weight × Rate
              calculatedAmount = pkg.weight * (rate.rate || 0);
              unitType = "KG";
            }
          }

          return {
            packageId: pkg.id,
            trackingCode: pkg.trackingCode,
            description: pkg.description || "",
            weight: pkg.weight,
            cbm: pkg.cbm,
            customerId: pkg.customerId,
            customerName: `${pkg.customer?.firstName} ${pkg.customer?.lastName}`,
            rate: rateValue,
            calculatedAmount,
            currency: rate?.currency || "USD",
            unitType,
          };
        })
        .filter(Boolean) as PackageAssignmentWithCalc[];

      setPackageAssignments(assignments);
    } else {
      setPackageAssignments([]);
    }
  }, [selectedPackageIds, shippingRates, unassignedPackages]);

  // Totals calculation
  const totals = packageAssignments.reduce(
    (acc, pkg) => ({
      usdTotal:
        acc.usdTotal + (pkg.currency === "USD" ? pkg.calculatedAmount || 0 : 0),
      ghsTotal:
        acc.ghsTotal + (pkg.currency === "GHS" ? pkg.calculatedAmount || 0 : 0),
      weightTotal: acc.weightTotal + pkg.weight,
      cbmTotal: acc.cbmTotal + pkg.cbm,
    }),
    { usdTotal: 0, ghsTotal: 0, weightTotal: 0, cbmTotal: 0 }
  );

  // Step handlers
  const handleNext = useCallback(async () => {
    setCurrentStep(currentStep + 1);
  }, [currentStep]);

  const handlePrev = useCallback(() => {
    setCurrentStep(currentStep - 1);
  }, [currentStep]);

  const handleStepClick = async (step: number) => {
    // if packing list not created, prevent going to step 1 or 2
    if (step === 1) {
      if (!packingListData) {
        toast.error("Please create a packing list first");
        return;
      }
    }
    // if no packages selected, prevent going to step 2
    if (step === 2) {
      if (selectedPackageIds.length === 0) {
        toast.error("Please select at least one package");
        return;
      }
    }
    setCurrentStep(step);
  };

  // Package selection handlers
  const addPackage = async (packageId: string) => {
    setSelectedPackageIds((prev) => [...prev, packageId]);
  };

  useEffect(() => {
    if (createPackingList.data && createPackingList.data) {
      toast.success("Packing list created successfully");
      setPackingListData(createPackingList.data);
      setCurrentStep(1);
    }
  }, [createPackingList.data]);

  const removePackage = async (packageId: string) => {
    if (packingListData) {
        setSelectedPackageIds((prev) => prev.filter((id) => id !== packageId));
    } else {
      toast.error("Packing list not created yet");
      return;
    }
  };

  const handleAddPackages = async () => {
    if (selectedPackageIds.length === 0 && packingListData.id) {
      try {
        await addPackagesToPackingList.mutateAsync({
          id: packingListData.id,
          packageIds: selectedPackageIds,
        });
      } catch (error) {
        handleError(error);
      }
    } else {
      toast.error("No new packages to add");
    }
  };

  // Create packing list after container selection
  const handleCreatePackingList = async () => {
    if (!packingListData) return;

    try {
      const values = await basicInfoForm.validateFields();
      setPackingListData((prev) => ({ ...prev, ...values }));

      const createPayload: PackingListCreatePayload = {
        ...values,
        loadingDate: dayjs(values.loadingDate).format("YYYY-MM-DD"),
        eta: values.eta ? dayjs(values.eta).format("YYYY-MM-DD") : undefined,
      } as PackingListCreatePayload;
      await createPackingList.mutateAsync(createPayload);
    } catch (error: any) {
      toast.error(
        error.response?.data?.message || "Failed to create packing list"
      );
    }
  };

  const handleCreateContainer = async (values: ContainerCreatePayload) => {
    try {
      const container = await createContainer(values);
      setContainerModalVisible(false);
      toast.success("Container created successfully");
      containerForm.resetFields();
      basicInfoForm.setFieldValue("containerId", container.id);
    } catch (error) {
      handleError(error);
    }
  };

  // Finalize packing list
  const handleFinalizePackingList = async () => {
    if (!packingListData) return;

    try {
      await finalizePackingList.mutateAsync(packingListData.id!);
      toast.success(
        "Packing list finalized and invoices generated successfully"
      );
      router.push("/packing-lists");
    } catch (error: any) {
      toast.error(
        error.response?.data?.message || "Failed to finalize packing list"
      );
    }
  };

  // Finalize packing list creation
  const handleFinalize = async () => {
    try {
      setLoading(true);

      // Create the packing list first
      const createPayload: PackingListCreatePayload = {
        ...packingListData,
        loadingDate: dayjs(packingListData.loadingDate).format("YYYY-MM-DD"),
        eta: packingListData.eta
          ? dayjs(packingListData.eta).format("YYYY-MM-DD")
          : undefined,
        packageIds: selectedPackageIds,
      } as PackingListCreatePayload;

      createPackingList.mutate(createPayload);
      if (!createPackingList.data || !createPackingList.data.id) {
        toast.success(
          "Packing list created and invoices generated successfully"
        );
        router.push("/packing-lists");
      }
    } catch (error: any) {
      toast.error(
        error.response?.data?.message || "Failed to finalize packing list"
      );
    } finally {
      setLoading(false);
    }
  };

  // Package table columns for available packages
  const packageColumns = [
    {
      title: "Tracking Code",
      dataIndex: "trackingCode",
      key: "trackingCode",
    },
    {
      title: "Customer",
      dataIndex: "customer",
      key: "customer",
      render: (customer: any) => `${customer.firstName} ${customer.lastName}`,
    },
    {
      title: "Description",
      dataIndex: "description",
      key: "description",
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
      title: "Mode",
      dataIndex: "shippingMode",
      key: "shippingMode",
      render: (mode: string) => mode,
    },
    {
      title: "Actions",
      key: "actions",
      render: (_: any, record: Package) => (
        <Button
          type="link"
          icon={<PlusOutlined />}
          onClick={() => addPackage(record.id)}
          disabled={selectedPackageIds.includes(record.id)}
        >
          Add
        </Button>
      ),
    },
  ];

  // Selected packages table columns
  const selectedPackageColumns = [
    {
      title: "Tracking Code",
      dataIndex: "trackingCode",
      key: "trackingCode",
    },
    {
      title: "Customer",
      dataIndex: "customerName",
      key: "customerName",
    },
    {
      title: "Weight (kg)",
      dataIndex: "weight",
      key: "weight",
      render: (weight: number) => (weight ? weight.toFixed(2) : "N/A"),
    },
    {
      title: "CBM",
      dataIndex: "cbm",
      key: "cbm",
      render: (cbm: number) => (cbm ? cbm.toFixed(3) : "N/A"),
    },
    {
      title: "Unit Type",
      dataIndex: "unitType",
      key: "unitType",
    },
    {
      title: "Rate",
      dataIndex: "rate",
      key: "rate",
      render: (rate: number, record: PackageAssignmentWithCalc) =>
        `${record.currency} ${rate?.toFixed(2) || 0}`,
    },
    {
      title: "Amount",
      dataIndex: "calculatedAmount",
      key: "calculatedAmount",
      render: (amount: number, record: PackageAssignmentWithCalc) =>
        `${record.currency} ${amount?.toFixed(2) || 0}`,
    },
    {
      title: "Actions",
      key: "actions",
      render: (_: any, record: PackageAssignmentWithCalc) => (
        <Button
          type="link"
          danger
          icon={<MinusOutlined />}
          onClick={() => removePackage(record.packageId)}
        >
          Remove
        </Button>
      ),
    },
  ];

  return (
    <AuthGuard
      requiredRoles={[
        Role.SUPER_ADMIN,
        Role.OPERATIONS_CLERK,
        Role.FINANCE_MANAGER,
      ]}
    >
      <AppLayout>
        <div className="p-4 md:p-6 max-w-full md:max-w-6xl mx-auto">
          <div className="mb-6">
            <Title level={2}>Create New Packing List</Title>
            <Text type="secondary">
              Complete the steps below to create a new packing list
            </Text>
          </div>

          <Card className="mb-6">
            <Steps current={currentStep} onChange={handleStepClick}>
              <Step
                title="Create Packing List"
                description="Basic info & container selection"
              />
              <Step
                title="Package Assignment"
                description="Add/remove packages"
              />
              <Step title="Finalize" description="Complete packing list" />
            </Steps>
          </Card>

          {/* Step Content */}
          <Card>
            {currentStep === 0 && (
              // Step 1: Create Packing List (Basic Info + Container)
              <Form
                form={basicInfoForm}
                layout="vertical"
                initialValues={{
                  loadingDate: dayjs(),
                  eta: dayjs().add(40, "days"),
                }}
              >
                <Title level={4}>Basic Information</Title>
                <Row gutter={16}>
                  <Col xs={24} lg={12}>
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
                      <Input placeholder="e.g., PL-2025-001" />
                    </Form.Item>
                  </Col>
                  <Col xs={24} lg={12}>
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
                      <Input placeholder="e.g., Accra, Tema" />
                    </Form.Item>
                  </Col>
                </Row>

                <Row gutter={16}>
                  <Col xs={24} lg={12}>
                    <Form.Item
                      name="loadingDate"
                      label="Loading Date"
                      rules={[
                        {
                          required: true,
                          message: "Please select loading date",
                        },
                      ]}
                    >
                      <DatePicker className="w-full" />
                    </Form.Item>
                  </Col>
                  <Col xs={24} lg={12}>
                    <Form.Item
                      name="eta"
                      label="Estimated Time of Arrival"
                      rules={[
                        {
                          validator: async (_, value) => {
                            if (value) {
                              const selectedDate = dayjs(value);
                              const maxDate = dayjs().add(45, "days");
                              if (selectedDate.isAfter(maxDate)) {
                                throw new Error(
                                  "ETA cannot exceed 45 days from today"
                                );
                              }
                            }
                          },
                        },
                      ]}
                    >
                      <DatePicker className="w-full" />
                    </Form.Item>
                  </Col>
                  <Col xs={24} lg={12}>
                    <Form.Item name="notes" label="Notes">
                      <Input.TextArea rows={2} />
                    </Form.Item>
                  </Col>
                </Row>

                <Title level={4} style={{ marginTop: 24 }}>
                  Container Selection
                </Title>
                <Row gutter={16}>
                  <Col xs={20} lg={8}>
                    <Form.Item
                      name="containerId"
                      label="Select Container"
                      rules={[
                        {
                          required: true,
                          message: "Please select a container",
                        },
                      ]}
                    >
                      <Select
                        placeholder="Choose a container"
                        showSearch
                        filterOption={(input, option) =>
                          (option?.children?.toString() ?? "")
                            .toLowerCase()
                            .includes(input.toLowerCase())
                        }
                        notFoundContent={
                          activeContainers.length === 0
                            ? "No containers available"
                            : null
                        }
                      >
                        {activeContainers.map((container) => (
                          <Option key={container.id} value={container.id}>
                            {container.containerNumber} -{" "}
                            {container.destinationCity} (
                            {container.containerType})
                          </Option>
                        ))}
                      </Select>
                    </Form.Item>
                  </Col>
                  <Col xs={4} lg={4}>
                    <Button
                      type="default"
                      icon={<PlusOutlined />}
                      onClick={() => setContainerModalVisible(true)}
                      style={{ marginTop: 30 }}
                      block
                    >
                      <span className="hidden lg:block">Create New</span>
                    </Button>
                  </Col>
                </Row>
              </Form>
            )}

            {currentStep === 1 && (
              // Step 2: Package Assignment
              <div className="space-y-4">
                {!packingListData ? (
                  <Alert
                    message="Packing list not created"
                    description="Please create the packing list in the previous step first."
                    type="warning"
                    showIcon
                  />
                ) : (
                  <>
                    {/* Package Selection with Search/Filter */}
                    <div>
                      <Title level={4}>Available Packages</Title>
                      <Table
                        columns={packageColumns}
                        dataSource={availablePackages}
                        loading={packagesLoading}
                        rowKey="id"
                        pagination={{ pageSize: 10 }}
                        size="small"
                        scroll={{ x: true }}
                      />
                    </div>

                    {/* Assigned Packages */}
                    <div>
                      <Title level={4}>
                        Assigned Packages ({packageAssignments.length})
                      </Title>
                      <Table
                        columns={selectedPackageColumns}
                        dataSource={packageAssignments}
                        rowKey="packageId"
                        pagination={false}
                        size="small"
                        scroll={{ x: true }}
                        summary={() => (
                          <Table.Summary.Row>
                            <Table.Summary.Cell index={0} colSpan={3}>
                              <Text strong>Totals</Text>
                            </Table.Summary.Cell>
                            <Table.Summary.Cell index={1}>
                              <Text strong>
                                {totals.weightTotal.toFixed(2)} kg
                              </Text>
                            </Table.Summary.Cell>
                            <Table.Summary.Cell index={2}>
                              <Text strong>{totals.cbmTotal.toFixed(3)}</Text>
                            </Table.Summary.Cell>
                            <Table.Summary.Cell index={3} colSpan={4}>
                              <Space>
                                <Text strong>
                                  USD: ${totals.usdTotal.toFixed(2)}
                                </Text>
                                <Text strong>
                                  GHS: ₵{totals.ghsTotal.toFixed(2)}
                                </Text>
                              </Space>
                            </Table.Summary.Cell>
                          </Table.Summary.Row>
                        )}
                      />
                    </div>

                    {packageAssignments.some((p) => !p.rate) && (
                      <Alert
                        message="Warning"
                        description="Some packages don't have matching shipping rates. Please check shipping rates configuration."
                        type="warning"
                        showIcon
                      />
                    )}
                  </>
                )}
              </div>
            )}

            {currentStep === 2 && (
              // Step 3: Finalize
              <div className="space-y-4">
                <Title level={4}>Review & Finalize Packing List</Title>

                <Card size="small" title="Basic Information">
                  <Row gutter={16}>
                    <Col xs={24} sm={12}>
                      <Text strong>Name:</Text> {packingListData.name}
                    </Col>
                    <Col xs={24} sm={12}>
                      <Text strong>Destination City:</Text>{" "}
                      {packingListData.destinationCity}
                    </Col>
                  </Row>
                  <Row gutter={16} className="mt-2">
                    <Col xs={24} sm={12}>
                      <Text strong>Loading Date:</Text>{" "}
                      {packingListData.loadingDate
                        ? dayjs(packingListData.loadingDate).format(
                            "DD/MM/YYYY"
                          )
                        : "N/A"}
                    </Col>
                    <Col xs={24} sm={12}>
                      <Text strong>ETA:</Text>{" "}
                      {packingListData.eta
                        ? dayjs(packingListData.eta).format("DD/MM/YYYY")
                        : "N/A"}
                    </Col>
                  </Row>
                </Card>

                <Card size="small" title="Summary">
                  <Row gutter={16}>
                    <Col xs={24} sm={12} md={6}>
                      <Text strong>Packages:</Text> {packageAssignments.length}
                    </Col>
                    <Col xs={24} sm={12} md={6}>
                      <Text strong>Total Weight:</Text>{" "}
                      {totals.weightTotal.toFixed(2)} kg
                    </Col>
                    <Col xs={24} sm={12} md={6}>
                      <Text strong>Total CBM:</Text>{" "}
                      {totals.cbmTotal.toFixed(3)}
                    </Col>
                    <Col xs={24} sm={12} md={6}>
                      <Text strong>Total Value:</Text> $
                      {totals.usdTotal.toFixed(2)}
                    </Col>
                  </Row>
                </Card>

                <Alert
                  message="Important"
                  description="Finalizing will generate invoices for all assigned packages without currency conversion (per UC12)."
                  type="info"
                  showIcon
                />

                <div className="border-t pt-4 mt-6">
                  <Space>
                    <Popconfirm
                      title="Are you sure you want to finalize this packing list?"
                      description="This will generate invoices and complete the packing list."
                      onConfirm={handleFinalizePackingList}
                      okText="Yes, Finalize"
                      cancelText="Cancel"
                    >
                      <Button
                        type="primary"
                        size="large"
                        loading={isFinalizing}
                        disabled={
                          !packingListData || selectedPackageIds.length === 0
                        }
                      >
                        Finalize Packing List
                      </Button>
                    </Popconfirm>
                  </Space>
                </div>
              </div>
            )}
          </Card>

          {/* Navigation Buttons */}
          <div className="flex justify-between gap-4 mt-6 flex-wrap">
            <Button
              disabled={currentStep === 0}
              onClick={handlePrev}
              icon={<LeftOutlined />}
            >
              Previous
            </Button>

            {currentStep < 2 ? (
              <Button
                type="primary"
                onClick={() => {
                  if (currentStep === 0) {
                    handleCreatePackingList();
                  } else {
                    handleNext();
                  }
                }}
                loading={loading || isCreating}
                disabled={isCreating || isFinalizing}
                icon={<RightOutlined />}
                iconPosition="end"
              >
                {currentStep === 0 && "Save &"} Next
              </Button>
            ) : null}
          </div>

          {/* Container Creation Modal */}
          <ContainerCreateModal
            isOpen={containerModalVisible}
            loading={isCreatingContainer}
            onClose={() => setContainerModalVisible(false)}
            onSubmit={handleCreateContainer}
          />
        </div>
      </AppLayout>
    </AuthGuard>
  );
};

export default PackingListCreatePage;
