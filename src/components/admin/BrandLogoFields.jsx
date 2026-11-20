import { useRef, useState } from "react";
import toast from "react-hot-toast";
import { ArrowUpTrayIcon } from "@heroicons/react/24/outline";
import { ShoppingBagIcon } from "@heroicons/react/24/solid";
import Input from "@/components/common/Input";
import Button from "@/components/common/Button";
import { api } from "@/services/api";
import { resolveMediaUrl } from "@/utils";

const LOGO_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
  "image/avif",
];
const LOGO_MAX_SIZE_MB = 5;

export default function BrandLogoFields({
  storeName,
  logoUrl,
  onStoreNameChange,
  onLogoUrlChange,
  storeNameError,
  logoUrlError,
  disabled = false,
}) {
  const [logoUploading, setLogoUploading] = useState(false);
  const [logoPreviewFailed, setLogoPreviewFailed] = useState(false);
  const logoInputRef = useRef(null);
  const brandName = (storeName || "").trim();
  const busy = disabled || logoUploading;

  const handleLogoFile = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    if (!LOGO_TYPES.includes(file.type)) {
      toast.error("Please select a JPG, PNG, WebP, GIF, or AVIF image");
      return;
    }
    if (file.size > LOGO_MAX_SIZE_MB * 1024 * 1024) {
      toast.error(`Image must be under ${LOGO_MAX_SIZE_MB}MB`);
      return;
    }

    setLogoUploading(true);
    try {
      const uploaded = await api.uploadImages(file);
      const first = Array.isArray(uploaded) ? uploaded[0] : uploaded;
      if (!first?.url) throw new Error("Upload did not return an image URL");
      onLogoUrlChange(first.url);
      setLogoPreviewFailed(false);
      toast.success("Logo uploaded — save to apply it");
    } catch (error) {
      toast.error(
        error?.response?.data?.error?.message ||
          error?.message ||
          "Failed to upload logo",
      );
    } finally {
      setLogoUploading(false);
    }
  };

  return (
    <div className="space-y-4">
      <Input
        label="Brand name"
        value={storeName}
        onChange={(e) => onStoreNameChange(e.target.value)}
        placeholder="e.g. ALIF ADDRESS SHOP"
        maxLength={120}
        error={storeNameError}
        hint="Used in the header, footer, and admin sidebar when no logo image is set."
        disabled={disabled}
        required
      />
      <div className="space-y-2">
        <Input
          label="Logo"
          value={logoUrl}
          onChange={(e) => {
            onLogoUrlChange(e.target.value);
            setLogoPreviewFailed(false);
          }}
          placeholder={`https://… (leave empty to show "${brandName || "brand name"}")`}
          error={logoUrlError}
          disabled={disabled}
        />
        <div className="flex flex-wrap items-center gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            leftIcon={ArrowUpTrayIcon}
            loading={logoUploading}
            disabled={disabled}
            onClick={() => logoInputRef.current?.click()}
          >
            {logoUploading ? "Uploading…" : "Upload logo"}
          </Button>
          {logoUrl && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              disabled={busy}
              onClick={() => {
                onLogoUrlChange("");
                setLogoPreviewFailed(false);
              }}
            >
              Remove logo
            </Button>
          )}
          {logoUrl.trim() && !logoPreviewFailed ? (
            <span className="inline-flex items-center rounded-lg border border-slate-200 bg-white px-2 py-1">
              <img
                src={resolveMediaUrl(logoUrl.trim())}
                alt="Logo preview"
                className="h-8 w-auto max-w-40 object-contain"
                onError={() => setLogoPreviewFailed(true)}
              />
            </span>
          ) : (
            brandName && (
              <span className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-2 py-1 text-xs font-extrabold tracking-tight text-slate-900">
                <span className="bg-primary-600 flex h-5 w-5 items-center justify-center rounded text-white">
                  <ShoppingBagIcon className="h-3 w-3" />
                </span>
                {brandName}
              </span>
            )
          )}
        </div>
        {logoPreviewFailed && (
          <p className="text-xs text-amber-600">
            Logo preview unavailable — brand name will show instead.
          </p>
        )}
        <p className="text-xs text-slate-500">
          One logo for the storefront header, footer, and admin sidebar.
        </p>
        <input
          ref={logoInputRef}
          type="file"
          accept={LOGO_TYPES.join(",")}
          className="hidden"
          onChange={handleLogoFile}
        />
      </div>
    </div>
  );
}

export const isValidLogoUrl = (value) => {
  const logoUrl = (value || "").trim();
  if (!logoUrl) return true;
  return /^https?:\/\//i.test(logoUrl) || logoUrl.startsWith("/");
};
