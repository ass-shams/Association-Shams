import { useEffect, useMemo, useState } from 'react';
import DataStatePanel from '../components/DataStatePanel';
import ProductForm from '../components/ProductForm';
import SectionPage from '../components/SectionPage';
import StatCard from '../components/StatCard';
import { AlertIcon, BarChartIcon, StoreIcon } from '../components/icons';
import { AdminApiError } from '../services/adminApi';
import { deleteProduct, listProducts } from '../services/productsService';
import type { AdminProduct } from '../services/productsService';
import { formatPrice } from '@/data/productService';

const FALLBACK_LOAD_ERROR = 'تعذّر تحميل المنتجات. المرجو المحاولة مرة أخرى.';
const FALLBACK_DELETE_ERROR = 'تعذّر حذف المنتج. المرجو المحاولة مرة أخرى.';
const SAVED_MESSAGE = 'تم حفظ المنتج.';
const DELETED_MESSAGE = 'تم حذف المنتج.';
const MUTED = '—';

function formatDate(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) {
    return iso;
  }
  return date.toLocaleString('ar-MA', { dateStyle: 'medium', timeStyle: 'short' });
}

/**
 * Store management section.
 *
 * Shows real product statistics and the managed catalogue, with a reusable form
 * to add/edit products (including secure image upload) and confirmed deletion.
 * The public store reads the same records through `/api/products`.
 */
export default function ProductsPage() {
  const [products, setProducts] = useState<AdminProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);

  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<AdminProduct | null>(null);
  const [deleting, setDeleting] = useState<AdminProduct | null>(null);
  const [isDeleting, setDeletingBusy] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    setError(null);
    try {
      setProducts(await listProducts());
    } catch (loadError) {
      setError(loadError instanceof AdminApiError ? loadError.message : FALLBACK_LOAD_ERROR);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load();
  }, []);

  useEffect(() => {
    if (!feedback) {
      return;
    }
    const handle = setTimeout(() => setFeedback(null), 4000);
    return () => clearTimeout(handle);
  }, [feedback]);

  const stats = useMemo(() => {
    let available = 0;
    for (const product of products) {
      if (product.isAvailable) {
        available += 1;
      }
    }
    return {
      total: products.length,
      available,
      unavailable: products.length - available,
    };
  }, [products]);

  const categories = useMemo(() => {
    const seen = new Set<string>();
    const list: string[] = [];
    for (const product of products) {
      if (product.category && !seen.has(product.category)) {
        seen.add(product.category);
        list.push(product.category);
      }
    }
    return list;
  }, [products]);

  function openCreate() {
    setEditing(null);
    setFormOpen(true);
  }

  function openEdit(product: AdminProduct) {
    setEditing(product);
    setFormOpen(true);
  }

  function handleSaved(saved: AdminProduct) {
    setProducts((current) => {
      const exists = current.some((item) => item.id === saved.id);
      return exists
        ? current.map((item) => (item.id === saved.id ? saved : item))
        : [saved, ...current];
    });
    setFormOpen(false);
    setEditing(null);
    setFeedback(SAVED_MESSAGE);
  }

  async function handleDelete() {
    if (!deleting || isDeleting) {
      return;
    }
    setDeletingBusy(true);
    setDeleteError(null);
    try {
      await deleteProduct(deleting.id);
      setProducts((current) => current.filter((item) => item.id !== deleting.id));
      setDeleting(null);
      setFeedback(DELETED_MESSAGE);
    } catch (deleteErr) {
      setDeleteError(
        deleteErr instanceof AdminApiError ? deleteErr.message : FALLBACK_DELETE_ERROR,
      );
    } finally {
      setDeletingBusy(false);
    }
  }

  return (
    <SectionPage description="إدارة منتجات المتجر: الإضافة والتعديل والحذف وحالة التوفر.">
      <div className="dash-store">
        {loading ? (
          <DataStatePanel
            variant="loading"
            title="جارٍ تحميل المنتجات…"
            description="المرجو الانتظار قليلاً."
          />
        ) : error ? (
          <DataStatePanel
            variant="error"
            title="تعذّر تحميل المنتجات"
            description={error}
            action={
              <button type="button" className="btn btn--primary btn--md" onClick={() => void load()}>
                <span className="btn__label">إعادة المحاولة</span>
              </button>
            }
          />
        ) : (
          <>
            <div className="dash-stats">
              <StatCard label="إجمالي المنتجات" value={stats.total} icon={<StoreIcon />} />
              <StatCard label="المنتجات المتوفرة" value={stats.available} icon={<BarChartIcon />} />
              <StatCard
                label="المنتجات غير المتوفرة"
                value={stats.unavailable}
                icon={<AlertIcon />}
              />
            </div>

            <div className="dash-store__toolbar">
              <button type="button" className="btn btn--primary btn--md" onClick={openCreate}>
                <span className="btn__label">إضافة منتج</span>
              </button>
            </div>

            {feedback ? (
              <p className="dash-store__feedback" role="status">
                {feedback}
              </p>
            ) : null}

            {products.length === 0 ? (
              <DataStatePanel
                variant="empty"
                title="لا توجد منتجات"
                description="أضف أول منتج ليظهر في المتجر العام."
              />
            ) : (
              <div className="dash-store__scroll">
                <table className="dash-store__table">
                  <colgroup>
                    <col className="dash-store__col dash-store__col--image" />
                    <col className="dash-store__col dash-store__col--name" />
                    <col className="dash-store__col dash-store__col--category" />
                    <col className="dash-store__col dash-store__col--price" />
                    <col className="dash-store__col dash-store__col--compare" />
                    <col className="dash-store__col dash-store__col--status" />
                    <col className="dash-store__col dash-store__col--updated" />
                    <col className="dash-store__col dash-store__col--actions" />
                  </colgroup>
                  <thead>
                    <tr>
                      <th scope="col">الصورة</th>
                      <th scope="col">اسم المنتج</th>
                      <th scope="col">الفئة</th>
                      <th scope="col">الثمن الحالي</th>
                      <th scope="col">الثمن القديم</th>
                      <th scope="col">حالة التوفر</th>
                      <th scope="col">آخر تحديث</th>
                      <th scope="col">إجراءات</th>
                    </tr>
                  </thead>
                  <tbody>
                    {products.map((product) => (
                      <tr key={product.id}>
                        <td className="dash-store__cell">
                          {product.imageUrl ? (
                            <img
                              className="dash-store__thumb"
                              src={product.imageUrl}
                              alt={product.name}
                              loading="lazy"
                            />
                          ) : (
                            <span className="dash-store__thumb dash-store__thumb--empty" aria-hidden="true" />
                          )}
                        </td>
                        <td className="dash-store__cell dash-store__cell--name">{product.name}</td>
                        <td className="dash-store__cell">{product.category}</td>
                        <td className="dash-store__cell">{formatPrice(product.price)}</td>
                        <td className="dash-store__cell">
                          {product.compareAtPrice !== null ? (
                            <s>{formatPrice(product.compareAtPrice)}</s>
                          ) : (
                            <span className="dash-store__muted">{MUTED}</span>
                          )}
                        </td>
                        <td className="dash-store__cell">
                          <span
                            className={
                              product.isAvailable
                                ? 'dash-store__badge dash-store__badge--available'
                                : 'dash-store__badge dash-store__badge--unavailable'
                            }
                          >
                            {product.isAvailable ? 'متوفر' : 'غير متوفر'}
                          </span>
                        </td>
                        <td className="dash-store__cell">{formatDate(product.updatedAt)}</td>
                        <td className="dash-store__cell">
                          <div className="dash-store__actions">
                            <button
                              type="button"
                              className="btn btn--outline btn--sm"
                              onClick={() => openEdit(product)}
                            >
                              <span className="btn__label">تعديل</span>
                            </button>
                            <button
                              type="button"
                              className="btn btn--ghost btn--sm dash-store__delete"
                              onClick={() => {
                                setDeleteError(null);
                                setDeleting(product);
                              }}
                            >
                              <span className="btn__label">حذف</span>
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </>
        )}

        {formOpen ? (
          <ProductForm
            initial={editing}
            categories={categories}
            onCancel={() => {
              setFormOpen(false);
              setEditing(null);
            }}
            onSaved={handleSaved}
          />
        ) : null}

        {deleting ? (
          <div className="dash-store__modal" role="dialog" aria-modal="true" aria-label="تأكيد الحذف">
            <button
              type="button"
              className="dash-store__modal-backdrop"
              aria-label="إلغاء"
              onClick={() => setDeleting(null)}
            />
            <div className="dash-store__modal-panel dash-store__modal-panel--confirm">
              <h3 className="dash-store__modal-title">تأكيد حذف المنتج</h3>
              <p className="dash-store__confirm-text">
                هل أنت متأكد من حذف «{deleting.name}»؟ لا يمكن التراجع عن هذه العملية.
              </p>
              {deleteError ? (
                <p className="form-alert" role="alert">
                  {deleteError}
                </p>
              ) : null}
              <div className="dash-store__modal-actions">
                <button
                  type="button"
                  className="btn btn--danger btn--md"
                  disabled={isDeleting}
                  onClick={() => void handleDelete()}
                >
                  {isDeleting ? <span className="btn__spinner" aria-hidden="true" /> : null}
                  <span className="btn__label">{isDeleting ? 'جارٍ الحذف…' : 'تأكيد الحذف'}</span>
                </button>
                <button
                  type="button"
                  className="btn btn--outline btn--md"
                  disabled={isDeleting}
                  onClick={() => setDeleting(null)}
                >
                  <span className="btn__label">إلغاء</span>
                </button>
              </div>
            </div>
          </div>
        ) : null}
      </div>
    </SectionPage>
  );
}
