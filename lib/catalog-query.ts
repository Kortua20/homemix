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
};

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
    const scalars: (keyof CatalogQuery)[] = [
      "q",
      "category",
      "minPrice",
      "maxPrice",
      "minWidth",
      "maxWidth",
      "minHeight",
      "maxHeight",
    ];

    for (const key of scalars) {
      const value = String(query[key] ?? "");
      if (value) params.set(key, value);
    }
    // append, not set: these legitimately repeat.
    for (const value of query.materials) params.append("materials", value);
    for (const value of query.colours) params.append("colours", value);
    for (const value of query.styles) params.append("styles", value);
    // Page 1 is the bare URL: /products and /products?page=1 would otherwise be two
    // addresses for one grid, splitting its ranking and its cache entries.
    if (page > 1) params.set("page", String(page));

    return params.size ? `${pathname}?${params.toString()}` : pathname;
  };
}
