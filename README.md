# Big Boy Bagel — Eleventy + Decap CMS (Structured Menu)

A multi-page static site with a collage-forward NYC vibe, powered by **Eleventy (11ty)** and **Decap (Netlify) CMS**.
Non-engineers can edit pages, images, and **Menu Items** in a friendly UI at `/admin/`.

## Quick Start
- Install: `npm install`
- Run: `npm run dev` (open the printed local URL)
- Build: `npm run build` (outputs to `dist/`)

## Structure
- `src/` Markdown pages and `menu-items/` collection
- `admin/` CMS UI and config
- `src/assets/` CSS/JS/images (uploads in `src/assets/uploads`)
- `.eleventy.js` defines the `menuItems` collection + ordering filter

## CMS
- Default backend: `git-gateway` (Netlify Identity + Git Gateway)
- Alternatively use GitHub backend (edit `admin/config.yml`):
  ```yaml
  backend:
    name: github
    repo: YOUR_GH_USERNAME/YOUR_REPO
    branch: main
  ```

### Menu Items (structured)
- Fields: Title, Price, Tags, Order, Image, Alt, Description
- Order controls display position (lower = earlier)
- Rendered automatically on `/menu/`

## Deploy
### Netlify
- Build: `npm run build`
- Publish: `dist`
- Enable Identity + Git Gateway, then login at `/admin/`

### Cloudflare Pages
- Build: `npm run build`
- Output dir: `dist`
- Use GitHub backend for CMS or host Identity elsewhere

## Troubleshooting
- CMS login: enable Identity + Git Gateway (Netlify) or configure GitHub OAuth
- Images: upload to `src/assets/uploads/` and reference `/assets/uploads/...`
- Menu not updating: ensure files live in `src/menu-items/` with valid front matter and numeric `order`
