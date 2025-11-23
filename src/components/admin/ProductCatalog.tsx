import React, { useState, useMemo } from 'react';
import { Search, Edit2, Save, X, Filter, AlertCircle, CheckCircle2 } from 'lucide-react';
import { useAdminProducts, AdminProduct } from '../../hooks/useAdminProducts';
import { formatCurrency } from '../../utils/formatCurrency';

interface ProductCatalogProps {
  token?: string | null;
}

export function ProductCatalog({ token }: ProductCatalogProps) {
  const { products, status, error, updateProduct, refresh } = useAdminProducts({ token });
  const [search, setSearch] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  
  // Edit form state
  const [editForm, setEditForm] = useState<{ price: string; stock: string }>({ price: '', stock: '' });
  const [isSaving, setIsSaving] = useState(false);

  const filteredProducts = useMemo(() => {
    const lowerSearch = search.toLowerCase();
    return products.filter(
      (p) =>
        p.name.toLowerCase().includes(lowerSearch) ||
        p.category?.toLowerCase().includes(lowerSearch) ||
        p.id.toLowerCase().includes(lowerSearch)
    );
  }, [products, search]);

  const handleStartEdit = (product: AdminProduct) => {
    setEditingId(product.id);
    setEditForm({
      price: String(product.price),
      stock: String(product.stockQuantity),
    });
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setEditForm({ price: '', stock: '' });
  };

  const handleSave = async (id: string) => {
    setIsSaving(true);
    try {
      const price = parseFloat(editForm.price);
      const stockQuantity = parseInt(editForm.stock, 10);

      if (isNaN(price) || isNaN(stockQuantity)) {
        alert("Invalid input");
        return;
      }

      await updateProduct(id, { price, stockQuantity });
      setEditingId(null);
    } catch (e) {
      alert('Failed to save product');
      console.error(e);
    } finally {
      setIsSaving(false);
    }
  };

  const toggleActive = async (product: AdminProduct) => {
    if (!confirm(`Are you sure you want to ${product.isActive ? 'deactivate' : 'activate'} ${product.name}?`)) return;
    try {
      await updateProduct(product.id, { isActive: !product.isActive });
    } catch (e) {
      alert('Failed to update status');
    }
  };

  if (status === 'loading') {
    return <div className="py-8 text-center text-slate-500">Loading catalog...</div>;
  }

  if (status === 'error') {
    return (
      <div className="rounded-2xl bg-rose-50 p-6 text-center text-rose-700 dark:bg-rose-900/20 dark:text-rose-200">
        <p className="font-semibold">Failed to load catalog</p>
        <p className="text-sm">{error}</p>
        <button onClick={refresh} className="mt-4 text-sm underline">Try Again</button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h3 className="text-lg font-semibold text-emerald-950 dark:text-brand-100">Inventory & Pricing</h3>
          <p className="text-sm text-slate-600 dark:text-slate-300">Manage {products.length} products</p>
        </div>
        <div className="relative w-full max-w-xs">
          <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
            <Search className="h-4 w-4 text-slate-400" />
          </div>
          <input
            type="text"
            placeholder="Search items..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-full border border-slate-200 bg-white py-2 pl-9 pr-4 text-sm outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
          />
        </div>
      </header>

      <div className="overflow-hidden rounded-2xl border border-emerald-100/70 shadow-sm dark:border-emerald-900/60">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[800px] text-left text-sm">
            <thead className="bg-emerald-50/60 text-xs uppercase tracking-wide text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-200">
              <tr>
                <th className="px-4 py-3 font-semibold">Product</th>
                <th className="px-4 py-3 font-semibold">Category</th>
                <th className="px-4 py-3 font-semibold text-right">Price (₹)</th>
                <th className="px-4 py-3 font-semibold text-right">Stock</th>
                <th className="px-4 py-3 font-semibold text-center">Status</th>
                <th className="px-4 py-3 font-semibold text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-emerald-50/60 dark:divide-emerald-900/40">
              {filteredProducts.map((product) => {
                const isEditing = editingId === product.id;

                return (
                  <tr key={product.id} className="bg-white/70 hover:bg-emerald-50/30 dark:bg-slate-950/40 dark:hover:bg-emerald-900/10">
                    <td className="px-4 py-3">
                      <div className="font-semibold text-emerald-900 dark:text-emerald-100">{product.name}</div>
                      <div className="text-xs text-slate-500">{product.id}</div>
                    </td>
                    <td className="px-4 py-3 text-slate-600 dark:text-slate-300">
                      {product.category || 'Uncategorized'}
                    </td>
                    <td className="px-4 py-3 text-right">
                      {isEditing ? (
                        <input
                          type="number"
                          className="w-20 rounded border border-emerald-300 bg-white px-2 py-1 text-right text-sm focus:border-emerald-500 focus:outline-none dark:bg-slate-800 dark:text-white"
                          value={editForm.price}
                          onChange={(e) => setEditForm({ ...editForm, price: e.target.value })}
                        />
                      ) : (
                        <span className="font-medium">{formatCurrency(product.price)}</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right">
                      {isEditing ? (
                        <input
                          type="number"
                          className="w-20 rounded border border-emerald-300 bg-white px-2 py-1 text-right text-sm focus:border-emerald-500 focus:outline-none dark:bg-slate-800 dark:text-white"
                          value={editForm.stock}
                          onChange={(e) => setEditForm({ ...editForm, stock: e.target.value })}
                        />
                      ) : (
                        <span className={`${product.stockQuantity < 10 ? 'text-rose-600 font-bold' : 'text-slate-700 dark:text-slate-300'}`}>
                          {product.stockQuantity}
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <button
                        onClick={() => toggleActive(product)}
                        className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium transition-colors ${
                          product.isActive
                            ? 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200 dark:bg-emerald-900/40 dark:text-emerald-200'
                            : 'bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-400'
                        }`}
                      >
                        {product.isActive ? (
                          <>
                            <CheckCircle2 className="h-3 w-3" /> Active
                          </>
                        ) : (
                          <>
                            <AlertCircle className="h-3 w-3" /> Inactive
                          </>
                        )}
                      </button>
                    </td>
                    <td className="px-4 py-3 text-center">
                      {isEditing ? (
                        <div className="flex items-center justify-center gap-2">
                          <button
                            onClick={() => handleSave(product.id)}
                            disabled={isSaving}
                            className="rounded p-1 text-emerald-600 hover:bg-emerald-50 dark:text-emerald-400 dark:hover:bg-emerald-900/20"
                            title="Save"
                          >
                            <Save className="h-4 w-4" />
                          </button>
                          <button
                            onClick={handleCancelEdit}
                            className="rounded p-1 text-slate-400 hover:bg-slate-100 dark:text-slate-500 dark:hover:bg-slate-800"
                            title="Cancel"
                          >
                            <X className="h-4 w-4" />
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => handleStartEdit(product)}
                          className="rounded p-1 text-slate-400 hover:bg-slate-100 hover:text-emerald-600 dark:hover:bg-slate-800 dark:hover:text-emerald-400"
                          title="Edit"
                        >
                          <Edit2 className="h-4 w-4" />
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
              
              {filteredProducts.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-slate-500 dark:text-slate-400">
                    No products found matching "{search}"
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
