"use client";

import Lightbox from "yet-another-react-lightbox";
import Counter from "yet-another-react-lightbox/plugins/counter";
import Thumbnails from "yet-another-react-lightbox/plugins/thumbnails";
import Zoom from "yet-another-react-lightbox/plugins/zoom";
import "yet-another-react-lightbox/styles.css";
import "yet-another-react-lightbox/plugins/counter.css";
import "yet-another-react-lightbox/plugins/thumbnails.css";

// The full-screen photo viewer behind the product gallery. Loaded with next/dynamic from
// the gallery, so the library stays out of the product page's bundle until first use.
//
// A library rather than a hand-rolled overlay: what a viewer has to get right is the
// gestures — pinch-zoom, panning a zoomed photo within its bounds, double-tap, wheel zoom,
// swipe between photos, pull-down to close — and those are both fiddly and impossible to
// verify in jsdom. It also provides the dialog semantics (focus trap, Escape, focus
// restored to the trigger, scroll lock) and honours prefers-reduced-motion.
//
// The backdrop stays the library's neutral black on purpose: a tinted one shifts how the
// upholstery and wood colours read, and colour is part of what a buyer is checking.

export type LightboxImage = {
  src: string;
  alt: string;
};

const labels = {
  Lightbox: "ფოტოს დათვალიერება",
  "Photo gallery": "ფოტოგალერეა",
  Carousel: "ფოტოები",
  Slide: "ფოტო",
  "{index} of {total}": "ფოტო {index} / {total}",
  Previous: "წინა ფოტო",
  Next: "შემდეგი ფოტო",
  Close: "დახურვა",
  "Zoom in": "გადიდება",
  "Zoom out": "დაპატარავება",
  Thumbnails: "მინიატურები",
};

// With a single photo there is nothing to navigate to, so the arrows are not rendered at
// all rather than shown disabled.
const singleImageRender = {
  buttonPrev: () => null,
  buttonNext: () => null,
};

// Render it only while the viewer should be shown: it opens on mount, plays its own
// fade-out on close and only then calls onClose, at which point the caller unmounts it.
export function ImageLightbox({
  images,
  index,
  onClose,
  onIndexChange,
}: {
  images: LightboxImage[];
  index: number;
  onClose: () => void;
  onIndexChange?: (index: number) => void;
}) {
  const hasMany = images.length > 1;

  return (
    <Lightbox
      open
      close={onClose}
      index={index}
      slides={images}
      plugins={hasMany ? [Zoom, Thumbnails, Counter] : [Zoom]}
      labels={labels}
      render={hasMany ? undefined : singleImageRender}
      // Finite, unlike the inline gallery, which wraps: in wrap-around mode the thumbnail
      // strip repeats photos at its ends (4 · 1 · 2 · 3 · 4), which reads as a duplicate,
      // while a finite one shows the real order and a disabled arrow says "last photo".
      //
      // `preload` is the photo count because it also sizes the thumbnail strip (current
      // ± preload): any less and the strip silently leaves photos out. It does mean every
      // full-size photo is fetched on open — free today, as the inline thumbnails already
      // load the same unoptimised originals (next.config.ts), but worth revisiting if the
      // image optimiser is turned back on.
      carousel={{ finite: true, preload: images.length }}
      controller={{ closeOnPullDown: true, closeOnBackdropClick: true }}
      zoom={{
        // Up to 2 image pixels per screen pixel: enough to inspect a scratch or a seam on
        // a phone photo, without zooming so far past the source that it turns to mush.
        maxZoomPixelRatio: 2,
        // A plain wheel / trackpad scroll zooms, as in other photo viewers. Navigation is
        // still on the arrows, the keyboard and horizontal swipes.
        scrollToZoom: true,
      }}
      thumbnails={{
        width: 80,
        height: 60,
        border: 2,
        // Only the active thumbnail gets a (white) border, so the current photo is
        // unambiguous; the library's default outlines every thumbnail alike.
        borderColor: "transparent",
        borderRadius: 6,
        padding: 0,
        gap: 8,
        imageFit: "cover",
        vignette: false,
      }}
      styles={{ thumbnailsContainer: { padding: 12 } }}
      on={{ view: ({ index: viewed }) => onIndexChange?.(viewed) }}
    />
  );
}
