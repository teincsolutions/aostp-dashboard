"use client";
import React, { useState, useEffect, useCallback } from "react";
import {
  Form,
  Input,
  Button,
  Card,
  Steps,
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
import { handleError } from "@/utils/forms/errorUtils";
import { PackageAssignmentPanel } from "@/components/PackageAssignmentPanel";

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
  const [packingList, setPackingList] = useState<PackingList>();
  const [containerModalVisible, setContainerModalVisible] = useState(false);
  const [loading, setLoading] = useState(false);

  // Forms
  const [basicInfoForm] = Form.useForm();
  const [containerForm] = Form.useForm();

  // React Query hooks
  const { data: activeContainers = [] } = useActiveContainers();
  const { createContainer, isCreating: isCreatingContainer } =
    useContainerMutations();

  const [selectedPackageIds, setSelectedPackageIds] = useState<string[]>([]);
  const {
    addPackagesToPackingList,
    isAddingPackages,
    finalizePackingList,
    isRemovingPackages,
    isFinalizing,
    removePackagesFromPackingList,
    createPackingList,
    isCreating,
  } = usePackingListMutations();

  const handleAssignPackages = () => {
    if (!packingList) return;

    try {
      addPackagesToPackingList.mutateAsync({
        id: packingList.id,
        packageIds: selectedPackageIds,
      });
      toast.success(`${selectedPackageIds.length} packages added successfully`);
      setSelectedPackageIds([]);
    } catch (error) {
      handleError(error);
    }
  };

  const handleFinalize = async () => {
    if (!packingList) return;
    try {
      await finalizePackingList.mutateAsync(packingList.id);
      toast.success(`Packing list finalized successfully`);
      setSelectedPackageIds([]);
    } catch (error) {
      handleError(error);
    }
  };

  const handleAddPackage = (packageId: string) => {
    if (!selectedPackageIds.includes(packageId)) {
      setSelectedPackageIds((prev) => [...prev, packageId]);
    }
  };

  const handleRemovePackage = (packageId: string) => {
    if (!packingList) return;
    try {
      removePackagesFromPackingList.mutateAsync({
        id: packingList.id!,
        packageIds: packageId,
      });
      setSelectedPackageIds((prev) => prev.filter((id) => id !== packageId));
    } catch (error) {
      handleError(error);
    }
  };

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
      if (!packingList) {
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

  useEffect(() => {
    if (createPackingList.data && createPackingList.data) {
      toast.success("Packing list created successfully");
      setPackingList(createPackingList.data);
      setCurrentStep(1);
    }
  }, [createPackingList.data]);

  // Create packing list after container selection
  const handleCreatePackingList = async () => {
    try {
      const values = await basicInfoForm.validateFields();
      setPackingList((prev) => ({ ...prev, ...values }));

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
    if (!packingList) return;

    try {
      await finalizePackingList.mutateAsync(packingList.id!);
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
                <PackageAssignmentPanel
                  packingList={packingList}
                  selectedPackageIds={selectedPackageIds}
                  isRemovingPackages={isRemovingPackages}
                  handleAddPackage={handleAddPackage}
                  handleRemovePackage={handleRemovePackage}
                />
              </div>
            )}

            {currentStep === 2 && (
              // Step 3: Finalize
              <div className="space-y-4">
                <Title level={4}>Review & Finalize Packing List</Title>

                <Card size="small" title="Basic Information">
                  <Row gutter={16}>
                    <Col xs={24} sm={12}>
                      <Text strong>Name:</Text> {packingList?.name}
                    </Col>
                    <Col xs={24} sm={12}>
                      <Text strong>Destination City:</Text>{" "}
                      {packingList?.destinationCity}
                    </Col>
                  </Row>
                  <Row gutter={16} className="mt-2">
                    <Col xs={24} sm={12}>
                      <Text strong>Loading Date:</Text>{" "}
                      {packingList?.loadingDate
                        ? dayjs(packingList.loadingDate).format("DD/MM/YYYY")
                        : "N/A"}
                    </Col>
                    <Col xs={24} sm={12}>
                      <Text strong>ETA:</Text>{" "}
                      {packingList?.eta
                        ? dayjs(packingList.eta).format("DD/MM/YYYY")
                        : "N/A"}
                    </Col>
                  </Row>
                </Card>

                <Card size="small" title="Summary">
                  <Row gutter={16}>
                    <Col xs={24} sm={12} md={6}>
                      <Text strong>Packages:</Text>{" "}
                      {packingList?.totalPackages || 0}
                    </Col>
                    <Col xs={24} sm={12} md={6}>
                      <Text strong>Total Weight:</Text>{" "}
                      {packingList?.totalWeight?.toFixed(2)} kg
                    </Col>
                    <Col xs={24} sm={12} md={6}>
                      <Text strong>Total CBM:</Text>{" "}
                      {packingList?.totalCBM?.toFixed(3)}
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
                          !packingList || selectedPackageIds.length === 0
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
              <div className="flex gap-2">
                <Button
                  key="confirm"
                  type="default"
                  onClick={handleAssignPackages}
                  loading={isAddingPackages}
                  disabled={selectedPackageIds.length === 0}
                >
                  Add Selected Packages ({selectedPackageIds.length})
                </Button>
                ,
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
                  disabled={
                    isCreating ||
                    isFinalizing ||
                    packingList?.totalPackages === 0
                  }
                  icon={<RightOutlined />}
                  iconPosition="end"
                >
                  {currentStep === 0 && "Save &"} Next
                </Button>
              </div>
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
