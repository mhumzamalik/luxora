"use client";

import React, { useState } from "react";
import Image from "next/image";
import { Zap, Plus, Trash2, Edit, Search, Check, X, Loader2, Calendar, Tag, ShieldCheck } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { fetchApi } from "@/lib/api-client";
import { formatCurrency } from "@/lib/currency";
import { useToast } from "@/components/ui/ToastProvider";
import { getPrimaryImage } from "@/lib/images";

interface ProductCatalogItem {
  id: string;
  name: string;
  price: number;
  category?: { name: string };
  images?: { url: string }[];
  variants?: { stock: number }[];
}

interface FlashSaleItemData {
  id?: string;
  productId: string;
  salePrice: number;
  product?: ProductCatalogItem;
}

interface FlashSaleCampaign {
  id: string;
  title: string;
  startDate: string;
  endDate: string;
  isActive: boolean;
  items: FlashSaleItemData[];
}

export default function AdminFlashSalesPage() {
  const queryClient = useQueryClient();
  const { success: toastSuccess, error: toastError } = useToast();

  const [isCampaignModalOpen, setIsCampaignModalOpen] = useState(false);
  const [isProductPickerOpen, setIsProductPickerOpen] = useState(false);
  const [editingCampaign, setEditingCampaign] = useState<FlashSaleCampaign | null>(null);

  // Form State
  const [title, setTitle] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [isActive, setIsActive] = useState(true);
  const [selectedItems, setSelectedItems] = useState<{ productId: string; salePrice: number; product: ProductCatalogItem }[]>([]);

  // Product Picker State
  const [pickerSearch, setPickerSearch] = useState("");
  const [tempSelectedProducts, setTempSelectedProducts] = useState<Record<string, number>>({});

  // 1. Fetch Flash Sales
  const { data: flashSales = [], isLoading: isLoadingSales } = useQuery<FlashSaleCampaign[]>({
    queryKey: ["admin", "flash-sales"],
    queryFn: () => fetchApi("/api/admin/flash-sales"),
  });

  // 2. Fetch Catalog Products for Modal Picker
  const { data: catalogProducts = [], isLoading: isLoadingProducts } = useQuery<ProductCatalogItem[]>({
    queryKey: ["admin", "products"],
    queryFn: () => fetchApi("/api/admin/products"),
  });

  // Create/Update Flash Sale Mutation
  const saveMutation = useMutation({
    mutationFn: (data: any) =>
      fetchApi("/api/admin/flash-sales", {
        method: editingCampaign ? "PUT" : "POST",
        body: JSON.stringify(data),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "flash-sales"] });
      queryClient.invalidateQueries({ queryKey: ["homepage"] });
      toastSuccess("Flash Sale Saved", `Flash sale campaign "${title}" saved successfully.`);
      closeCampaignModal();
    },
    onError: (err: any) => {
      toastError("Save Failed", err?.message || "Failed to save flash sale campaign.");
    },
  });

  // Delete Mutation
  const deleteMutation = useMutation({
    mutationFn: (id: string) => fetchApi(`/api/admin/flash-sales?id=${id}`, { method: "DELETE" }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "flash-sales"] });
      queryClient.invalidateQueries({ queryKey: ["homepage"] });
      toastSuccess("Flash Sale Deleted", "Flash sale campaign removed.");
    },
  });

  const openNewCampaignModal = () => {
    setEditingCampaign(null);
    setTitle("Exclusive Limited Flash Sale");

    // Default dates: now and 24 hours later
    const now = new Date();
    const tomorrow = new Date(Date.now() + 24 * 60 * 60 * 1000);
    setStartDate(now.toISOString().slice(0, 16));
    setEndDate(tomorrow.toISOString().slice(0, 16));
    setIsActive(true);
    setSelectedItems([]);
    setIsCampaignModalOpen(true);
  };

  const openEditCampaignModal = (sale: FlashSaleCampaign) => {
    setEditingCampaign(sale);
    setTitle(sale.title);
    setStartDate(new Date(sale.startDate).toISOString().slice(0, 16));
    setEndDate(new Date(sale.endDate).toISOString().slice(0, 16));
    setIsActive(sale.isActive);

    const items = sale.items.map((it) => {
      const matchedProd = catalogProducts.find((p) => p.id === it.productId) || it.product || {
        id: it.productId,
        name: "Unknown Product",
        price: it.salePrice,
      };
      return {
        productId: it.productId,
        salePrice: it.salePrice,
        product: matchedProd as ProductCatalogItem,
      };
    });

    setSelectedItems(items);
    setIsCampaignModalOpen(true);
  };

  const closeCampaignModal = () => {
    setIsCampaignModalOpen(false);
    setEditingCampaign(null);
  };

  const handleSaveCampaign = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      toastError("Validation Error", "Campaign title is required.");
      return;
    }
    if (!startDate || !endDate) {
      toastError("Validation Error", "Start and End date/times are required.");
      return;
    }

    const payload = {
      id: editingCampaign?.id,
      title,
      startDate: new Date(startDate).toISOString(),
      endDate: new Date(endDate).toISOString(),
      isActive,
      items: selectedItems.map((item) => ({
        productId: item.productId,
        salePrice: Number(item.salePrice),
      })),
    };

    saveMutation.mutate(payload);
  };

  const handleDeleteCampaign = (id: string, name: string) => {
    if (confirm(`Are you sure you want to delete "${name}"?`)) {
      deleteMutation.mutate(id);
    }
  };

  // Product Selection Modal Logic
  const openProductPicker = () => {
    const initialMap: Record<string, number> = {};
    selectedItems.forEach((item) => {
      initialMap[item.productId] = item.salePrice;
    });
    setTempSelectedProducts(initialMap);
    setPickerSearch("");
    setIsProductPickerOpen(true);
  };

  const toggleProductInPicker = (prod: ProductCatalogItem) => {
    setTempSelectedProducts((prev) => {
      const next = { ...prev };
      if (next[prod.id] !== undefined) {
        delete next[prod.id];
      } else {
        // Default sale price: 20% discount off normal price
        const discounted = Math.round(prod.price * 0.8 * 100) / 100;
        next[prod.id] = discounted;
      }
      return next;
    });
  };

  const updateTempSalePrice = (productId: string, price: number) => {
    setTempSelectedProducts((prev) => ({
      ...prev,
      [productId]: price,
    }));
  };

  const confirmProductSelection = () => {
    const newItems = Object.entries(tempSelectedProducts).map(([prodId, salePrice]) => {
      const matched = catalogProducts.find((p) => p.id === prodId)!;
      return {
        productId: prodId,
        salePrice,
        product: matched,
      };
    });
    setSelectedItems(newItems);
    setIsProductPickerOpen(false);
  };

  const removeSelectedItem = (productId: string) => {
    setSelectedItems((prev) => prev.filter((i) => i.productId !== productId));
  };

  const filteredCatalog = catalogProducts.filter((p) =>
    p.name.toLowerCase().includes(pickerSearch.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 rounded-3xl border border-gray-200/70 shadow-2xs">
        <div>
          <h1 className="text-2xl font-serif font-bold text-gray-900 flex items-center gap-2">
            <Zap className="text-purple-600 fill-purple-600" size={24} /> Flash Sales Management
          </h1>
          <p className="text-xs text-gray-500 mt-1">
            Create limited-time promotional deals, set special sale prices, and manage countdown timers on the homepage.
          </p>
        </div>

        <button
          onClick={openNewCampaignModal}
          className="bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold px-5 py-3 rounded-xl transition shadow-md flex items-center gap-2 cursor-pointer"
        >
          <Plus size={16} />
          <span>Create New Flash Sale</span>
        </button>
      </div>

      {/* Active & Scheduled Flash Sales List */}
      <div className="space-y-4">
        {isLoadingSales ? (
          <div className="bg-white p-12 rounded-3xl border border-gray-200/70 flex justify-center items-center text-purple-600 gap-2">
            <Loader2 className="animate-spin" size={24} />
            <span className="text-xs font-bold">Loading flash sale campaigns...</span>
          </div>
        ) : flashSales.length === 0 ? (
          <div className="bg-white p-12 rounded-3xl border border-gray-200/70 text-center space-y-4 shadow-2xs">
            <div className="w-12 h-12 bg-purple-50 text-purple-600 rounded-full flex items-center justify-center mx-auto">
              <Zap size={24} />
            </div>
            <div>
              <h3 className="text-sm font-serif font-bold text-gray-900">No Active Flash Sales</h3>
              <p className="text-xs text-gray-500 mt-1">
                You currently have no flash sale campaigns created. Click below to feature products with limited-time discounts.
              </p>
            </div>
            <button
              onClick={openNewCampaignModal}
              className="bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold px-5 py-2.5 rounded-xl transition shadow-sm inline-flex items-center gap-2"
            >
              <Plus size={14} />
              <span>Create Flash Sale</span>
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6">
            {flashSales.map((sale) => {
              const now = new Date();
              const isCurrentlyRunning = sale.isActive && new Date(sale.startDate) <= now && new Date(sale.endDate) >= now;

              return (
                <div key={sale.id} className="bg-white border border-gray-200/70 rounded-3xl p-6 space-y-4 shadow-2xs">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-gray-100 pb-4">
                    <div>
                      <div className="flex items-center gap-2">
                        <h2 className="text-base font-serif font-bold text-gray-900">{sale.title}</h2>
                        <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider ${isCurrentlyRunning
                            ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                            : sale.isActive
                              ? "bg-blue-50 text-blue-700 border border-blue-200"
                              : "bg-gray-100 text-gray-500 border border-gray-200"
                          }`}>
                          {isCurrentlyRunning ? "● Live on Homepage" : sale.isActive ? "Scheduled" : "Inactive"}
                        </span>
                      </div>

                      <div className="flex items-center gap-4 text-xs text-gray-500 mt-1">
                        <span className="flex items-center gap-1">
                          <Calendar size={13} className="text-gray-400" />
                          Starts: {new Date(sale.startDate).toLocaleString()}
                        </span>
                        <span className="flex items-center gap-1">
                          <Calendar size={13} className="text-gray-400" />
                          Ends: {new Date(sale.endDate).toLocaleString()}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center space-x-2 shrink-0">
                      <button
                        onClick={() => openEditCampaignModal(sale)}
                        className="px-3 py-1.5 rounded-xl border border-gray-200 text-gray-700 text-xs font-bold hover:bg-gray-50 transition flex items-center gap-1.5"
                      >
                        <Edit size={14} /> Edit
                      </button>
                      <button
                        onClick={() => handleDeleteCampaign(sale.id, sale.title)}
                        className="p-2 rounded-xl text-gray-400 hover:text-rose-600 hover:bg-rose-50 transition"
                        title="Delete Sale"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>

                  {/* Included Items Grid */}
                  <div>
                    <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">
                      Included Products ({sale.items.length})
                    </h3>

                    {sale.items.length === 0 ? (
                      <div className="text-xs text-gray-400 bg-gray-50 p-4 rounded-2xl border border-dashed border-gray-200 text-center">
                        No products attached to this sale campaign yet. Click Edit to add items.
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
                        {sale.items.map((item) => {
                          const prod = item.product;
                          const primaryImg = getPrimaryImage(prod);
                          const originalPrice = prod?.price || item.salePrice * 1.2;
                          const discountPercent = Math.round(((originalPrice - item.salePrice) / originalPrice) * 100);

                          return (
                            <div key={item.id || item.productId} className="bg-gray-50/80 border border-gray-200/80 p-3 rounded-2xl flex items-center space-x-3">
                              <div className="relative w-12 h-12 bg-white rounded-xl overflow-hidden shrink-0 border border-gray-100">
                                <Image src={primaryImg} alt={prod?.name || "Product"} fill sizes="48px" className="object-contain p-1" />
                              </div>
                              <div className="min-w-0 flex-1">
                                <h4 className="text-xs font-bold text-gray-900 truncate">{prod?.name || "Product"}</h4>
                                <div className="flex items-baseline space-x-1.5">
                                  <span className="text-xs font-extrabold text-purple-600">{formatCurrency(item.salePrice)}</span>
                                  <span className="text-[10px] text-gray-400 line-through">{formatCurrency(originalPrice)}</span>
                                </div>
                                <span className="text-[10px] font-bold text-amber-700 bg-amber-50 px-1.5 py-0.2 rounded-full inline-block mt-0.5">
                                  -{discountPercent}% OFF
                                </span>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* CREATE / EDIT CAMPAIGN MODAL */}
      {isCampaignModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white w-full max-w-2xl rounded-3xl p-6 shadow-2xl space-y-6 relative border border-gray-100 my-8">
            <div className="flex justify-between items-center border-b border-gray-100 pb-4">
              <h2 className="text-lg font-serif font-bold text-gray-900 flex items-center gap-2">
                <Zap className="text-purple-600 fill-purple-600" size={20} />
                {editingCampaign ? "Edit Flash Sale Campaign" : "Create Flash Sale Campaign"}
              </h2>
              <button
                onClick={closeCampaignModal}
                className="p-2 rounded-full hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSaveCampaign} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Campaign Title</label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Midnight Luxury Flash Sale"
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl py-2.5 px-3 text-xs outline-hidden focus:border-purple-600 font-medium text-gray-900"
                  required
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Start Date & Time</label>
                  <input
                    type="datetime-local"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl py-2.5 px-3 text-xs outline-hidden focus:border-purple-600 text-gray-900 font-medium"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">End Date & Time</label>
                  <input
                    type="datetime-local"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl py-2.5 px-3 text-xs outline-hidden focus:border-purple-600 text-gray-900 font-medium"
                    required
                  />
                </div>
              </div>

              <div className="flex items-center space-x-2 pt-1">
                <input
                  type="checkbox"
                  id="isActive"
                  checked={isActive}
                  onChange={(e) => setIsActive(e.target.checked)}
                  className="rounded-md text-purple-600 focus:ring-purple-500 w-4 h-4 cursor-pointer"
                />
                <label htmlFor="isActive" className="text-xs font-bold text-gray-700 cursor-pointer select-none">
                  Enable / Activate this Flash Sale campaign
                </label>
              </div>

              {/* PRODUCTS IN SALE SECTION */}
              <div className="pt-4 border-t border-gray-100 space-y-3">
                <div className="flex justify-between items-center">
                  <div>
                    <h3 className="text-xs font-bold text-gray-900">Campaign Products ({selectedItems.length})</h3>
                    <p className="text-[11px] text-gray-500">Select items to feature in this sale with custom sale pricing.</p>
                  </div>
                  <button
                    type="button"
                    onClick={openProductPicker}
                    className="bg-purple-50 hover:bg-purple-100 text-purple-700 text-xs font-bold px-3.5 py-2 rounded-xl border border-purple-200 transition flex items-center gap-1.5 cursor-pointer"
                  >
                    <Plus size={14} /> Add Items
                  </button>
                </div>

                {selectedItems.length === 0 ? (
                  <div className="p-8 text-center text-xs text-gray-400 bg-gray-50 rounded-2xl border border-dashed border-gray-200">
                    No products added yet. Click <strong>Add Items</strong> to select products from your catalog.
                  </div>
                ) : (
                  <div className="max-h-60 overflow-y-auto space-y-2 pr-1">
                    {selectedItems.map((item) => {
                      const prod = item.product;
                      const primaryImg = getPrimaryImage(prod);

                      return (
                        <div key={item.productId} className="flex items-center justify-between p-3 bg-gray-50 rounded-2xl border border-gray-200/80">
                          <div className="flex items-center space-x-3 min-w-0">
                            <div className="relative w-10 h-10 bg-white border border-gray-100 rounded-xl overflow-hidden shrink-0">
                              <Image src={primaryImg} alt={prod?.name || "Product"} fill sizes="48px" className="object-contain p-1" />
                            </div>
                            <div className="min-w-0">
                              <h4 className="text-xs font-bold text-gray-900 truncate">{prod?.name}</h4>
                              <p className="text-[10px] text-gray-500">Regular Price: {formatCurrency(prod?.price || 0)}</p>
                            </div>
                          </div>

                          <div className="flex items-center space-x-3 shrink-0">
                            <div className="flex items-center space-x-1.5">
                              <span className="text-[11px] font-bold text-gray-500">Sale Price:</span>
                              <input
                                type="number"
                                step="0.01"
                                min="0.01"
                                value={item.salePrice}
                                onChange={(e) => {
                                  const val = parseFloat(e.target.value) || 0;
                                  setSelectedItems((prev) =>
                                    prev.map((i) => (i.productId === item.productId ? { ...i, salePrice: val } : i))
                                  );
                                }}
                                className="w-20 bg-white border border-gray-300 rounded-lg py-1 px-2 text-xs font-bold text-purple-700 outline-hidden focus:border-purple-600"
                              />
                            </div>

                            <button
                              type="button"
                              onClick={() => removeSelectedItem(item.productId)}
                              className="text-gray-400 hover:text-rose-600 p-1.5 rounded-lg transition"
                              title="Remove Product"
                            >
                              <Trash2 size={15} />
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Submit Buttons */}
              <div className="flex justify-end space-x-3 pt-4 border-t border-gray-100">
                <button
                  type="button"
                  onClick={closeCampaignModal}
                  className="px-4 py-2.5 rounded-xl text-xs font-bold text-gray-600 hover:bg-gray-100 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saveMutation.isPending}
                  className="bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold px-6 py-2.5 rounded-xl transition shadow-md flex items-center gap-2 cursor-pointer"
                >
                  {saveMutation.isPending && <Loader2 className="animate-spin" size={14} />}
                  <span>{editingCampaign ? "Update Campaign" : "Create Campaign"}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* PRODUCT SELECTION MODAL */}
      {isProductPickerOpen && (
        <div className="fixed inset-0 z-60 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-3xl rounded-3xl p-6 shadow-2xl space-y-4 relative border border-gray-100 my-8 flex flex-col max-h-[85vh]">
            <div className="flex justify-between items-center border-b border-gray-100 pb-3">
              <div>
                <h2 className="text-base font-serif font-bold text-gray-900">Select Products for Flash Sale</h2>
                <p className="text-xs text-gray-500">Pick products to include and customize their promotional sale prices.</p>
              </div>
              <button
                onClick={() => setIsProductPickerOpen(false)}
                className="p-2 rounded-full hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition"
              >
                <X size={18} />
              </button>
            </div>

            {/* Search Input */}
            <div className="relative">
              <input
                type="text"
                value={pickerSearch}
                onChange={(e) => setPickerSearch(e.target.value)}
                placeholder="Search catalog products..."
                className="w-full bg-gray-50 text-xs text-gray-900 border border-gray-200 rounded-xl py-2.5 pl-9 pr-3 outline-hidden focus:border-purple-600"
              />
              <Search size={15} className="absolute left-3 top-3 text-gray-400" />
            </div>

            {/* Catalog Grid */}
            <div className="flex-1 overflow-y-auto space-y-2 pr-1 my-2">
              {isLoadingProducts ? (
                <div className="p-8 flex justify-center items-center text-purple-600 gap-2 text-xs font-bold">
                  <Loader2 className="animate-spin" size={20} /> Loading catalog products...
                </div>
              ) : filteredCatalog.length === 0 ? (
                <div className="p-8 text-center text-gray-400 text-xs">
                  No products matched your search filter.
                </div>
              ) : (
                filteredCatalog.map((prod) => {
                  const isSelected = tempSelectedProducts[prod.id] !== undefined;
                  const currentSalePrice = tempSelectedProducts[prod.id] ?? Math.round(prod.price * 0.8 * 100) / 100;
                  const totalStock = prod.variants?.reduce((sum, v) => sum + v.stock, 0) ?? 0;
                  const primaryImg = getPrimaryImage(prod);

                  return (
                    <div
                      key={prod.id}
                      className={`p-3 rounded-2xl border transition flex items-center justify-between gap-3 ${isSelected
                          ? "bg-purple-50/60 border-purple-300"
                          : "bg-gray-50/50 border-gray-200/80 hover:bg-gray-50"
                        }`}
                    >
                      <div className="flex items-center space-x-3 min-w-0">
                        <button
                          type="button"
                          onClick={() => toggleProductInPicker(prod)}
                          className={`w-6 h-6 rounded-lg border flex items-center justify-center transition shrink-0 cursor-pointer ${isSelected
                              ? "bg-purple-600 border-purple-600 text-white"
                              : "border-gray-300 bg-white text-transparent"
                            }`}
                        >
                          <Check size={14} />
                        </button>

                        <div className="relative w-10 h-10 bg-white border border-gray-100 rounded-xl overflow-hidden shrink-0">
                          <Image src={primaryImg} alt={prod.name} fill sizes="48px" className="object-contain p-1" />
                        </div>

                        <div className="min-w-0">
                          <h4 className="text-xs font-bold text-gray-900 truncate">{prod.name}</h4>
                          <div className="flex items-center gap-2 text-[10px] text-gray-500">
                            <span>Regular: {formatCurrency(prod.price)}</span>
                            <span>•</span>
                            <span className={totalStock < 5 ? "text-rose-600 font-bold" : "text-emerald-600"}>
                              Stock: {totalStock}
                            </span>
                            <span>•</span>
                            <span>{prod.category?.name || "General"}</span>
                          </div>
                        </div>
                      </div>

                      {isSelected && (
                        <div className="flex items-center space-x-1.5 shrink-0">
                          <span className="text-[10px] font-bold text-purple-700">Sale Price ($):</span>
                          <input
                            type="number"
                            step="0.01"
                            min="0.01"
                            value={currentSalePrice}
                            onChange={(e) => updateTempSalePrice(prod.id, parseFloat(e.target.value) || 0)}
                            className="w-20 bg-white border border-purple-300 rounded-lg py-1 px-2 text-xs font-bold text-purple-700 outline-hidden focus:border-purple-600"
                          />
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>

            {/* Modal Actions */}
            <div className="flex justify-between items-center pt-3 border-t border-gray-100">
              <span className="text-xs font-bold text-purple-700">
                {Object.keys(tempSelectedProducts).length} products selected
              </span>
              <div className="flex space-x-2">
                <button
                  type="button"
                  onClick={() => setIsProductPickerOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-gray-600 hover:bg-gray-100 transition"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={confirmProductSelection}
                  className="bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold px-5 py-2 rounded-xl transition shadow-md cursor-pointer"
                >
                  Add Selected Items
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
