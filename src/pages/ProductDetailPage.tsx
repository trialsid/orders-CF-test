import React, { useMemo } from 'react';
import { Link, useNavigate, useOutletContext, useParams } from 'react-router-dom';
import { ArrowLeft, PackageOpen, PlusCircle, ShoppingCart, Minus } from 'lucide-react';
import type { AppOutletContext } from '../layouts/MainLayout';
import { formatCurrency } from '../utils/formatCurrency';
import { useTranslations } from '../i18n/i18n';
import MobileStickyAction from '../components/MobileStickyAction';
import { StickyBottomContainer } from '../components/StickyBottomContainer';
import { QuantityControl } from '../components/QuantityControl';

function ProductDetailPage(): JSX.Element {
  const { productId } = useParams<{ productId: string }>();
  const navigate = useNavigate();
  const { products, cart } = useOutletContext<AppOutletContext>();
  const { t } = useTranslations();
  const [stickyHeight, setStickyHeight] = React.useState(0);

  const product = useMemo(
    () => products.products.find((item) => item.id === productId),
    [productId, products.products]
  );

  const quantity = useMemo(() => {
    if (!product) {
      return 0;
    }
    const entry = cart.cartItems.find((item) => item.product.id === product.id);
    return entry?.quantity ?? 0;
  }, [cart.cartItems, product]);

  const handleIncrease = () => {
    if (!product) {
      return;
    }
    if (quantity > 0) {
      cart.updateQuantity(product.id, 1);
      return;
    }
    cart.addItem(product);
  };

  const handleDecrease = () => {
    if (!product || quantity <= 0) {
      return;
    }
    cart.updateQuantity(product.id, -1);
  };

  const handleAddToCart = () => {
    handleIncrease();
  };

  if (products.isLoading) {
    return (
      <section className="section">
        <div className="page-shell">
          <p className="text-sm text-slate-500 dark:text-slate-300">{t('products.status.loading')}</p>
        </div>
      </section>
    );
  }

  if (!product) {
    return (
      <section className="section">
        <div className="page-shell space-y-6 text-sm text-slate-600 dark:text-slate-300">
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="inline-flex items-center gap-2 rounded-full border border-emerald-200/70 bg-white px-4 py-2 text-sm font-semibold text-emerald-800 transition hover:border-emerald-400 hover:text-emerald-900 dark:border-emerald-800 dark:bg-slate-900 dark:text-emerald-200"
          >
            <ArrowLeft className="h-4 w-4" />
            {t('products.detail.goBack')}
          </button>
          <p>{t('products.detail.missing')}</p>
          <Link
            to="/browse"
            className="inline-flex items-center gap-2 text-sm font-semibold text-brand-600 hover:text-brand-700"
          >
            <ShoppingCart className="h-4 w-4" />
            {t('products.detail.backToDiscover')}
          </Link>
        </div>
      </section>
    );
  }

  const showQuantityStepper = quantity > 0;

  return (
    <section
      className="section md:pb-16"
      style={stickyHeight ? { paddingBottom: stickyHeight + 20 } : undefined}
    >
      <div className="page-shell space-y-10">
        <div className="flex items-center gap-4">
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-emerald-200/70 bg-white text-emerald-700 shadow-sm transition hover:border-emerald-400 hover:text-emerald-900 dark:border-emerald-800 dark:bg-slate-900 dark:text-emerald-200"
            aria-label={t('products.detail.goBack')}
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <div>
            <p className="inline-flex items-center gap-2 rounded-full bg-brand-500/10 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-brand-700 dark:text-brand-300">
              <PackageOpen className="h-3.5 w-3.5" />
              {product.category}
            </p>
            <h1
              tabIndex={-1}
              className="mt-3 scroll-mt-32 font-display text-3xl font-semibold text-emerald-900 focus:outline-none dark:text-brand-100 sm:text-4xl"
            >
              {product.name}
            </h1>
          </div>
        </div>

        <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_320px]">
          <article className="space-y-6 rounded-3xl border border-emerald-100/60 bg-white/95 p-6 shadow-lg dark:border-emerald-900/60 dark:bg-slate-900/70">
            <section>
              <h2 className="text-lg font-semibold text-emerald-900 dark:text-brand-100">{t('products.detail.about')}</h2>
              <p className="mt-3 text-sm text-slate-600 dark:text-slate-300">{product.description}</p>
            </section>

            <section>
              <h3 className="text-sm font-semibold uppercase tracking-wide text-emerald-600 dark:text-emerald-300">
                {t('products.detail.details')}
              </h3>
              <dl className="mt-3 grid gap-3 text-sm text-slate-600 dark:text-slate-300 sm:grid-cols-2">
                <div className="flex items-center justify-between rounded-2xl border border-emerald-100/70 bg-white/80 px-4 py-3 dark:border-emerald-900/60 dark:bg-slate-900/60">
                  <dt className="font-medium text-emerald-900 dark:text-emerald-100">{t('products.detail.department')}</dt>
                  <dd>{product.department || t('products.detail.unknown')}</dd>
                </div>
                <div className="flex items-center justify-between rounded-2xl border border-emerald-100/70 bg-white/80 px-4 py-3 dark:border-emerald-900/60 dark:bg-slate-900/60">
                  <dt className="font-medium text-emerald-900 dark:text-emerald-100">{t('products.detail.category')}</dt>
                  <dd>{product.category}</dd>
                </div>
                <div className="flex items-center justify-between rounded-2xl border border-emerald-100/70 bg-white/80 px-4 py-3 dark:border-emerald-900/60 dark:bg-slate-900/60">
                  <dt className="font-medium text-emerald-900 dark:text-emerald-100">{t('products.detail.price')}</dt>
                  <dd>{formatCurrency(product.price)}</dd>
                </div>
                <div className="flex items-center justify-between rounded-2xl border border-emerald-100/70 bg-white/80 px-4 py-3 dark:border-emerald-900/60 dark:bg-slate-900/60">
                  <dt className="font-medium text-emerald-900 dark:text-emerald-100">{t('products.detail.mrp')}</dt>
                  <dd>{formatCurrency(product.mrp)}</dd>
                </div>
              </dl>
            </section>

            {products.storeNote && (
              <div className="rounded-2xl border border-brand-100/70 bg-brand-500/10 px-4 py-3 text-xs font-medium text-brand-700 dark:border-brand-700/40 dark:bg-brand-900/20 dark:text-brand-200">
                {products.storeNote}
              </div>
            )}
          </article>

          <aside className="flex flex-col gap-6 rounded-3xl border border-brand-500/20 bg-gradient-to-br from-white via-white to-brand-50/60 p-6 shadow-xl shadow-brand-900/10 dark:border-brand-700/30 dark:from-slate-900 dark:via-slate-900 dark:to-brand-900/20">
            <div>
              <span className="text-sm font-medium text-slate-500 dark:text-slate-400">
                {t('products.detail.mrpLabel', { price: formatCurrency(product.mrp) })}
              </span>
              <p className="mt-2 text-3xl font-semibold text-emerald-900 dark:text-brand-100">{formatCurrency(product.price)}</p>
            </div>

            <div className="flex flex-col gap-3">
              {quantity > 0 ? (
                <>
                  <div className="flex items-center justify-center rounded-2xl bg-white p-2 shadow-sm ring-1 ring-emerald-100 dark:bg-slate-800 dark:ring-emerald-900">
                    <QuantityControl
                      quantity={quantity}
                      onDecrease={handleDecrease}
                      onIncrease={handleIncrease}
                      ariaLabelName={product.name}
                    />
                  </div>
                  {cart.hasItems && (
                    <button
                      type="button"
                      onClick={() => navigate('/cart')}
                      className="flex w-full items-center justify-center gap-2 rounded-full border border-emerald-200/60 bg-white/50 px-4 py-3 text-base font-semibold text-emerald-800 transition hover:bg-white hover:shadow-md focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-200 dark:border-emerald-800 dark:bg-slate-900/50 dark:text-emerald-200 dark:hover:bg-slate-900"
                    >
                      <ShoppingCart className="h-4 w-4" />
                      {t('products.detail.viewCart')}
                    </button>
                  )}
                </>
              ) : (
                <button
                  type="button"
                  onClick={handleAddToCart}
                  className="flex w-full items-center justify-center gap-2 rounded-full bg-gradient-to-r from-brand-500 to-brand-600 px-6 py-3.5 text-base font-semibold uppercase tracking-wide text-white shadow-lg shadow-brand-500/30 transition hover:-translate-y-0.5 hover:shadow-brand-500/40 hover:from-brand-600 hover:to-brand-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-200"
                >
                  <PlusCircle className="h-5 w-5" />
                  {t('products.actions.addToCart')}
                </button>
              )}
            </div>
          </aside>
        </div>
      </div>

      {/* Conditional Sticky Bottom Action Bar or Quantity Stepper */}
      {showQuantityStepper ? (
        <StickyBottomContainer onHeightChange={setStickyHeight} className="flex flex-col items-center gap-3 pb-4">
          <div className="rounded-full bg-white p-1 shadow-lg dark:bg-slate-900">
            <QuantityControl
              quantity={quantity}
              onDecrease={handleDecrease}
              onIncrease={handleIncrease}
              ariaLabelName={product.name}
            />
          </div>
          {cart.hasItems ? (
            <button
              type="button"
              onClick={() => navigate('/cart')}
              className="!bg-gradient-to-r !from-brand-500 !to-brand-600 !text-white !border-transparent hover:!from-brand-600 hover:!to-brand-700 dark:!bg-none dark:!bg-brand-600 dark:!text-white flex min-h-[2.75rem] flex-1 items-center justify-center gap-2 rounded-full border border-slate-300 bg-white px-4 py-2 text-base font-semibold text-slate-700 shadow-soft transition focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-200 disabled:cursor-not-allowed disabled:opacity-60 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-200 dark:hover:border-slate-400 w-full max-w-sm"
            >
              {t('products.detail.viewCart')}
            </button>
          ) : null}
        </StickyBottomContainer>
      ) : (
        <MobileStickyAction
          onClick={handleAddToCart}
          label={t('products.actions.addToCart')}
          icon={<PlusCircle className="h-5 w-5" />}
          buttonClassName="uppercase tracking-wide"
          onHeightChange={setStickyHeight}
          secondaryLabel={cart.hasItems ? t('products.detail.viewCart') : undefined}
          onSecondaryClick={() => navigate('/cart')}
          secondaryButtonClassName="!bg-gradient-to-r !from-brand-500 !to-brand-600 !text-white !border-transparent hover:!from-brand-600 hover:!to-brand-700 dark:!bg-none dark:!bg-brand-600 dark:!text-white"
        />
      )}
    </section>
  );
}

export default ProductDetailPage;
