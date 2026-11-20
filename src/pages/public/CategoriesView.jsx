import { useEffect, useMemo } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate, useSearchParams } from "react-router-dom";
import {
  ArrowLeftIcon,
  FireIcon,
  ShoppingBagIcon,
  Squares2X2Icon,
} from "@heroicons/react/24/outline";
import Breadcrumb from "@/components/common/Breadcrumb";
import EmptyState from "@/components/common/EmptyState";
import ErrorState from "@/components/common/ErrorState";
import LoadingSpinner from "@/components/common/LoadingSpinner";
import {
  fetchCategories,
  selectCategories,
  selectCategoriesError,
  selectCategoriesLoading,
} from "@/features/categories";
import { classNames, getCategoryLabel, resolveMediaUrl } from "@/utils";

const productsHref = (categoryKey, subcategoryKey = "") => {
  const params = new URLSearchParams();
  if (categoryKey) params.set("category", categoryKey);
  if (subcategoryKey) params.set("subcategory", subcategoryKey);
  const query = params.toString();
  return query ? `/products?${query}` : "/products";
};

const FALLBACK_CATEGORY_IMAGE =
  "https://images.unsplash.com/photo-1472851294608-062f824d29cc?w=800&q=80";

const productCountOf = (category) => category._count?.products ?? 0;
const subcategoryCountOf = (category) =>
  Array.isArray(category?.subcategories) ? category.subcategories.length : 0;

const formatProductCount = (count) =>
  `${count} ${count === 1 ? "product" : "products"}`;

const handleImageError = (e) => {
  if (e.currentTarget.src !== FALLBACK_CATEGORY_IMAGE) {
    e.currentTarget.src = FALLBACK_CATEGORY_IMAGE;
  }
};

function CategoryCircle({
  title,
  image,
  badgeCount,
  badgeLabel,
  subtitle,
  onClick,
  selected = false,
}) {
  const showBadge = Number.isFinite(badgeCount) && badgeCount >= 0;

  return (
    <button
      type="button"
      onClick={onClick}
      className="group flex w-full flex-col items-center gap-3 text-center"
    >
      <span className="relative block aspect-square w-full max-w-40">
        <span
          className={classNames(
            "block h-full w-full overflow-hidden rounded-full border-[3px] bg-sky-100 transition duration-300",
            selected
              ? "border-primary-500 ring-primary-100 shadow-md ring-4"
              : "group-hover:border-primary-400 border-slate-200 group-hover:shadow-md",
          )}
        >
          <img
            src={resolveMediaUrl(image) || FALLBACK_CATEGORY_IMAGE}
            alt={title}
            loading="lazy"
            onError={handleImageError}
            className="h-full w-full object-cover transition duration-300 group-hover:scale-105"
          />
        </span>
        {showBadge && (
          <span
            className="absolute top-3 right-1 z-10 flex h-8 min-w-8 items-center justify-center rounded-full bg-emerald-500 px-2 text-xs font-bold text-white shadow-sm sm:top-2 sm:right-0"
            title={badgeLabel || String(badgeCount)}
          >
            {badgeCount > 99 ? "99+" : badgeCount}
          </span>
        )}
      </span>
      <span className="max-w-40 space-y-0.5">
        <span
          className={classNames(
            "line-clamp-2 block text-sm font-semibold transition sm:text-base",
            selected
              ? "text-primary-700"
              : "group-hover:text-primary-600 text-slate-800",
          )}
        >
          {title}
        </span>
        {subtitle ? (
          <span className="block text-xs font-medium text-slate-500">
            {subtitle}
          </span>
        ) : null}
      </span>
    </button>
  );
}

export default function CategoriesView() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const categories = useSelector(selectCategories);
  const categoriesLoading = useSelector(selectCategoriesLoading);
  const categoriesError = useSelector(selectCategoriesError);
  const [searchParams, setSearchParams] = useSearchParams();

  const selectedCategoryKey = searchParams.get("category") || "";
  const selectedSubcategoryKey = searchParams.get("subcategory") || "";

  const { totalProducts, topCategory, featured } = useMemo(() => {
    const byPopularity = [...categories].sort(
      (a, b) => productCountOf(b) - productCountOf(a),
    );
    return {
      totalProducts: categories.reduce(
        (sum, cat) => sum + productCountOf(cat),
        0,
      ),
      topCategory:
        byPopularity[0] && productCountOf(byPopularity[0]) > 0
          ? byPopularity[0]
          : null,
      featured: byPopularity.slice(0, 3),
    };
  }, [categories]);

  const selectedMainCategory = useMemo(
    () =>
      categories.find(
        (cat) =>
          cat.id === selectedCategoryKey || cat.slug === selectedCategoryKey,
      ) || null,
    [categories, selectedCategoryKey],
  );

  const selectedSubcategory = useMemo(
    () =>
      selectedMainCategory?.subcategories?.find(
        (subcat) =>
          subcat.id === selectedSubcategoryKey ||
          subcat.slug === selectedSubcategoryKey,
      ) || null,
    [selectedMainCategory, selectedSubcategoryKey],
  );

  const selectedMainSubcategories = Array.isArray(
    selectedMainCategory?.subcategories,
  )
    ? selectedMainCategory.subcategories
    : [];

  const selectedMainTitle = selectedMainCategory
    ? getCategoryLabel(selectedMainCategory)
    : "Categories";

  const updateParams = (patch) => {
    const next = new URLSearchParams(searchParams);
    Object.entries(patch).forEach(([key, value]) => {
      if (value === undefined || value === null || value === "")
        next.delete(key);
      else next.set(key, String(value));
    });
    setSearchParams(next);
  };

  const selectMainCategory = (categoryKey) => {
    if (!categoryKey) {
      updateParams({ category: "", subcategory: "" });
      return;
    }
    updateParams({ category: categoryKey, subcategory: "" });
  };

  const openSubcategory = (subcategoryKey) => {
    if (!selectedMainCategory || !subcategoryKey) return;
    const categoryKey =
      selectedMainCategory.slug ||
      selectedMainCategory.id ||
      selectedCategoryKey;
    navigate(productsHref(categoryKey, subcategoryKey));
  };

  useEffect(() => {
    dispatch(fetchCategories());
  }, [dispatch]);

  // Deep links like /categories?category=…&subcategory=… open the product list.
  useEffect(() => {
    if (categoriesLoading || !selectedSubcategoryKey || !selectedMainCategory) {
      return;
    }
    if (!selectedSubcategory) return;
    const categoryKey =
      selectedMainCategory.slug ||
      selectedMainCategory.id ||
      selectedCategoryKey;
    const subcategoryKey =
      selectedSubcategory.slug ||
      selectedSubcategory.id ||
      selectedSubcategoryKey;
    navigate(productsHref(categoryKey, subcategoryKey), { replace: true });
  }, [
    categoriesLoading,
    navigate,
    selectedCategoryKey,
    selectedMainCategory,
    selectedSubcategory,
    selectedSubcategoryKey,
  ]);

  if (categoriesLoading) {
    return <LoadingSpinner className="py-16" label="Loading categories..." />;
  }

  if (categoriesError) {
    return (
      <div className="container-app py-8">
        <div className="mx-auto w-full max-w-7xl">
          <ErrorState
            title="Could not load categories"
            description={categoriesError}
            onRetry={() => dispatch(fetchCategories())}
          />
        </div>
      </div>
    );
  }

  const breadcrumbItems = selectedMainCategory
    ? [{ label: "Categories", to: "/categories" }, { label: selectedMainTitle }]
    : [{ label: "Categories" }];

  return (
    <div className="container-app py-8">
      <div className="mx-auto w-full max-w-7xl">
        <Breadcrumb items={breadcrumbItems} />

        <section className="from-primary-600 to-primary-800 relative mt-6 overflow-hidden rounded-2xl bg-linear-to-br px-6 py-10 text-white sm:px-10 sm:py-12">
          <div className="pointer-events-none absolute -top-24 -right-24 h-72 w-72 rounded-full bg-white/10" />
          <div className="pointer-events-none absolute -bottom-32 left-1/3 h-64 w-64 rounded-full bg-white/5" />

          <div className="relative grid items-center gap-10 lg:grid-cols-[1fr_auto]">
            <div className="max-w-2xl">
              <p className="text-xs font-semibold tracking-widest text-yellow-400 uppercase sm:text-sm">
                Shop by category
              </p>
              <h1 className="mt-2 text-3xl font-bold sm:text-4xl">
                {selectedMainCategory ? selectedMainTitle : "Browse Categories"}
              </h1>
              <p className="mt-3 text-sm leading-relaxed text-white/80 sm:text-base">
                {selectedMainCategory
                  ? "Choose a subcategory below to see matching products."
                  : "Find exactly what you need, faster. Explore our collections below and tap any category to browse."}
              </p>

              <dl className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-3">
                <div className="rounded-xl bg-white/10 px-4 py-3 ring-1 ring-white/20">
                  <dt className="flex items-center gap-1.5 text-xs text-white/70">
                    <Squares2X2Icon className="h-4 w-4" />
                    Categories
                  </dt>
                  <dd className="mt-1 text-2xl font-bold">
                    {categories.length}
                  </dd>
                </div>
                <div className="rounded-xl bg-white/10 px-4 py-3 ring-1 ring-white/20">
                  <dt className="flex items-center gap-1.5 text-xs text-white/70">
                    <ShoppingBagIcon className="h-4 w-4" />
                    Products
                  </dt>
                  <dd className="mt-1 text-2xl font-bold">{totalProducts}</dd>
                </div>
                {topCategory && (
                  <div className="col-span-2 rounded-xl bg-white/10 px-4 py-3 ring-1 ring-white/20 sm:col-span-1">
                    <dt className="flex items-center gap-1.5 text-xs text-white/70">
                      <FireIcon className="h-4 w-4" />
                      Most popular
                    </dt>
                    <dd className="mt-1 truncate text-base font-semibold">
                      {getCategoryLabel(topCategory)}
                    </dd>
                    <dd className="text-xs text-white/70">
                      {formatProductCount(productCountOf(topCategory))}
                    </dd>
                  </div>
                )}
              </dl>
            </div>

            {featured.length > 0 && (
              <div className="hidden -space-x-6 lg:flex">
                {featured.map((cat) => (
                  <span
                    key={cat.id}
                    className="block h-28 w-28 overflow-hidden rounded-full border-4 border-white/90 bg-white shadow-lg"
                  >
                    <img
                      src={
                        resolveMediaUrl(cat.image) || FALLBACK_CATEGORY_IMAGE
                      }
                      alt=""
                      onError={handleImageError}
                      className="h-full w-full object-cover"
                    />
                  </span>
                ))}
              </div>
            )}
          </div>
        </section>

        {selectedMainCategory && (
          <div className="mt-6 flex justify-start">
            <button
              type="button"
              onClick={() => selectMainCategory("")}
              className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-600 transition hover:bg-slate-50"
            >
              <ArrowLeftIcon className="h-4 w-4" />
              All categories
            </button>
          </div>
        )}

        {categories.length === 0 ? (
          <div className="mt-10">
            <EmptyState
              title="No categories available"
              description="Categories will appear here when available."
            />
          </div>
        ) : selectedMainCategory ? (
          selectedMainSubcategories.length > 0 ? (
            <div className="mt-10 grid grid-cols-2 gap-x-4 gap-y-8 sm:grid-cols-3 sm:gap-x-6 sm:gap-y-10 md:grid-cols-5">
              {selectedMainSubcategories.map((subcat) => {
                const productCount = productCountOf(subcat);
                return (
                  <CategoryCircle
                    key={subcat.id}
                    title={subcat.title || subcat.name}
                    image={subcat.image || selectedMainCategory.image || ""}
                    badgeCount={productCount}
                    badgeLabel={formatProductCount(productCount)}
                    subtitle={formatProductCount(productCount)}
                    selected={selectedSubcategory?.id === subcat.id}
                    onClick={() => openSubcategory(subcat.slug || subcat.id)}
                  />
                );
              })}
            </div>
          ) : (
            <div className="mt-10 rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-6 py-12 text-center">
              <p className="text-sm text-slate-500">
                No subcategories yet for this category.
              </p>
              <button
                type="button"
                onClick={() =>
                  navigate(
                    productsHref(
                      selectedMainCategory.slug || selectedMainCategory.id,
                    ),
                  )
                }
                className="text-primary-600 hover:text-primary-700 mt-3 text-sm font-semibold"
              >
                View all products in {selectedMainTitle}
              </button>
            </div>
          )
        ) : (
          <div className="mt-10 grid grid-cols-2 gap-x-4 gap-y-8 sm:grid-cols-3 sm:gap-x-6 sm:gap-y-10 md:grid-cols-5">
            {categories.map((cat) => {
              const productCount = productCountOf(cat);
              const subCount = subcategoryCountOf(cat);
              return (
                <CategoryCircle
                  key={cat.id}
                  title={getCategoryLabel(cat)}
                  image={cat.image}
                  badgeCount={subCount}
                  badgeLabel={`${subCount} sub ${subCount === 1 ? "item" : "items"}`}
                  subtitle={formatProductCount(productCount)}
                  onClick={() => selectMainCategory(cat.slug || cat.id)}
                />
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
