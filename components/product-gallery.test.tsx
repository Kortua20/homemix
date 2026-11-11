import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { beforeAll, describe, expect, it } from "vitest";

import { ProductGallery } from "@/components/product-gallery";
import type { ProductImage } from "@/lib/storefront";

const image = (id: string, sortOrder: number): ProductImage => ({
  id,
  sort_order: sortOrder,
  created_at: "2026-11-01T00:00:00Z",
});

const images = [image("a", 0), image("b", 1), image("c", 2)];

function thumbnail(index: number) {
  return screen.getByRole("button", { name: `ფოტო ${index}-ის ნახვა` });
}

// The viewer is code-split. Its first import here pays a cold transform that can outlast
// findByRole's 1s default, so it is warmed once up front, as hovering the photo does in
// the browser.
beforeAll(async () => {
  await import("@/components/image-lightbox");
});

describe("ProductGallery full-screen viewer", () => {
  it("opens on the photo currently shown", async () => {
    render(<ProductGallery images={images} productName="დივანი" />);
    fireEvent.click(thumbnail(2));
    fireEvent.click(screen.getByRole("button", { name: "ფოტოს გადიდება" }));

    const dialog = await screen.findByRole("dialog");
    expect(within(dialog).getByText(/^2\s*\/\s*3$/)).toBeInTheDocument();
    expect(within(dialog).getByRole("button", { name: "გადიდება" })).toBeInTheDocument();
  });

  it("leaves the gallery on the photo the viewer was moved to", async () => {
    render(<ProductGallery images={images} productName="დივანი" />);
    fireEvent.click(screen.getByRole("button", { name: "ფოტოს გადიდება" }));

    const dialog = await screen.findByRole("dialog");
    fireEvent.click(within(dialog).getByRole("button", { name: "შემდეგი ფოტო" }));
    await waitFor(() => expect(within(dialog).getByText(/^2\s*\/\s*3$/)).toBeInTheDocument());

    // The page behind the viewer is hidden from assistive tech while it is open, so the
    // gallery is checked the way a user sees it: after closing.
    fireEvent.click(within(dialog).getByRole("button", { name: "დახურვა" }));
    await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
    expect(thumbnail(2)).toHaveAttribute("aria-pressed", "true");
    expect(thumbnail(1)).toHaveAttribute("aria-pressed", "false");
  });

  it("shows no navigation in the viewer for a single photo", async () => {
    render(<ProductGallery images={[image("a", 0)]} productName="დივანი" />);
    fireEvent.click(screen.getByRole("button", { name: "ფოტოს გადიდება" }));

    const dialog = await screen.findByRole("dialog");
    expect(within(dialog).queryByRole("button", { name: "შემდეგი ფოტო" })).not.toBeInTheDocument();
    expect(within(dialog).queryByRole("button", { name: "წინა ფოტო" })).not.toBeInTheDocument();
  });

  it("keeps arrow-key navigation on the photo itself", () => {
    render(<ProductGallery images={images} productName="დივანი" />);
    fireEvent.keyDown(screen.getByRole("button", { name: "ფოტოს გადიდება" }), {
      key: "ArrowRight",
    });
    expect(thumbnail(2)).toHaveAttribute("aria-pressed", "true");
  });

  it("offers nothing to open when there are no photos", () => {
    render(<ProductGallery images={[]} productName="დივანი" />);
    expect(screen.queryByRole("button", { name: "ფოტოს გადიდება" })).not.toBeInTheDocument();
  });
});
