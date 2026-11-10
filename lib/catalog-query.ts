// The catalogue's URL shape, shared by the filter form (client) and the pages that render
// it (server).
//
// This file deliberately has no "use client": it lives in both worlds. Putting it in
// catalog-filter-form.tsx made every export a client reference, so a server component
// calling buildPageHrefFrom got "attempted to call a client function from the server" —
// which typechecks and builds fine and only fails at request time.

// Every param the catalogue understands. Each filter popover is its own <form>, so it must
// carry hidden inputs for all the OTHER active params — otherwise submitting the colour
// popover silently clears the search box. This type is the single source of truth for that
// list, and for the pager below.
export type CatalogQuery = {
  q: string;
  category: string;
  minPrice: string;
  maxPrice: string;
  minWidth: string;
  maxWidth: string;
  minHeight: string;
  maxHeight: string;
  materials: string[];
  colours: string[];
  styles: string[];
  // "1" or "". A flag rather than true/false: "show only foldable" is the only question a
  // shopper asks — nobody filters for things that do not fold.
  foldable: string;
  mechanisms: string[];
  // "yes", "no" or "" (no filter).
  storage: string;
};

// The scalar params, in URL order. Shared by the pager below and the filter form's
// CarriedParams, which must agree on the list or a popover drops another filter on submit.
export const CATALOG_SCALAR_PARAMS = [
  "q",
  "category",
  "minPrice",
  "maxPrice",
  "minWidth",
  "maxWidth",
  "minHeight",
  "maxHeight",
  "foldable",
  "storage",
] as const satisfies readonly (keyof CatalogQuery)[];

// The params that legitimately repeat.
export const CATALOG_LIST_PARAMS = [
  "materials",
  "colours",
  "styles",
  "mechanisms",
] as const satisfies readonly (keyof CatalogQuery)[];

type RawParams = Record<string, string | string[] | undefined>;

function firstParam(value: string | string[] | undefined) {
  return (Array.isArray(value) ? (value[0] ?? "") : (value ?? "")).trim();
}

// Reads the folding and storage params for both catalogue pages (/products and
// /categories/[slug]), which otherwise each carry their own copy of the parsing.
//
// Junk normalises to "no filter" rather than throwing, like every other catalogue param:
// a hand-edited ?storage=maybe shows the unfiltered grid instead of an error page.
export function readFeatureParams(params: RawParams): {
  foldable: boolean;
  mechanisms: string[];
  storage: "yes" | "no" | "";
} {
  const rawMechanisms = params.mechanisms;
  const mechanisms = (Array.isArray(rawMechanisms) ? rawMechanisms : [rawMechanisms ?? ""])
    .map((value) => value.trim())
    // Same shape as folding_mechanisms_code_check — keeps arbitrary text out of the query.
    .filter((value) => /^[a-z][a-z0-9_]{1,30}$/.test(value));
  const storage = firstParam(params.storage);

  return {
    foldable: firstParam(params.foldable) === "1",
    mechanisms: [...new Set(mechanisms)],
    storage: storage === "yes" || storage === "no" ? storage : "",
  };
}

// The `storage` URL value as the boolean getCatalogProducts filters on.
export function storageFilterValue(storage: string) {
  if (storage === "yes") return true;
  if (storage === "no") return false;
  return undefined;
}

// The pager's href builder: every active filter survives the jump, only `page` changes.
//
// Built from CatalogQuery rather than by mutating the incoming searchParams, so it carries
// exactly the normalized values the page is actually showing: a clamped maxPrice or a
// dropped junk param stays dropped instead of being propagated onward.
//
// Note the reverse direction needs no equivalent — formActionUrl serializes only the form's
// own fields, and no form carries a `page` input, so submitting any filter drops the page
// and lands on page 1. That is the correct behaviour and it falls out for free.
export function buildPageHrefFrom(pathname: string, query: CatalogQuery) {
  return (page: number) => {
    const params = new URLSearchParams();

    for (const key of CATALOG_SCALAR_PARAMS) {
      const value = String(query[key] ?? "");
      if (value) params.set(key, value);
    }
    // append, not set: these legitimately repeat.
    for (const key of CATALOG_LIST_PARAMS) {
      for (const value of query[key]) params.append(key, value);
    }
    // Page 1 is the bare URL: /products and /products?page=1 would otherwise be two
    // addresses for one grid, splitting its ranking and its cache entries.
    if (page > 1) params.set("page", String(page));

    return params.size ? `${pathname}?${params.toString()}` : pathname;
  };
}
