# s-clinical.com

A static copy of the S-Clinical WordPress site (WordPress 4.9.8, Neve theme, Elementor), made for GitHub Pages.
It shows the same 8 pages and looks the same as the WordPress site did. The page heights matched the live
pages to the pixel at desktop width, and the phone layout and menu match too.

## How it was made
1. `wget --recursive --page-requisites --convert-links --adjust-extension --restrict-file-names=windows`
   over every page the WordPress REST API listed. wget stores files whose URLs had a query string as
   `name@ver=…` (for example `style.min.css@ver=1.0.28.css`). Script files received a `.js` ending so that
   they are served as JavaScript.
2. A clean-up pass:
   - removed WordPress-only `<link>` tags (feeds, REST API, XML-RPC, shortlinks);
   - made the URLs inside inline scripts relative;
   - switched Google Fonts and Font Awesome to `https://` (a page served over HTTPS blocks `http://` styles).
3. Trimmed to what the pages show. Starting from the HTML pages, every file they reference (and every file those
   stylesheets and scripts reference in turn) was kept, about 90 files. The 543 others (unused media-library images,
   plugin files) were removed. The six banner photos, up to 5760 px wide and 4.2 MB, were scaled to 2560 px wide.
   The whole site is now about 10 MB instead of 40 MB (and 2.4 GB on the server). Every page was then loaded at
   1400 px and 375 px wide and compared with the untrimmed copy: same page heights, same files loaded, no missing file.

All links are relative, so the site works on the custom domain and under a GitHub project path such as
`harshaxnim.github.io/SClinical/`.

## What works differently without WordPress
| Feature | On WordPress | Here |
| --- | --- | --- |
| Contact forms (6 pages) | Sent through the server | **Send Message** sends the message to info@s-clinical.com through [Web3Forms](https://web3forms.com) (free, 250 messages a month). If that fails, or no access key is set in `WEB3FORMS_KEY`, it opens the visitor's e-mail app with the message already written (`static-site.js`). A hidden `botcheck` box catches simple spam bots. |
| Search (magnifier icon) | WordPress search | Searches `search-index.json`, which holds the text of the 8 pages, and lists matching pages in place of the page content (`static-site.js`). |
| Zendesk chat widget, Google Map, fonts | External services | Unchanged; they load from the same external services. |

If the text of a page changes, update the matching entry in `search-index.json` too.

For search engines, `robots.txt` points to `sitemap.xml`, which lists the 8 pages, and each page's canonical link names its
`https://s-clinical.com/…/` address. If a page is added or removed, update `sitemap.xml` and give the new page its canonical link.
The site is in Google Search Console as `https://s-clinical.com/`; `google7fd790a783c8c9cf.html` proves ownership, so do
not delete it.

## Preview locally
```sh
docker run --rm -p 4002:80 -v "$PWD":/usr/share/nginx/html:ro nginx:alpine
# open http://localhost:4002
```

## Published copy
The repository `harshaxnim/SClinical` publishes this folder with GitHub Pages from `main`, as a backup at
<https://harshaxnim.github.io/SClinical/>. Every link is relative, so it works at that address. The 404 page
finds the site root by itself on a `github.io` address.

### Moving s-clinical.com here
The domain still points at the old server, so the repository has no `CNAME` file yet (with one, GitHub would send
visitors of the backup address on to s-clinical.com). When the old server is to be switched off:
1. Add a file `CNAME` containing `s-clinical.com`, commit and push.
2. In the domain's DNS: four `A` records for `s-clinical.com` (185.199.108.153, 185.199.109.153, 185.199.110.153,
   185.199.111.153), four `AAAA` records (2606:50c0:8000::153, 2606:50c0:8001::153, 2606:50c0:8002::153,
   2606:50c0:8003::153) and `www` as a `CNAME` to `harshaxnim.github.io`. If the DNS is on Cloudflare, leave the
   records unproxied (grey cloud) so GitHub can issue the HTTPS certificate.
3. In the repository's *Settings → Pages*, check that the custom domain shows `s-clinical.com`, then turn on
   *Enforce HTTPS* once the certificate is issued.

## Not included
- The WordPress database. The static pages do not need it. To keep a copy before the server is deleted,
  run `mysqldump` on the server and store the file somewhere private, not in this public repository.
- `wp-content/updraft/` (183 MB of UpdraftPlus backups) and the 2.1 GB of access logs, which are still on the
  server.
