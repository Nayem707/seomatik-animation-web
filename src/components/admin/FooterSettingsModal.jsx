import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import toast from "react-hot-toast";
import Input from "@/components/common/Input";
import Button from "@/components/common/Button";
import Modal from "@/components/common/Modal";
import {
  saveStoreSettings,
  selectSettings,
  selectSettingsSaving,
} from "@/features/settings";
import { SOCIAL_LINK_KEYS } from "@/constants";

const SOCIAL_LINK_LABELS = {
  facebook: "Facebook page URL",
  instagram: "Instagram URL",
  tiktok: "TikTok URL",
  youtube: "YouTube channel URL",
  messenger: "Messenger URL (m.me/…)",
};
const isHttpUrl = (value) => /^https?:\/\//i.test(value);

const toFooterForm = (settings) => ({
  phone: settings?.phone || "",
  whatsapp: settings?.whatsapp || "",
  supportEmail: settings?.supportEmail || "",
  address: settings?.address || "",
  footerDescription: settings?.footerDescription || "",
  supportHours: settings?.supportHours || "",
  copyrightName: settings?.copyrightName || "",
  socialLinks: Object.fromEntries(
    SOCIAL_LINK_KEYS.map((key) => [key, settings?.socialLinks?.[key] || ""]),
  ),
});

export default function FooterSettingsModal({ open, onClose }) {
  const dispatch = useDispatch();
  const settings = useSelector(selectSettings);
  const saving = useSelector(selectSettingsSaving);
  const [footer, setFooter] = useState(() => toFooterForm(settings));
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (!open) return;
    setFooter(toFooterForm(settings));
    setErrors({});
    // Reset only when the editor opens so in-progress edits are kept.
  }, [open]);

  const brandName = (settings?.storeName || "").trim();

  const setField = (key) => (e) =>
    setFooter((prev) => ({ ...prev, [key]: e.target.value }));
  const setSocialLink = (key) => (e) =>
    setFooter((prev) => ({
      ...prev,
      socialLinks: { ...prev.socialLinks, [key]: e.target.value },
    }));

  const save = async () => {
    const supportEmail = footer.supportEmail.trim();
    const socialLinks = Object.fromEntries(
      SOCIAL_LINK_KEYS.map((key) => [key, footer.socialLinks[key].trim()]),
    );

    const nextErrors = {};
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(supportEmail)) {
      nextErrors.supportEmail = "Enter a valid email address";
    }
    SOCIAL_LINK_KEYS.forEach((key) => {
      if (socialLinks[key] && !isHttpUrl(socialLinks[key])) {
        nextErrors[key] = "Must start with http:// or https://";
      }
    });
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length) return;

    try {
      await dispatch(
        saveStoreSettings({
          phone: footer.phone.trim(),
          whatsapp: footer.whatsapp.trim(),
          supportEmail,
          address: footer.address.trim(),
          footerDescription: footer.footerDescription.trim(),
          supportHours: footer.supportHours.trim(),
          copyrightName: footer.copyrightName.trim(),
          socialLinks,
        }),
      ).unwrap();
      toast.success("Footer saved");
      onClose();
    } catch (err) {
      toast.error(typeof err === "string" ? err : "Failed to save footer");
    }
  };

  return (
    <Modal
      open={open}
      onClose={saving ? undefined : onClose}
      title="Footer Content"
      size="lg"
      footer={
        <>
          <Button variant="outline" onClick={onClose} disabled={saving}>
            Cancel
          </Button>
          <Button onClick={save} loading={saving}>
            Save / Update
          </Button>
        </>
      }
    >
      <div className="space-y-6">
        <p className="text-xs text-slate-500">
          Empty fields are hidden from the storefront footer. Phone and WhatsApp
          are also used on product pages. Brand name and logo are managed in
          Settings.
        </p>

        <div>
          <h4 className="text-sm font-semibold text-slate-900">Content</h4>
          <div className="mt-3 space-y-4">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-slate-700">
                Footer description
              </label>
              <textarea
                value={footer.footerDescription}
                onChange={setField("footerDescription")}
                rows={3}
                maxLength={500}
                className="input-base resize-none"
                disabled={saving}
              />
            </div>
            <Input
              label="Copyright name"
              value={footer.copyrightName}
              onChange={setField("copyrightName")}
              placeholder={brandName || "Brand name"}
              maxLength={200}
              hint={`Shown as: Copyright © ${new Date().getFullYear()} ${
                footer.copyrightName.trim() || brandName || "…"
              }. All rights reserved.`}
              disabled={saving}
            />
          </div>
        </div>

        <div>
          <h4 className="text-sm font-semibold text-slate-900">
            Contact details
          </h4>
          <div className="mt-3 grid gap-4 sm:grid-cols-2">
            <Input
              label="Phone"
              value={footer.phone}
              onChange={setField("phone")}
              placeholder="e.g. 01713881993"
              maxLength={40}
              disabled={saving}
            />
            <Input
              label="WhatsApp number"
              value={footer.whatsapp}
              onChange={setField("whatsapp")}
              placeholder="e.g. 01713881993"
              maxLength={40}
              disabled={saving}
            />
            <Input
              label="Email"
              type="email"
              value={footer.supportEmail}
              onChange={setField("supportEmail")}
              error={errors.supportEmail}
              disabled={saving}
            />
            <Input
              label="Helpline hours"
              value={footer.supportHours}
              onChange={setField("supportHours")}
              placeholder="e.g. Every day, 10 AM — 10 PM"
              maxLength={100}
              disabled={saving}
            />
            <div className="sm:col-span-2">
              <Input
                label="Address"
                value={footer.address}
                onChange={setField("address")}
                maxLength={300}
                disabled={saving}
              />
            </div>
          </div>
        </div>

        <div>
          <h4 className="text-sm font-semibold text-slate-900">Social links</h4>
          <p className="mt-1 text-xs text-slate-500">
            Leave a link empty to hide its icon. The WhatsApp and Call icons use
            the numbers above.
          </p>
          <div className="mt-3 grid gap-4 sm:grid-cols-2">
            {SOCIAL_LINK_KEYS.map((key) => (
              <Input
                key={key}
                label={SOCIAL_LINK_LABELS[key]}
                value={footer.socialLinks[key]}
                onChange={setSocialLink(key)}
                placeholder="https://…"
                error={errors[key]}
                disabled={saving}
              />
            ))}
          </div>
        </div>
      </div>
    </Modal>
  );
}
