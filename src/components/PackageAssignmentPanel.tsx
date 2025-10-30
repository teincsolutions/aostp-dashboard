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
import { Customer } from "@/types/customer";
import { useCities } from "@/hooks/useCities";
import { usePackages } from "@/hooks/usePackages";
import { PackingListStatus } from "@/types/packingList";
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
  const shippingMode =
    containerTypeMap[packingListData?.container?.containerType || "BAG"];

  const { data: paginatedUnassignedPackages } = useUnassignedPackages({
    page: unassignedPage,
    shippingMode,
  });
  const { data: cities } = useCities();
  const { updateMutation } = usePackages();

  const [editingKey, setEditingKey] = useState<string | null>(null);
  const [tempPackage, setTempPackage] = useState<Partial<Package> | null>(null);

  const selectedPackages = useMemo(() => {
    return (
      paginatedUnassignedPackages?.filter((pkg) =>
        selectedPackageIds.includes(pkg.id)
      ) || []
    );
  }, [paginatedUnassignedPackages, selectedPackageIds]);

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
      title: shippingMode === ShippingMode.AIR ? "Weight (kg)" : "CBM",
      dataIndex: shippingMode === ShippingMode.AIR ? "weight" : "cbm",
      key: "weightOrCbm",
      width: 80,
      render: (value: number | null, record: Package) => {
        const isWeight = shippingMode === ShippingMode.AIR;
        const displayValue = isWeight
          ? value
            ? value.toFixed(2)
            : "0.00"
          : value
          ? value.toFixed(3)
          : "0.000";
        const tempValue = isWeight ? tempPackage?.weight : tempPackage?.cbm;

        if (editingKey === record.id) {
          return (
            <InputNumber
              value={tempValue ?? value ?? 0}
              onChange={(v) =>
                setTempPackage((prev) =>
                  prev ? { ...prev, [isWeight ? "weight" : "cbm"]: v } : null
                )
              }
              min={0}
              step={0.01}
              style={{ width: "100%" }}
            />
          );
        } else {
          return displayValue;
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
                      { id: editingKey, payload: tempPackage, packingListId },
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
      title: shippingMode === ShippingMode.AIR ? "Weight (kg)" : "CBM",
      dataIndex: shippingMode === ShippingMode.AIR ? "weight" : "cbm",
      key: "weightOrCbm",
      width: 80,
      render: (value: number) => {
        return shippingMode === ShippingMode.AIR
          ? value
            ? value.toFixed(2)
            : "0.00"
          : value
          ? value.toFixed(3)
          : "0.000";
      },
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
      title: shippingMode === ShippingMode.AIR ? "Weight (kg)" : "CBM",
      dataIndex: shippingMode === ShippingMode.AIR ? "weight" : "cbm",
      key: "weightOrCbm",
      width: 80,
      render: (value: number) => {
        return shippingMode === ShippingMode.AIR
          ? value
            ? value.toFixed(2)
            : "N/A"
          : value
          ? value.toFixed(3)
          : "N/A";
      },
    },
    {
      title: "Qty",
      dataIndex: "quantity",
      key: "quantity",
      width: 60,
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
            />
          </div>
        )}
      </div>
    </div>
  );
};
