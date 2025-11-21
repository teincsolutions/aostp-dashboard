import { Spin } from "antd";

export default function Loading() {
  return (
    <div className="flex justify-center items-center min-h-screen">
      <Spin size="large" />
    </div>
  );
}
