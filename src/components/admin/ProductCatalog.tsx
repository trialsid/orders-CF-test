import React, { useState } from 'react';
import { Search, Edit2, Save, X, AlertCircle, CheckCircle2, Plus, Trash2, ChevronLeft, ChevronRight } from 'lucide-react';
import { useAdminProducts, AdminProduct } from '../../hooks/useAdminProducts';
import { formatCurrency } from '../../utils/formatCurrency';

interface ProductCatalogProps {
}

export function ProductCatalog({ }: ProductCatalogProps) {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  // Use a debounced search term for the hook if desired, or just pass directly
  // For simplicity, we pass search directly, but ideally debounce user input.
  
  const { products, pagination, status, error, updateProduct, addProduct, deleteProduct, refresh } = useAdminProducts({ 
    page, 
    limit: 10,
    search 
  });

  const [editingId, setEditingId] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  
  // Edit form state
  const [editForm, setEditForm] = useState<{ price: string; stock: string }>({ price: '', stock: '' });
  
  // Create form state
  const [createForm, setCreateForm] = useState({
    name: '',
    description: '',
    department: '',
    category: '',
    price: '',
    mrp: '',
    stockQuantity: '0',
    isActive: true
  });

  const [isSaving, setIsSaving] = useState(false);

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

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      const price = parseFloat(createForm.price);
      const mrp = createForm.mrp ? parseFloat(createForm.mrp) : undefined;
      const stockQuantity = parseInt(createForm.stockQuantity, 10);

      if (!createForm.name || isNaN(price)) {
        alert("Name and Price are required.");
        return;
      }

      await addProduct({
        name: createForm.name,
        description: createForm.description,
        department: createForm.department,
        category: createForm.category,
        price,
        mrp,
        stockQuantity: isNaN(stockQuantity) ? 0 : stockQuantity,
        isActive: createForm.isActive
      });
      setIsCreating(false);
      setCreateForm({ 
        name: '', 
        description: '', 
        department: '', 
        category: '', 
        price: '', 
        mrp: '', 
        stockQuantity: '0', 
        isActive: true 
      });
    } catch (e) {
      alert('Failed to create product');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (product: AdminProduct) => {
    if (!confirm(`Are you sure you want to delete "${product.name}"? This cannot be undone.`)) return;
    try {
      await deleteProduct(product.id);
    } catch (e: any) {
      alert(e.message || 'Failed to delete product');
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

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h3 className="text-lg font-semibold text-emerald-950 dark:text-brand-100">Inventory & Pricing</h3>
          <p className="text-sm text-slate-600 dark:text-slate-300">Manage {pagination.total} products</p>
        </div>
        <div className="flex w-full flex-col gap-3 sm:w-auto sm:flex-row sm:items-center">
          <div className="relative w-full sm:w-64">
            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
              <Search className="h-4 w-4 text-slate-400" />
            </div>
            <input
              type="text"
              placeholder="Search items..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              className="h-10 w-full rounded-full border border-slate-200 bg-white pl-9 pr-4 text-sm outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
            />
          </div>
          <button
            onClick={() => setIsCreating(true)}
            className="flex h-10 items-center justify-center gap-2 rounded-full bg-emerald-600 px-6 text-sm font-medium text-white transition-colors hover:bg-emerald-700"
          >
            <Plus className="h-4 w-4" />
            <span>Add Product</span>
          </button>
        </div>
      </header>

      {isCreating && (
        <div className="rounded-3xl border border-emerald-100/60 bg-white/95 p-6 shadow-lg dark:border-emerald-900/60 dark:bg-slate-900/70">
          <div className="mb-6 flex items-center justify-between">
            <h4 className="font-display text-xl font-semibold text-emerald-900 dark:text-brand-100">Add New Product</h4>
            <button onClick={() => setIsCreating(false)} className="rounded-full p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-600 dark:text-slate-500 dark:hover:bg-slate-800 dark:hover:text-slate-300"><X className="h-5 w-5" /></button>
          </div>
          
          <form onSubmit={handleCreate} className="space-y-5">
            <div className="grid gap-5 sm:grid-cols-2">
              <label className="block text-sm font-medium text-emerald-900 dark:text-emerald-200 sm:col-span-2">
                Product Name
                <input
                  placeholder="e.g. Fresh Organic Tomatoes"
                  className="mt-2 w-full rounded-2xl border border-emerald-200 bg-white px-4 py-3 text-sm shadow-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-200 dark:border-emerald-800 dark:bg-slate-950"
                  value={createForm.name}
                  onChange={e => setCreateForm({...createForm, name: e.target.value})}
                  required
                />
              </label>

              <label className="block text-sm font-medium text-emerald-900 dark:text-emerald-200 sm:col-span-2">
                Description
                <textarea
                  placeholder="Brief details about the product..."
                  rows={2}
                  className="mt-2 w-full rounded-2xl border border-emerald-200 bg-white px-4 py-3 text-sm shadow-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-200 dark:border-emerald-800 dark:bg-slate-950"
                  value={createForm.description}
                  onChange={e => setCreateForm({...createForm, description: e.target.value})}
                />
              </label>

              <label className="block text-sm font-medium text-emerald-900 dark:text-emerald-200">
                Category
                <input
                  placeholder="e.g. Vegetables"
                  className="mt-2 w-full rounded-2xl border border-emerald-200 bg-white px-4 py-3 text-sm shadow-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-200 dark:border-emerald-800 dark:bg-slate-950"
                  value={createForm.category}
                  onChange={e => setCreateForm({...createForm, category: e.target.value})}
                />
              </label>

              <label className="block text-sm font-medium text-emerald-900 dark:text-emerald-200">
                Department
                <input
                  placeholder="e.g. Fresh Produce"
                  className="mt-2 w-full rounded-2xl border border-emerald-200 bg-white px-4 py-3 text-sm shadow-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-200 dark:border-emerald-800 dark:bg-slate-950"
                  value={createForm.department}
                  onChange={e => setCreateForm({...createForm, department: e.target.value})}
                />
              </label>

              <label className="block text-sm font-medium text-emerald-900 dark:text-emerald-200">
                Selling Price (₹)
                <input
                  type="number"
                  placeholder="0.00"
                  className="mt-2 w-full rounded-2xl border border-emerald-200 bg-white px-4 py-3 text-sm shadow-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-200 dark:border-emerald-800 dark:bg-slate-950"
                  value={createForm.price}
                  onChange={e => setCreateForm({...createForm, price: e.target.value})}
                  required
                  min="0"
                  step="0.01"
                />
              </label>

              <label className="block text-sm font-medium text-emerald-900 dark:text-emerald-200">
                MRP (₹)
                <input
                  type="number"
                  placeholder="0.00"
                  className="mt-2 w-full rounded-2xl border border-emerald-200 bg-white px-4 py-3 text-sm shadow-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-200 dark:border-emerald-800 dark:bg-slate-950"
                  value={createForm.mrp}
                  onChange={e => setCreateForm({...createForm, mrp: e.target.value})}
                  min="0"
                  step="0.01"
                />
              </label>

              <label className="block text-sm font-medium text-emerald-900 dark:text-emerald-200">
                Initial Stock
                <input
                  type="number"
                  placeholder="0"
                  className="mt-2 w-full rounded-2xl border border-emerald-200 bg-white px-4 py-3 text-sm shadow-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-200 dark:border-emerald-800 dark:bg-slate-950"
                  value={createForm.stockQuantity}
                  onChange={e => setCreateForm({...createForm, stockQuantity: e.target.value})}
                  min="0"
                />
              </label>

              <div className="flex items-center space-x-3 pt-6">
                <input
                  type="checkbox"
                  id="isActive"
                  className="h-4 w-4 text-brand-600 focus:ring-brand-200"
                  checked={createForm.isActive}
                  onChange={e => setCreateForm({...createForm, isActive: e.target.checked})}
                />
                <label htmlFor="isActive" className="text-sm font-medium text-slate-700 dark:text-slate-300">
                  Immediately Available for Sale
                </label>
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setIsCreating(false)}
                className="rounded-full border border-emerald-200 px-4 py-2 text-sm font-semibold text-emerald-900 hover:border-emerald-300 dark:border-emerald-800 dark:text-emerald-100"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSaving}
                className="rounded-full bg-brand-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-brand-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-200 disabled:opacity-50"
              >
                {isSaving ? 'Creating...' : 'Create Product'}
              </button>
            </div>
          </form>
        </div>
      )}

      {status === 'loading' ? (
        <div className="py-8 text-center text-slate-500">Loading catalog...</div>
      ) : status === 'error' ? (
        <div className="rounded-2xl bg-rose-50 p-6 text-center text-rose-700 dark:bg-rose-900/20 dark:text-rose-200">
          <p className="font-semibold">Failed to load catalog</p>
          <p className="text-sm">{error}</p>
          <button onClick={refresh} className="mt-4 text-sm underline">Try Again</button>
        </div>
      ) : (
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
                {products.map((product) => {
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
                          <div className="flex items-center justify-center gap-2">
                            <button
                              onClick={() => handleStartEdit(product)}
                              className="rounded p-1 text-slate-400 hover:bg-slate-100 hover:text-emerald-600 dark:hover:bg-slate-800 dark:hover:text-emerald-400"
                              title="Edit"
                            >
                              <Edit2 className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => handleDelete(product)}
                              className="rounded p-1 text-slate-400 hover:bg-rose-100 hover:text-rose-600 dark:hover:bg-rose-900/20 dark:hover:text-rose-400"
                              title="Delete"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })}
                
                {products.length === 0 && (
                  <tr>
                    <td colSpan={6} className="px-4 py-8 text-center text-slate-500 dark:text-slate-400">
                      No products found matching "{search}"
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination Controls */}
          {pagination.pages > 1 && (
            <div className="flex items-center justify-between border-t border-emerald-100 bg-emerald-50/30 px-4 py-3 dark:border-emerald-900/30 dark:bg-emerald-900/10">
              <div className="text-sm text-slate-500 dark:text-slate-400">
                Page <span className="font-medium">{pagination.page}</span> of{' '}
                <span className="font-medium">{pagination.pages}</span>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  disabled={pagination.page <= 1}
                  className="rounded p-1 text-slate-600 hover:bg-slate-200 disabled:opacity-50 dark:text-slate-300 dark:hover:bg-slate-700"
                >
                  <ChevronLeft className="h-5 w-5" />
                </button>
                <button
                  onClick={() => setPage(p => Math.min(pagination.pages, p + 1))}
                  disabled={pagination.page >= pagination.pages}
                  className="rounded p-1 text-slate-600 hover:bg-slate-200 disabled:opacity-50 dark:text-slate-300 dark:hover:bg-slate-700"
                >
                  <ChevronRight className="h-5 w-5" />
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
