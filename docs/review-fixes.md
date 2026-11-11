# Website Review Fixes

Date: May 27, 2026

## What Changed

- Fixed the email link so it opens with `mailto:`.
- Escaped the Google Scholar query string ampersand for valid HTML.
- Removed broken hover JavaScript that referenced a missing `ever_image` id.
- Repaired malformed table rows and closed the publications table before the
  projects table begins.
- Added descriptive `alt` text to project and publication images.
- Added `loading="lazy"` and `decoding="async"` to non-profile images to reduce
  initial page-load pressure.
- Removed empty paragraphs that were being used as spacing.
- Fixed missing `&nbsp;` semicolons and stray comma attributes in image tags.
- Added `tests/site-validation.test.js` so these issues are easier to catch
  before publishing.

## How To Check

```sh
node --test tests/site-validation.test.js
```

For a local preview:

```sh
python3 -m http.server 8000
```

Then open `http://127.0.0.1:8000/`.

## Follow-Ups

- The largest GIFs are still heavy. Lazy loading helps, but converting the
  largest demos to smaller video files would improve load time further.
- `.DS_Store` was removed from the git index (it is already in `.gitignore`).
