"use client";
import { useState, useRef, useEffect } from "react";
import { Spin } from "antd";
import { PictureOutlined } from "@ant-design/icons";

interface LazyImageProps {
  src: string;
  alt: string;
  className?: string;
  style?: React.CSSProperties;
  onClick?: () => void;
}

export default function LazyImage({ src, alt, className, style, onClick }: LazyImageProps) {
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState(false);
  const imgRef = useRef<HTMLImageElement | null>(null);
  const observerRef = useRef<IntersectionObserver | null>(null);
  const [shouldLoad, setShouldLoad] = useState(false);

  useEffect(() => {
    if (!imgRef.current) return;
    observerRef.current = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setShouldLoad(true);
          observerRef.current?.disconnect();
        }
      },
      { rootMargin: "200px" },
    );
    observerRef.current.observe(imgRef.current);
    return () => observerRef.current?.disconnect();
  }, []);

  return (
    <div
      ref={imgRef}
      className={`relative overflow-hidden rounded ${className || ""}`}
      style={{ minHeight: 80, background: "#f3f4f6", ...style }}
      onClick={onClick}
    >
      {!loaded && !error && shouldLoad && (
        <div className="absolute inset-0 flex items-center justify-center">
          <Spin size="small" />
        </div>
      )}
      {!loaded && !error && !shouldLoad && (
        <div className="absolute inset-0 flex items-center justify-center">
          <PictureOutlined className="text-gray-300 text-xl" />
        </div>
      )}
      {error && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-100">
          <PictureOutlined className="text-gray-400 text-xl" />
        </div>
      )}
      {shouldLoad && (
        <img
          src={src}
          alt={alt}
          onLoad={() => setLoaded(true)}
          onError={() => setError(true)}
          className={`w-full h-full object-cover transition-opacity duration-300 ${
            loaded ? "opacity-100" : "opacity-0 absolute inset-0"
          }`}
          style={{ maxHeight: 200 }}
        />
      )}
    </div>
  );
}
