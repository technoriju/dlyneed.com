"use client";

import React, { useState } from "react";
import { btnDanger, btnPrimary, btnSecondary } from "@/components/ui/button";
import { useToast } from "@/components/ui/Toast";
import { INDIAN_STATES } from "@/lib/constants";

export interface AddressItem {
  id: string;
  name: string;
  phone: string;
  line1: string;
  line2?: string | null;
  city: string;
  state: string;
  pincode: string;
  type: string;
  isDefault: boolean;
}

interface AddressesViewProps {
  initialAddresses: AddressItem[];
}

export function AddressesView({ initialAddresses }: AddressesViewProps) {
  const { showToast } = useToast();
  const [addresses, setAddresses] = useState<AddressItem[]>(initialAddresses);
  const [editMode, setEditMode] = useState<"new" | string | null>(null);

  // Form State
  const [formName, setFormName] = useState("");
  const [formPhone, setFormPhone] = useState("");
  const [formPin, setFormPin] = useState("");
  const [formCity, setFormCity] = useState("");
  const [formLine1, setFormLine1] = useState("");
  const [formLine2, setFormLine2] = useState("");
  const [formState, setFormState] = useState("");
  const [formType, setFormType] = useState<"Home" | "Work" | "Other">("Home");
  const [formDefault, setFormDefault] = useState(false);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);

  const startAdd = () => {
    setFormName("");
    setFormPhone("");
    setFormPin("");
    setFormCity("");
    setFormLine1("");
    setFormLine2("");
    setFormState(INDIAN_STATES[0]);
    setFormType("Home");
    setFormDefault(addresses.length === 0);
    setFormErrors({});
    setEditMode("new");
  };

  const startEdit = (addr: AddressItem) => {
    setFormName(addr.name);
    setFormPhone(addr.phone);
    setFormPin(addr.pincode);
    setFormCity(addr.city);
    setFormLine1(addr.line1);
    setFormLine2(addr.line2 || "");
    setFormState(addr.state);
    setFormType((addr.type as "Home" | "Work" | "Other") || "Home");
    setFormDefault(addr.isDefault);
    setFormErrors({});
    setEditMode(addr.id);
  };

  const cancelForm = () => {
    setEditMode(null);
    setFormErrors({});
  };

  const validateForm = () => {
    const errs: Record<string, string> = {};
    if (formName.trim().length < 2) errs.name = "Enter full name";
    if (!/^[6-9]\d{9}$/.test(formPhone.trim()))
      errs.phone = "Enter a 10-digit mobile number starting with 6–9";
    if (!/^[1-9]\d{5}$/.test(formPin.trim()))
      errs.pin = "Enter a valid 6-digit pincode";
    if (formLine1.trim().length < 5)
      errs.line1 = "Enter flat, house no., building, street";
    if (formCity.trim().length < 2) errs.city = "Enter city";
    if (!formState) errs.state = "Select state";

    setFormErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    setSubmitting(true);
    try {
      if (editMode === "new") {
        const res = await fetch("/api/addresses", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: formName.trim(),
            phone: formPhone.trim(),
            line1: formLine1.trim(),
            line2: formLine2.trim() || undefined,
            city: formCity.trim(),
            state: formState,
            pincode: formPin.trim(),
            type: formType,
            isDefault: formDefault,
          }),
        });

        const data = await res.json();
        if (!res.ok) {
          showToast(data.error || "Failed to create address");
          return;
        }

        const newAddr = data.address;
        setAddresses((prev) => {
          if (newAddr.isDefault) {
            return [newAddr, ...prev.map((a) => ({ ...a, isDefault: false }))];
          }
          return [...prev, newAddr];
        });
        showToast("Address saved");
        setEditMode(null);
      } else {
        // Edit existing address
        const res = await fetch("/api/addresses", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            id: editMode,
            name: formName.trim(),
            phone: formPhone.trim(),
            line1: formLine1.trim(),
            line2: formLine2.trim() || undefined,
            city: formCity.trim(),
            state: formState,
            pincode: formPin.trim(),
            type: formType,
            isDefault: formDefault,
          }),
        });

        const data = await res.json();
        if (!res.ok) {
          showToast(data.error || "Failed to update address");
          return;
        }

        const updated = data.address;
        setAddresses((prev) =>
          prev.map((a) => {
            if (a.id === updated.id) return updated;
            if (updated.isDefault) return { ...a, isDefault: false };
            return a;
          })
        );
        showToast("Address updated");
        setEditMode(null);
      }
    } catch {
      showToast("Network error. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleSetDefault = async (id: string) => {
    try {
      const res = await fetch("/api/addresses", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, isDefault: true }),
      });
      if (res.ok) {
        setAddresses((prev) =>
          prev.map((a) => ({
            ...a,
            isDefault: a.id === id,
          }))
        );
        showToast("Default address updated");
      } else {
        showToast("Failed to update default address");
      }
    } catch {
      showToast("Network error");
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const res = await fetch(`/api/addresses?id=${encodeURIComponent(id)}`, {
        method: "DELETE",
      });
      if (res.ok) {
        setAddresses((prev) => {
          const filtered = prev.filter((a) => a.id !== id);
          // If deleted address was default, make first remaining default
          const wasDefault = prev.find((a) => a.id === id)?.isDefault;
          if (wasDefault && filtered.length > 0) {
            filtered[0].isDefault = true;
          }
          return filtered;
        });
        showToast("Address deleted");
      } else {
        showToast("Failed to delete address");
      }
    } catch {
      showToast("Network error");
    }
  };

  return (
    <div>
      {/* Page Header */}
      <div className="mb-4.5 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-[clamp(24px,3.2vw,30px)] font-bold tracking-tight text-ink-900">
            Saved Addresses
          </h1>
          <p className="mt-1 text-sm text-ink-500">
            {addresses.length} address{addresses.length === 1 ? "" : "es"}
          </p>
        </div>
        {editMode === null && (
          <button
            type="button"
            onClick={startAdd}
            className={`${btnPrimary} !h-10 !px-4 !text-xs cursor-pointer`}
          >
            + Add new address
          </button>
        )}
      </div>

      {/* Inline Address Form */}
      {editMode !== null && (
        <section className="mb-5.5 rounded-xl border border-border bg-surface p-5.5 shadow-sm">
          <h2 className="mb-4 text-base font-bold text-ink-900">
            {editMode === "new" ? "Add a new address" : "Edit address"}
          </h2>

          <form onSubmit={handleFormSubmit} className="grid grid-cols-1 gap-4 sm:grid-cols-2" noValidate>
            {/* Full Name */}
            <div className="flex flex-col gap-1">
              <label htmlFor="a-name" className="text-xs font-semibold text-ink-700 uppercase tracking-wider">
                Full name
              </label>
              <input
                id="a-name"
                type="text"
                value={formName}
                onChange={(e) => setFormName(e.target.value)}
                placeholder="Receiver's name"
                className={`h-11 rounded-lg border bg-surface px-3.5 text-sm text-ink-900 outline-none transition-colors focus:border-brand-600 focus:ring-1 focus:ring-brand-600 ${
                  formErrors.name ? "border-bad" : "border-border-strong"
                }`}
              />
              {formErrors.name && <span className="text-xs text-bad">{formErrors.name}</span>}
            </div>

            {/* Mobile number */}
            <div className="flex flex-col gap-1">
              <label htmlFor="a-phone" className="text-xs font-semibold text-ink-700 uppercase tracking-wider">
                Mobile number
              </label>
              <div className="flex h-11 items-center rounded-lg border border-border-strong bg-surface px-3.5 text-sm text-ink-900 focus-within:border-brand-600 focus-within:ring-1 focus-within:ring-brand-600">
                <span className="font-medium text-ink-500 mr-2">+91</span>
                <input
                  id="a-phone"
                  type="tel"
                  value={formPhone}
                  onChange={(e) => setFormPhone(e.target.value.replace(/\D/g, "").slice(0, 10))}
                  placeholder="10-digit mobile"
                  className="w-full bg-transparent outline-none"
                />
              </div>
              {formErrors.phone && <span className="text-xs text-bad">{formErrors.phone}</span>}
            </div>

            {/* Pincode */}
            <div className="flex flex-col gap-1">
              <label htmlFor="a-pin" className="text-xs font-semibold text-ink-700 uppercase tracking-wider">
                Pincode
              </label>
              <input
                id="a-pin"
                type="text"
                value={formPin}
                onChange={(e) => setFormPin(e.target.value.replace(/\D/g, "").slice(0, 6))}
                placeholder="6-digit pincode"
                className={`h-11 rounded-lg border bg-surface px-3.5 text-sm text-ink-900 outline-none transition-colors focus:border-brand-600 focus:ring-1 focus:ring-brand-600 ${
                  formErrors.pin ? "border-bad" : "border-border-strong"
                }`}
              />
              {formErrors.pin && <span className="text-xs text-bad">{formErrors.pin}</span>}
            </div>

            {/* City */}
            <div className="flex flex-col gap-1">
              <label htmlFor="a-city" className="text-xs font-semibold text-ink-700 uppercase tracking-wider">
                City / District
              </label>
              <input
                id="a-city"
                type="text"
                value={formCity}
                onChange={(e) => setFormCity(e.target.value)}
                placeholder="City"
                className={`h-11 rounded-lg border bg-surface px-3.5 text-sm text-ink-900 outline-none transition-colors focus:border-brand-600 focus:ring-1 focus:ring-brand-600 ${
                  formErrors.city ? "border-bad" : "border-border-strong"
                }`}
              />
              {formErrors.city && <span className="text-xs text-bad">{formErrors.city}</span>}
            </div>

            {/* Address Line 1 */}
            <div className="sm:col-span-2 flex flex-col gap-1">
              <label htmlFor="a-line1" className="text-xs font-semibold text-ink-700 uppercase tracking-wider">
                Flat, House no., Building, Street
              </label>
              <input
                id="a-line1"
                type="text"
                value={formLine1}
                onChange={(e) => setFormLine1(e.target.value)}
                placeholder="e.g. 402, Green Valley Apartments"
                className={`h-11 rounded-lg border bg-surface px-3.5 text-sm text-ink-900 outline-none transition-colors focus:border-brand-600 focus:ring-1 focus:ring-brand-600 ${
                  formErrors.line1 ? "border-bad" : "border-border-strong"
                }`}
              />
              {formErrors.line1 && <span className="text-xs text-bad">{formErrors.line1}</span>}
            </div>

            {/* Address Line 2 */}
            <div className="sm:col-span-2 flex flex-col gap-1">
              <label htmlFor="a-line2" className="text-xs font-semibold text-ink-700 uppercase tracking-wider">
                Area, Colony, Landmark <span className="font-normal text-ink-500 normal-case">(optional)</span>
              </label>
              <input
                id="a-line2"
                type="text"
                value={formLine2}
                onChange={(e) => setFormLine2(e.target.value)}
                placeholder="e.g. Near City Mall"
                className="h-11 rounded-lg border border-border-strong bg-surface px-3.5 text-sm text-ink-900 outline-none transition-colors focus:border-brand-600 focus:ring-1 focus:ring-brand-600"
              />
            </div>

            {/* State */}
            <div className="flex flex-col gap-1">
              <label htmlFor="a-state" className="text-xs font-semibold text-ink-700 uppercase tracking-wider">
                State
              </label>
              <select
                id="a-state"
                value={formState}
                onChange={(e) => setFormState(e.target.value)}
                className={`h-11 rounded-lg border bg-surface px-3.5 text-sm text-ink-900 outline-none transition-colors focus:border-brand-600 focus:ring-1 focus:ring-brand-600 cursor-pointer ${
                  formErrors.state ? "border-bad" : "border-border-strong"
                }`}
              >
                <option value="">Select state</option>
                {INDIAN_STATES.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
              {formErrors.state && <span className="text-xs text-bad">{formErrors.state}</span>}
            </div>

            {/* Address Type */}
            <div className="flex flex-col gap-1">
              <span className="text-xs font-semibold text-ink-700 uppercase tracking-wider">
                Address Type
              </span>
              <div className="flex h-11 items-center gap-2">
                {(["Home", "Work", "Other"] as const).map((t) => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => setFormType(t)}
                    className={`h-9 flex-1 cursor-pointer rounded-lg border px-3 text-xs font-semibold transition-colors ${
                      formType === t
                        ? "border-brand-600 bg-brand-100 text-brand-700"
                        : "border-border bg-surface text-ink-700 hover:border-border-strong"
                    }`}
                  >
                    {t}
                  </button>
                ))}
              </div>
            </div>

            {/* Default Address Checkbox */}
            <div className="sm:col-span-2">
              <label className="flex items-center gap-2.5 text-sm text-ink-700 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={formDefault}
                  onChange={(e) => setFormDefault(e.target.checked)}
                  className="size-4 rounded border-border-strong text-brand-600 accent-brand-600 focus:ring-brand-500"
                />
                <span>Set as default delivery address</span>
              </label>
            </div>

            {/* Form Actions */}
            <div className="sm:col-span-2 flex flex-wrap gap-3 pt-2">
              <button
                type="submit"
                disabled={submitting}
                className={`${btnPrimary} min-w-[140px] cursor-pointer disabled:opacity-50`}
              >
                {submitting ? "Saving..." : "Save address"}
              </button>
              <button
                type="button"
                onClick={cancelForm}
                className={btnSecondary}
                disabled={submitting}
              >
                Cancel
              </button>
            </div>
          </form>
        </section>
      )}

      {/* Address Cards Grid */}
      {addresses.length > 0 ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {addresses.map((addr) => (
            <article
              key={addr.id}
              className="relative flex flex-col justify-between rounded-xl border border-border bg-surface p-4.5 shadow-sm text-sm"
            >
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <b className="font-semibold text-ink-900">{addr.name}</b>
                  <span className="rounded bg-surface-muted px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-ink-700">
                    {addr.type}
                  </span>
                  {addr.isDefault && (
                    <span className="rounded bg-brand-100 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-brand-700">
                      Default
                    </span>
                  )}
                </div>

                <p className="text-ink-700">
                  {addr.line1}
                  {addr.line2 ? `, ${addr.line2}` : ""}
                </p>
                <p className="text-ink-700">
                  {addr.city}, {addr.state} {addr.pincode}
                </p>
                <p className="text-xs text-ink-500">Phone: +91 {addr.phone}</p>
              </div>

              {/* Action Buttons */}
              <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-border pt-3">
                <button
                  type="button"
                  onClick={() => startEdit(addr)}
                  className="cursor-pointer text-xs font-semibold text-ink-700 hover:text-brand-600 transition-colors"
                >
                  Edit
                </button>
                {!addr.isDefault && (
                  <>
                    <span className="text-border-strong">·</span>
                    <button
                      type="button"
                      onClick={() => handleSetDefault(addr.id)}
                      className="cursor-pointer text-xs font-semibold text-ink-700 hover:text-brand-600 transition-colors"
                    >
                      Set as default
                    </button>
                  </>
                )}
                <span className="text-border-strong">·</span>
                <button
                  type="button"
                  onClick={() => handleDelete(addr.id)}
                  className="cursor-pointer text-xs font-semibold text-bad hover:underline transition-colors"
                >
                  Delete
                </button>
              </div>
            </article>
          ))}
        </div>
      ) : (
        editMode === null && (
          <div className="grid justify-items-center gap-3 rounded-xl border border-dashed border-border-strong bg-surface p-12 text-center">
            <h2 className="text-lg font-semibold text-ink-900">No saved addresses</h2>
            <p className="max-w-[40ch] text-sm text-ink-500">
              Add an address to check out faster next time.
            </p>
            <button
              type="button"
              onClick={startAdd}
              className={`${btnPrimary} mt-2 cursor-pointer`}
            >
              Add address
            </button>
          </div>
        )
      )}
    </div>
  );
}
