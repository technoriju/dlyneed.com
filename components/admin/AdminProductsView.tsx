"use client";

import Image from "next/image";
import Link from "next/link";
import React, { useState } from "react";
import { btnPrimary, btnSecondary } from "@/components/ui/button";
import { inr } from "@/lib/format";

export interface AdminProduct {
  id: string;
  slug: string;
  name: string;
  description: string;
  categoryId: string;
  category: { id: string; name: string; slug: string };
  images: any;
  pricePaise: number;
  mrpPaise: number;
  isActive: boolean;
  isBestSeller: boolean;
  totalStock: number;
  variants: Array<{
    id: string;
    value: string;
    sku: string;
    stock: number;
  }>;
}

interface AdminProductsViewProps {
  initialProducts: AdminProduct[];
  categories: Array<{ id: string; name: string; slug: string }>;
}

export function AdminProductsView({
  initialProducts,
  categories,
}: AdminProductsViewProps) {
  const [products, setProducts] = useState<AdminProduct[]>(initialProducts);
  const [search, setSearch] = useState("");
  const [selectedCat, setSelectedCat] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");

  // Modal State for Add / Edit
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<AdminProduct | null>(null);

  // Form Fields
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [description, setDescription] = useState("");
  const [categoryId, setCategoryId] = useState(categories[0]?.id || "");
  const [imageUrl, setImageUrl] = useState("");
  const [priceInr, setPriceInr] = useState("");
  const [mrpInr, setMrpInr] = useState("");
  const [isBestSeller, setIsBestSeller] = useState(false);
  const [isActive, setIsActive] = useState(true);
  const [optionName, setOptionName] = useState("Option");
  const [variantValue, setVariantValue] = useState("Standard");
  const [variantSku, setVariantSku] = useState("");
  const [variantStock, setVariantStock] = useState("50");

  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const filtered = products.filter((p) => {
    if (selectedCat !== "all" && p.category.slug !== selectedCat) return false;
    if (statusFilter === "active" && !p.isActive) return false;
    if (statusFilter === "inactive" && p.isActive) return false;
    if (
      search &&
      !p.name.toLowerCase().includes(search.toLowerCase()) &&
      !p.slug.toLowerCase().includes(search.toLowerCase())
    ) {
      return false;
    }
    return true;
  });

  const openAddModal = () => {
    setEditingProduct(null);
    setName("");
    setSlug("");
    setDescription("");
    setCategoryId(categories[0]?.id || "");
    setImageUrl("/images/products/backpack.jpg");
    setPriceInr("1999");
    setMrpInr("2999");
    setIsBestSeller(false);
    setIsActive(true);
    setOptionName("Colour");
    setVariantValue("Black");
    setVariantSku(`SKU-${Date.now().toString().slice(-4)}`);
    setVariantStock("50");
    setFormError(null);
    setIsModalOpen(true);
  };

  const openEditModal = (p: AdminProduct) => {
    setEditingProduct(p);
    setName(p.name);
    setSlug(p.slug);
    setDescription(p.description);
    setCategoryId(p.categoryId);
    const imgs = Array.isArray(p.images) ? p.images : [p.images];
    setImageUrl(imgs[0] || "/images/products/backpack.jpg");
    setPriceInr((p.pricePaise / 100).toString());
    setMrpInr((p.mrpPaise / 100).toString());
    setIsBestSeller(p.isBestSeller);
    setIsActive(p.isActive);
    setFormError(null);
    setIsModalOpen(true);
  };

  const handleNameChange = (val: string) => {
    setName(val);
    if (!editingProduct) {
      setSlug(
        val
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, "-")
          .replace(/^-|-$/g, "")
      );
    }
  };

  const handleSaveProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    const priceNum = Math.round(Number(priceInr) * 100);
    const mrpNum = Math.round(Number(mrpInr) * 100);

    if (isNaN(priceNum) || priceNum <= 0) {
      setFormError("Enter a valid price in rupees");
      return;
    }
    if (isNaN(mrpNum) || mrpNum <= 0) {
      setFormError("Enter a valid MRP in rupees");
      return;
    }

    setSaving(true);
    try {
      if (editingProduct) {
        // PATCH
        const res = await fetch(`/api/admin/products/${editingProduct.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: name.trim(),
            description: description.trim(),
            categoryId,
            images: [imageUrl.trim()],
            pricePaise: priceNum,
            mrpPaise: mrpNum,
            isBestSeller,
            isActive,
          }),
        });

        const data = await res.json();
        if (!res.ok) {
          setFormError(data.error || "Failed to update product");
          return;
        }

        setProducts((prev) =>
          prev.map((item) =>
            item.id === editingProduct.id
              ? {
                  ...item,
                  ...data.product,
                  totalStock: item.totalStock,
                }
              : item
          )
        );
        setIsModalOpen(false);
      } else {
        // CREATE
        const stockNum = parseInt(variantStock, 10) || 0;
        const res = await fetch("/api/admin/products", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: name.trim(),
            slug: slug.trim(),
            description: description.trim(),
            categoryId,
            images: [imageUrl.trim()],
            pricePaise: priceNum,
            mrpPaise: mrpNum,
            isBestSeller,
            isActive,
            optionName: optionName.trim(),
            variants: [
              {
                value: variantValue.trim(),
                sku: variantSku.trim() || `SKU-${slug}`,
                stock: stockNum,
              },
            ],
          }),
        });

        const data = await res.json();
        if (!res.ok) {
          setFormError(data.error || "Failed to create product");
          return;
        }

        const newP = {
          ...data.product,
          totalStock: stockNum,
        };
        setProducts((prev) => [newP, ...prev]);
        setIsModalOpen(false);
      }
    } catch {
      setFormError("Network error. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  const handleToggleActive = async (p: AdminProduct) => {
    try {
      const res = await fetch(`/api/admin/products/${p.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: !p.isActive }),
      });
      if (res.ok) {
        setProducts((prev) =>
          prev.map((item) =>
            item.id === p.id ? { ...item, isActive: !item.isActive } : item
          )
        );
      }
    } catch {
      // Ignored
    }
  };

  return (
    <div className="space-y-6">
      {/* Header & Actions */}
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-ink-900">
            Products ({products.length})
          </h1>
          <p className="mt-1 text-xs text-ink-500">
            Manage your store catalog, pricing, variants, and visibility
          </p>
        </div>

        <button
          type="button"
          onClick={openAddModal}
          className={`${btnPrimary} !h-10 !px-4 !text-xs cursor-pointer`}
        >
          + Add New Product
        </button>
      </div>

      {/* Filter Bar */}
      <div className="flex flex-wrap items-center gap-3 rounded-xl border border-border bg-surface p-3.5 shadow-xs">
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search products or slugs..."
          className="h-9 min-w-[220px] flex-1 rounded-lg border border-border-strong bg-surface px-3 text-xs text-ink-900 outline-none focus:border-brand-600 focus:ring-1 focus:ring-brand-600"
        />

        <select
          value={selectedCat}
          onChange={(e) => setSelectedCat(e.target.value)}
          className="h-9 rounded-lg border border-border-strong bg-surface px-3 text-xs text-ink-900 outline-none cursor-pointer"
        >
          <option value="all">All Categories</option>
          {categories.map((c) => (
            <option key={c.slug} value={c.slug}>
              {c.name}
            </option>
          ))}
        </select>

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="h-9 rounded-lg border border-border-strong bg-surface px-3 text-xs text-ink-900 outline-none cursor-pointer"
        >
          <option value="all">All Status</option>
          <option value="active">Active Only</option>
          <option value="inactive">Draft / Inactive</option>
        </select>
      </div>

      {/* Products Table */}
      <div className="overflow-x-auto rounded-xl border border-border bg-surface shadow-xs">
        <table className="w-full border-collapse text-left text-xs">
          <thead>
            <tr className="border-b border-border bg-surface-muted text-ink-900">
              <th className="p-3.5 font-semibold">Product</th>
              <th className="p-3.5 font-semibold">Category</th>
              <th className="p-3.5 font-semibold">Price / MRP</th>
              <th className="p-3.5 font-semibold">Stock</th>
              <th className="p-3.5 font-semibold">Status</th>
              <th className="p-3.5 font-semibold text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {filtered.map((p) => {
              const imgs = Array.isArray(p.images) ? p.images : [p.images];
              const img = imgs[0] || "/images/products/backpack.jpg";

              return (
                <tr key={p.id} className="hover:bg-surface-muted/50 transition-colors">
                  <td className="p-3.5">
                    <div className="flex items-center gap-3">
                      <div className="relative size-11 shrink-0 overflow-hidden rounded-md border border-border bg-surface-muted">
                        <Image
                          src={img}
                          alt={p.name}
                          fill
                          className="object-cover"
                          sizes="44px"
                        />
                      </div>
                      <div>
                        <Link
                          href={`/product/${p.slug}`}
                          target="_blank"
                          className="font-bold text-ink-900 hover:text-brand-600 transition-colors"
                        >
                          {p.name}
                        </Link>
                        <span className="block text-[11px] text-ink-500">
                          slug: <code>{p.slug}</code>
                        </span>
                      </div>
                    </div>
                  </td>
                  <td className="p-3.5 text-ink-700">{p.category.name}</td>
                  <td className="p-3.5">
                    <b className="text-ink-900">{inr(p.pricePaise)}</b>
                    <span className="block text-[11px] text-ink-400 line-through">
                      {inr(p.mrpPaise)}
                    </span>
                  </td>
                  <td className="p-3.5">
                    <span
                      className={`font-semibold ${
                        p.totalStock <= 5 ? "text-warn" : "text-ink-900"
                      }`}
                    >
                      {p.totalStock} units
                    </span>
                    <span className="block text-[10px] text-ink-400">
                      {p.variants.length} variant{p.variants.length === 1 ? "" : "s"}
                    </span>
                  </td>
                  <td className="p-3.5">
                    <button
                      type="button"
                      onClick={() => handleToggleActive(p)}
                      className={`cursor-pointer rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider transition-colors ${
                        p.isActive
                          ? "bg-ok/15 text-ok hover:bg-ok/25"
                          : "bg-ink-400/15 text-ink-500 hover:bg-ink-400/25"
                      }`}
                    >
                      {p.isActive ? "Active" : "Draft"}
                    </button>
                  </td>
                  <td className="p-3.5 text-right">
                    <button
                      type="button"
                      onClick={() => openEditModal(p)}
                      className="cursor-pointer font-semibold text-brand-600 hover:underline"
                    >
                      Edit
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>

        {filtered.length === 0 && (
          <div className="py-12 text-center text-ink-500 text-xs">
            No products match the selected filters.
          </div>
        )}
      </div>

      {/* Modal for Add / Edit */}
      {isModalOpen && (
        <div className="fixed inset-0 z-100 flex items-center justify-center bg-ink-900/40 p-4 overflow-y-auto">
          <div className="my-8 w-full max-w-xl rounded-2xl border border-border bg-surface p-6 shadow-xl animate-scale-up">
            <h2 className="text-lg font-bold text-ink-900 mb-4">
              {editingProduct ? `Edit "${editingProduct.name}"` : "Add New Product"}
            </h2>

            {formError && (
              <div className="mb-4 rounded-lg bg-bad/10 p-3 text-xs font-semibold text-bad">
                {formError}
              </div>
            )}

            <form onSubmit={handleSaveProduct} className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              {/* Product Name */}
              <div className="sm:col-span-2 space-y-1">
                <label className="font-semibold text-ink-700">Product Title</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => handleNameChange(e.target.value)}
                  required
                  placeholder="e.g. Ergonomic Office Chair"
                  className="h-10 w-full rounded-lg border border-border-strong bg-surface px-3 text-xs text-ink-900 outline-none focus:border-brand-600 focus:ring-1 focus:ring-brand-600"
                />
              </div>

              {/* Slug */}
              <div className="space-y-1">
                <label className="font-semibold text-ink-700">URL Slug</label>
                <input
                  type="text"
                  value={slug}
                  onChange={(e) => setSlug(e.target.value)}
                  disabled={Boolean(editingProduct)}
                  required
                  placeholder="e.g. ergonomic-office-chair"
                  className="h-10 w-full rounded-lg border border-border-strong bg-surface px-3 text-xs text-ink-900 outline-none focus:border-brand-600 focus:ring-1 focus:ring-brand-600 disabled:opacity-50"
                />
              </div>

              {/* Category */}
              <div className="space-y-1">
                <label className="font-semibold text-ink-700">Category</label>
                <select
                  value={categoryId}
                  onChange={(e) => setCategoryId(e.target.value)}
                  className="h-10 w-full rounded-lg border border-border-strong bg-surface px-3 text-xs text-ink-900 outline-none cursor-pointer"
                >
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Price in INR */}
              <div className="space-y-1">
                <label className="font-semibold text-ink-700">Selling Price (₹)</label>
                <input
                  type="number"
                  value={priceInr}
                  onChange={(e) => setPriceInr(e.target.value)}
                  required
                  placeholder="1999"
                  className="h-10 w-full rounded-lg border border-border-strong bg-surface px-3 text-xs text-ink-900 outline-none focus:border-brand-600 focus:ring-1 focus:ring-brand-600"
                />
              </div>

              {/* MRP in INR */}
              <div className="space-y-1">
                <label className="font-semibold text-ink-700">MRP (₹)</label>
                <input
                  type="number"
                  value={mrpInr}
                  onChange={(e) => setMrpInr(e.target.value)}
                  required
                  placeholder="2999"
                  className="h-10 w-full rounded-lg border border-border-strong bg-surface px-3 text-xs text-ink-900 outline-none focus:border-brand-600 focus:ring-1 focus:ring-brand-600"
                />
              </div>

              {/* Image URL */}
              <div className="sm:col-span-2 space-y-1">
                <label className="font-semibold text-ink-700">Image Path / URL</label>
                <input
                  type="text"
                  value={imageUrl}
                  onChange={(e) => setImageUrl(e.target.value)}
                  required
                  placeholder="/images/products/backpack.jpg"
                  className="h-10 w-full rounded-lg border border-border-strong bg-surface px-3 text-xs text-ink-900 outline-none focus:border-brand-600 focus:ring-1 focus:ring-brand-600"
                />
              </div>

              {/* Description */}
              <div className="sm:col-span-2 space-y-1">
                <label className="font-semibold text-ink-700">Description</label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={3}
                  required
                  placeholder="High quality product description..."
                  className="w-full rounded-lg border border-border-strong bg-surface p-3 text-xs text-ink-900 outline-none focus:border-brand-600 focus:ring-1 focus:ring-brand-600"
                />
              </div>

              {/* Initial Variant (only for new products) */}
              {!editingProduct && (
                <div className="sm:col-span-2 grid grid-cols-3 gap-3 border-t border-border pt-3">
                  <div className="space-y-1">
                    <label className="font-semibold text-ink-700">Variant Value</label>
                    <input
                      type="text"
                      value={variantValue}
                      onChange={(e) => setVariantValue(e.target.value)}
                      placeholder="e.g. Black"
                      className="h-9 w-full rounded border border-border bg-surface px-2 text-xs"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="font-semibold text-ink-700">SKU</label>
                    <input
                      type="text"
                      value={variantSku}
                      onChange={(e) => setVariantSku(e.target.value)}
                      placeholder="SKU-CHAIR-01"
                      className="h-9 w-full rounded border border-border bg-surface px-2 text-xs"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="font-semibold text-ink-700">Initial Stock</label>
                    <input
                      type="number"
                      value={variantStock}
                      onChange={(e) => setVariantStock(e.target.value)}
                      placeholder="50"
                      className="h-9 w-full rounded border border-border bg-surface px-2 text-xs"
                    />
                  </div>
                </div>
              )}

              {/* Toggles */}
              <div className="sm:col-span-2 flex items-center gap-6 pt-2">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={isBestSeller}
                    onChange={(e) => setIsBestSeller(e.target.checked)}
                    className="size-4 rounded text-brand-600"
                  />
                  <span>Featured as Best Seller</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={isActive}
                    onChange={(e) => setIsActive(e.target.checked)}
                    className="size-4 rounded text-brand-600"
                  />
                  <span>Active on Storefront</span>
                </label>
              </div>

              {/* Actions */}
              <div className="sm:col-span-2 flex justify-end gap-3 pt-4 border-t border-border">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className={btnSecondary}
                  disabled={saving}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className={`${btnPrimary} cursor-pointer disabled:opacity-50`}
                >
                  {saving ? "Saving..." : editingProduct ? "Save Changes" : "Create Product"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
