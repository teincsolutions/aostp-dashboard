import React, { useMemo, useState } from "react";
import {
  Table,
  Button,
  Alert,
  Space,
  Typography,
  Row,
  Col,
  InputNumber,
  Select,
  Tag,
} from "antd";
import { PlusOutlined, MinusOutlined, EditOutlined } from "@ant-design/icons";
import { Package, Currency, PackageStatusPackages } from "@/types/package";
import { ShippingMode } from "@/types/exchangeRate";
import { usePackingList, useUnassignedPackages } from "@/hooks/usePackingLists";
import { useShippingRates } from "@/hooks/useShippingRates";
import { Customer } from "@/types/customer";
import { useCities } from "@/hooks/useCities";
import { usePackages } from "@/hooks/usePackages";
import {
  getPackageWithCalculations,
  getPacklistTotals,
  PackageWithCalculations,
} from "@/utils/forms/getPacklistTotals";
import { PackingListStatus } from "@/types/packingList";
import { useExchangeRate } from "@/hooks/useExchangeRate";
import { packageStatusColors } from "@/app/packages/page";

const { Text } = Typography;

interface PackageAssignmentProps {
  packingListId: string;
  selectedPackageIds: string[];
  handleAddPackage: (id: string) => void;
  handleRemovePackage: (id: string) => void;
  isRemovingPackages: boolean;
}
const containerTypeMap = {
  CONTAINER: ShippingMode.SEA,
  BAG: ShippingMode.AIR,
};

export const PackageAssignmentPanel: React.FC<PackageAssignmentProps> = ({
  packingListId,
  selectedPackageIds,
  handleAddPackage,
  handleRemovePackage,
  isRemovingPackages,
}) => {
  const { data: packingListData } = usePackingList(packingListId || "");

  const [unassignedPage, setUnassignedPage] = useState(1);

  const { data: paginatedUnassignedPackages } = useUnassignedPackages({
    page: unassignedPage,
    shippingMode:
      containerTypeMap[packingListData?.container?.containerType || "BAG"],
  });
  const { useCurrentActiveRates } = useShippingRates();
  const { activeRate } = useExchangeRate();

  const { data: cities } = useCities();
  const { updateMutation } = usePackages();

  const [editingKey, setEditingKey] = useState<string | null>(null);
  const [tempPackage, setTempPackage] = useState<Partial<Package> | null>(null);

  const shippingMode =
    containerTypeMap[packingListData?.container?.containerType || "BAG"];
  // Get current shipping rate for calculations
  const { data: currentShippingRates } = useCurrentActiveRates(shippingMode);

  const selectedPackages = useMemo(() => {
    const filteredPackages =
      paginatedUnassignedPackages?.filter((pkg) =>
        selectedPackageIds.includes(pkg.id)
      ) || [];

    // Add calculations for each package
    return filteredPackages.map((pkg) => {
      return getPackageWithCalculations(
        pkg,
        shippingMode,
        currentShippingRates || []
      );
    });
  }, [
    paginatedUnassignedPackages,
    selectedPackageIds,
    currentShippingRates,
    shippingMode,
  ]);

  // Calculate totals for selected packages
  const totals = getPacklistTotals(
    selectedPackages,
    currentShippingRates,
    activeRate?.rate
  );

  // Assigned packages table columns
  const assignedPackageColumns = [
    {
      title: "Tracking Code",
      dataIndex: "trackingCode",
      key: "trackingCode",
      width: 120,
    },
    {
      title: "Customer",
      dataIndex: "customer",
      key: "customer",
      render: (customer: Customer) =>
        customer ? `${customer.firstName} ${customer.lastName}` : "N/A",
      width: 150,
    },
    {
      title: "Description",
      dataIndex: "description",
      key: "description",
      ellipsis: true,
      width: 200,
    },
    {
      title: "Weight (kg)",
      dataIndex: "weight",
      key: "weight",
      width: 100,
      render: (weight: number | null, record: Package) => {
        if (editingKey === record.id) {
          return (
            <InputNumber
              value={tempPackage?.weight ?? weight ?? 0}
              onChange={(v) =>
                setTempPackage((prev) => (prev ? { ...prev, weight: v } : null))
              }
              min={0}
              step={0.01}
              style={{ width: "100%" }}
            />
          );
        } else {
          return weight ? weight.toFixed(2) : "0.00";
        }
      },
    },
    {
      title: "CBM",
      dataIndex: "cbm",
      key: "cbm",
      width: 80,
      render: (cbm: number | null, record: Package) => {
        if (editingKey === record.id) {
          return (
            <InputNumber
              value={tempPackage?.cbm ?? cbm ?? 0}
              onChange={(v) =>
                setTempPackage((prev) => (prev ? { ...prev, cbm: v } : null))
              }
              min={0}
              step={0.01}
              style={{ width: "100%" }}
            />
          );
        } else {
          return cbm ? cbm.toFixed(3) : "0.000";
        }
      },
    },
    {
      title: "Destination City",
      dataIndex: "destinationCityId",
      key: "destinationCityId",
      width: 150,
      render: (destinationCityId: string, record: Package) => {
        if (editingKey === record.id) {
          return (
            <Select
              placeholder="Select city"
              style={{ width: "100%" }}
              value={
                tempPackage?.destinationCityId ?? destinationCityId ?? undefined
              }
              onChange={(value) =>
                setTempPackage((prev) =>
                  prev ? { ...prev, destinationCityId: value } : null
                )
              }
              allowClear
            >
              {cities?.data?.map((city) => (
                <Select.Option key={city.id} value={city.id}>
                  {city.name}
                </Select.Option>
              ))}
            </Select>
          );
        } else {
          const city = cities?.data?.find((c) => c.id === destinationCityId);
          return city ? city.name : "N/A";
        }
      },
    },
    {
      title: "Shipping Rate",
      dataIndex: "shippingRate",
      key: "shippingRate",
      width: 120,
      render: (shippingRate: number, record: Package) => {
        if (editingKey === record.id) {
          return (
            <InputNumber
              value={tempPackage?.shippingRate ?? shippingRate ?? 0}
              onChange={(v) =>
                setTempPackage((prev) =>
                  prev ? { ...prev, shippingRate: v } : null
                )
              }
              min={0}
              step={0.01}
              style={{ width: "100%" }}
              placeholder="0.00"
            />
          );
        } else {
          return shippingRate ? shippingRate.toFixed(2) : "0.00";
        }
      },
    },
    {
      title: "Shipping Cost",
      dataIndex: "shippingCost",
      key: "shippingCost",
      width: 120,
      render: (shippingCost: number) =>
        shippingCost ? shippingCost.toFixed(2) : "0.00",
    },
    {
      title: "Currency",
      dataIndex: "shippingCurrency",
      key: "shippingCurrency",
      width: 80,
      render: (shippingCurrency: Currency, record: Package) => {
        if (editingKey === record.id) {
          return (
            <Select
              value={
                tempPackage?.shippingCurrency ??
                shippingCurrency ??
                Currency.USD
              }
              onChange={(value) =>
                setTempPackage((prev) =>
                  prev ? { ...prev, shippingCurrency: value } : null
                )
              }
              style={{ width: "100%" }}
            >
              <Select.Option value={Currency.USD}>USD</Select.Option>
              <Select.Option value={Currency.GHS}>GHS</Select.Option>
            </Select>
          );
        } else {
          return shippingCurrency || Currency.USD;
        }
      },
    },
    {
      title: "Mode",
      dataIndex: "shippingMode",
      key: "shippingMode",
      width: 80,
      render: (mode: string) => mode,
    },
    {
      title: "Status",
      dataIndex: "status",
      key: "status",
      filters: Object.values(PackageStatusPackages).map((status) => ({
        text: status.replace("_", " "),
        value: status,
      })),
      width: 100,
      render: (status: PackageStatusPackages) => {
        return (
          <Tag color={packageStatusColors[status] || "default"}>
            {status.replace("_", " ")}
          </Tag>
        );
      },
    },
    {
      title: "Actions",
      key: "actions",
      width: 150,
      render: (_: any, record: Package) => {
        if (editingKey === record.id) {
          const isLoading = updateMutation.isPending;
          return (
            <Space>
              <Button
                type="primary"
                size="small"
                loading={isLoading}
                onClick={() => {
                  if (editingKey && tempPackage) {
                    updateMutation.mutate(
                      { id: editingKey, payload: tempPackage },
                      {
                        onSuccess: () => {
                          setEditingKey(null);
                          setTempPackage(null);
                        },
                        onError: () => {
                          // handle error if needed
                        },
                      }
                    );
                  }
                }}
              >
                Save
              </Button>
              <Button
                size="small"
                onClick={() => {
                  setEditingKey(null);
                  setTempPackage(null);
                }}
              >
                Cancel
              </Button>
            </Space>
          );
        } else {
          return (
            <Space>
              <Button
                type="link"
                icon={<EditOutlined />}
                onClick={() => {
                  setEditingKey(record.id);
                  setTempPackage({
                    weight: record.weight,
                    cbm: record.cbm,
                    destinationCityId: record.destinationCityId,
                    shippingCurrency: record.shippingCurrency || Currency.USD,
                    shippingRate: record.shippingRate,
                  });
                }}
                size="small"
                disabled={
                  packingListData?.status === PackingListStatus.FINALIZED
                }
              >
                Edit
              </Button>
              <Button
                type="link"
                danger
                icon={<MinusOutlined />}
                loading={isRemovingPackages}
                onClick={() => handleRemovePackage(record.id)}
                disabled={
                  packingListData?.status === PackingListStatus.FINALIZED
                }
                size="small"
              >
                Remove
              </Button>
            </Space>
          );
        }
      },
    },
  ];

  // Package table columns for available packages
  const availablePackageColumns = [
    {
      title: "Tracking Code",
      dataIndex: "trackingCode",
      key: "trackingCode",
      width: 120,
    },
    {
      title: "Customer",
      dataIndex: "customer",
      key: "customer",
      render: (customer: any) =>
        customer ? `${customer.firstName} ${customer.lastName}` : "N/A",
      width: 150,
    },
    {
      title: "Description",
      dataIndex: "description",
      key: "description",
      ellipsis: true,
      width: 200,
    },
    {
      title: "Weight (kg)",
      dataIndex: "weight",
      key: "weight",
      width: 100,
      render: (weight: number) => (weight ? weight.toFixed(2) : "0.00"),
    },
    {
      title: "CBM",
      dataIndex: "cbm",
      key: "cbm",
      width: 80,
      render: (cbm: number) => (cbm ? cbm.toFixed(3) : "0.000"),
    },
    {
      title: "Mode",
      dataIndex: "shippingMode",
      key: "shippingMode",
      width: 80,
      render: (mode: string) => mode,
    },
    {
      title: "Status",
      dataIndex: "status",
      key: "status",
      filters: Object.values(PackageStatusPackages).map((status) => ({
        text: status.replace("_", " "),
        value: status,
      })),
      width: 100,
      render: (status: PackageStatusPackages) => {
        return (
          <Tag color={packageStatusColors[status] || "default"}>
            {status.replace("_", " ")}
          </Tag>
        );
      },
    },
    {
      title: "Actions",
      key: "actions",
      width: 100,
      render: (_: any, record: Package) => (
        <Button
          type="link"
          icon={<PlusOutlined />}
          onClick={() => handleAddPackage(record.id)}
          size="small"
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
      width: 120,
    },
    {
      title: "Customer",
      dataIndex: "customer",
      key: "customer",
      render: (customer: Customer) =>
        customer ? `${customer.firstName} ${customer.lastName}` : "N/A",
      width: 150,
    },
    {
      title: "Weight (kg)",
      dataIndex: "weight",
      key: "weight",
      render: (weight: number) => (weight ? weight.toFixed(2) : "N/A"),
      width: 100,
    },
    {
      title: "CBM",
      dataIndex: "cbm",
      key: "cbm",
      render: (cbm: number) => (cbm ? cbm.toFixed(3) : "N/A"),
      width: 80,
    },
    {
      title: "Qty",
      dataIndex: "quantity",
      key: "quantity",
      width: 60,
    },
    {
      title: "Rate",
      dataIndex: "ratePerUnit",
      key: "ratePerUnit",
      width: 100,
      render: (rate: number, record: Package) =>
        rate ? `${rate.toFixed(2)}` : "No rate",
    },
    {
      title: "Amount",
      dataIndex: "calculatedAmount",
      key: "calculatedAmount",
      width: 100,
      render: (amount: number, record: Package) =>
        amount ? `${amount.toFixed(2)}` : "0.00",
    },
    {
      title: "Status",
      dataIndex: "status",
      key: "status",
      filters: Object.values(PackageStatusPackages).map((status) => ({
        text: status.replace("_", " "),
        value: status,
      })),
      width: 100,
      render: (status: PackageStatusPackages) => {
        return (
          <Tag color={packageStatusColors[status] || "default"}>
            {status.replace("_", " ")}
          </Tag>
        );
      },
    },
    {
      title: "Actions",
      key: "actions",
      width: 100,
      render: (_: any, record: Package) => (
        <Button
          type="link"
          danger
          icon={<MinusOutlined />}
          onClick={() => handleRemovePackage(record.id)}
          size="small"
        >
          Remove
        </Button>
      ),
    },
  ];

  return (
    <div className="space-y-4">
      {selectedPackages.length > 0 &&
        packingListData?.status === PackingListStatus.DRAFT && (
          <Alert
            message="Selected Packages Summary"
            description={
              <Row gutter={16}>
                <Col span={4}>
                  <Text strong>Packages:</Text> {totals?.packageCount}
                </Col>
                <Col span={4}>
                  <Text strong>Total Weight:</Text>{" "}
                  {totals?.weightTotal.toFixed(2)} kg
                </Col>
                <Col span={4}>
                  <Text strong>Total CBM:</Text> {totals?.cbmTotal.toFixed(3)}
                </Col>
                <Col span={6}>
                  <Space>
                    {totals?.usdTotal && (
                      <Text strong>USD: ${totals?.usdTotal.toFixed(2)}</Text>
                    )}
                    {totals?.ghsTotal && (
                      <Text strong>GHS: ₵{totals?.ghsTotal.toFixed(2)}</Text>
                    )}
                  </Space>
                </Col>
              </Row>
            }
            type="info"
            showIcon
          />
        )}

      <div className="grid grid-cols-1 gap-6">
        {/* Assigned Packages */}
        <div>
          <Text strong className="text-lg mb-2 block">
            Assigned Packages ({packingListData?.totalPackages})
          </Text>
          {packingListData?.status === "FINALIZED" && (
            <Alert
              message="This packing list is finalized. You cannot modify assigned packages."
              type="warning"
              showIcon
              className="mb-2"
            />
          )}
          {packingListData?.packages && packingListData.packages.length > 0 ? (
            <Table
              columns={assignedPackageColumns}
              dataSource={packingListData?.packages || []}
              rowKey="id"
              pagination={{
                pageSize: 10,
                showSizeChanger: false,
                showQuickJumper: false,
              }}
              scroll={{ y: 400 }}
              size="small"
            />
          ) : (
            <Text>No packages assigned to this packing list.</Text>
          )}
        </div>

        {/* Available Packages */}
        {packingListData?.status === PackingListStatus.DRAFT && (
          <div>
            <Text strong className="text-lg mb-2 block">
              Available Packages ({paginatedUnassignedPackages?.length || 0})
            </Text>
            <Table
              columns={availablePackageColumns}
              dataSource={paginatedUnassignedPackages || []}
              rowKey="id"
              pagination={{
                pageSize: 10,
                showSizeChanger: false,
                showQuickJumper: false,
                onChange: (page) => {
                  setUnassignedPage(page);
                },
              }}
              scroll={{ y: 400 }}
              size="small"
            />
          </div>
        )}

        {/* Selected Packages */}
        {packingListData?.status === PackingListStatus.DRAFT && (
          <div>
            <Text strong className="text-lg mb-2 block">
              Selected Packages ({selectedPackageIds.length})
            </Text>
            <Table
              columns={selectedPackageColumns}
              dataSource={selectedPackages}
              rowKey="id"
              pagination={false}
              scroll={{ y: 400 }}
              size="small"
              summary={() => (
                <Table.Summary.Row>
                  <Table.Summary.Cell index={0} colSpan={2}>
                    <Text strong>Totals</Text>
                  </Table.Summary.Cell>
                  <Table.Summary.Cell index={1}>
                    <Text strong>{totals?.weightTotal.toFixed(2)} kg</Text>
                  </Table.Summary.Cell>
                  <Table.Summary.Cell index={2}>
                    <Text strong>{totals?.cbmTotal.toFixed(3)}</Text>
                  </Table.Summary.Cell>
                  <Table.Summary.Cell index={3} colSpan={4}>
                    <Space>
                      {totals?.usdTotal && (
                        <Text strong>USD: ${totals?.usdTotal.toFixed(2)}</Text>
                      )}
                      {totals?.ghsTotal && (
                        <Text strong>GHS: ₵{totals?.ghsTotal.toFixed(2)}</Text>
                      )}
                    </Space>
                  </Table.Summary.Cell>
                </Table.Summary.Row>
              )}
            />
          </div>
        )}
      </div>

      {selectedPackages.some(
        (p: PackageWithCalculations) => !p.ratePerUnit
      ) && (
        <Alert
          message="Warning"
          description="Some packages don't have matching shipping rates. Please check shipping rates configuration."
          type="warning"
          showIcon
        />
      )}
    </div>
  );
};
