Source for Chung-Pang Wang's academic portfolio website.

The layout is based on Jon Barron's public academic website template:
https://jonbarron.info/

## Local Preview

Serve the static site from this directory:

```sh
python3 -m http.server 8000
```

Then open:

```text
http://127.0.0.1:8000/
```

## Validation

Run the lightweight site checks before publishing:

```sh
node --test tests/site-validation.test.js
```

The validation covers local links, email links, broken DOM id references, image
alt text, lazy loading attributes, table row balance, and common HTML syntax
cleanup issues.

## Review Notes

See `docs/review-fixes.md` for the May 27, 2026 code review cleanup notes.
