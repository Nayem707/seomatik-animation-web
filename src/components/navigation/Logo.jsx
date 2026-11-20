import { useState } from "react";
import { Link } from "react-router-dom";
import { useSelector } from "react-redux";
import { ShoppingBagIcon } from "@heroicons/react/24/solid";
import { APP_NAME } from "@/constants";
import { selectSettings } from "@/features/settings";
import { classNames, resolveMediaUrl } from "@/utils";

export default function Logo({ className, textClassName, to = "/" }) {
  const settings = useSelector(selectSettings);
  const storeName = (settings?.storeName || "").trim() || APP_NAME;
  const logoUrl = (settings?.logoUrl || "").trim();
  const src = resolveMediaUrl(logoUrl);
  const [failedUrl, setFailedUrl] = useState("");
  const showImage = Boolean(src && failedUrl !== src);

  return (
    <Link to={to} className={classNames("flex items-center gap-2", className)}>
      {showImage ? (
        <img
          src={src}
          alt={storeName}
          className="h-9 w-auto max-w-40 object-contain"
          onError={() => setFailedUrl(src)}
        />
      ) : (
        <>
          <span className="bg-primary-600 flex h-9 w-9 items-center justify-center rounded-lg text-white shadow-sm">
            <ShoppingBagIcon className="h-5 w-5" />
          </span>
          <span
            className={classNames(
              "text-sm font-extrabold tracking-tight text-slate-900",
              textClassName,
            )}
          >
            {storeName}
          </span>
        </>
      )}
    </Link>
  );
}
