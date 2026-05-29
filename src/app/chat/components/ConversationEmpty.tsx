"use client";
import { Empty } from "antd";
import { MessageOutlined } from "@ant-design/icons";

export default function ConversationEmpty() {
  return (
    <div className="flex items-center justify-center h-full">
      <Empty
        image={<MessageOutlined style={{ fontSize: 64, color: "#d9d9d9" }} />}
        description="Select a conversation to view messages"
      />
    </div>
  );
}
