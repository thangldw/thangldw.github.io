# Apps viewport and light background design

## Scope

- Make `/apps/` fit all nine project rows in one desktop viewport without page or internal vertical scrolling.
- Preserve natural document scrolling below the `760px` mobile breakpoint.
- Set the light-theme background of `/` and `/apps/` to `#fbfcfe`.
- Preserve the current dark-theme backgrounds and all homepage content, layout, and interactions.

## Desktop layout

At widths above `760px`, the Apps page uses the viewport height as its layout boundary. The hero, toolbar, and table header use compact fixed-height bands; the project table body receives the remaining height and distributes it across the visible project rows. Descriptions truncate to one line and the intermediate-width desktop layout omits tag chips visually so the rows remain readable.

Filtering and search may leave unused space after reducing the result set. The page must not introduce an internal table scrollbar to fill that space.

## Mobile layout

The existing mobile catalog remains content-driven: full descriptions, tags, and natural vertical page scrolling. No fixed viewport height or row compression applies at widths of `760px` or less.

## Theme behavior

The shared light canvas token becomes `#fbfcfe` for the homepage and Apps page. Dark-theme selectors continue to override that canvas with the existing dark value. No other homepage visual or content change is in scope.

## Validation

- Render `/apps/` at `1280x720`, `1440x900`, and `1440x1000`; assert `document.documentElement.scrollHeight <= window.innerHeight` and no horizontal overflow.
- Render `/apps/` at `390x844`; assert natural vertical scrolling remains available and no horizontal overflow is introduced.
- Exercise search and category filtering and verify the visible result count and project links.
- Render `/` and `/apps/` in light and dark themes; verify light background `rgb(251, 252, 254)` and unchanged dark background.
- Run the site validator and complete certification smoke suite before release.
