# talks

A collection of some of my public talks and presentations.

---

## Prepare a new presentation

-   Create a new [Slidev](https://sli.dev/) presentation as a subdirectory in this repo.
-   Make sure to name the directory for the talk with the format `YYYY-MM-DD-title-of-talk`, to ensure automated build process works as expected.
-   Add the new talk (`YYYY-MM-DD-title-of-talk`) to [pnpm-workspace.yaml](./pnpm-workspace.yaml)
-   Remove Netlify and Vercel config.
-   Set `routerMode: hash` in the first frontmatter of `slides.md`, to configure the router to work well with page reloads for static deployments.
-   Add final slide with image credits. See previous talks for formatting examples.

## Scripts

-   `pnpm run build` - Build all talks and prepare a `dist` folder with all assets needed in the project root

### Update talks on webpage

1. Ensure both projects exist in the same parent directory, e.g. `projects/`

2. Build talks `pnpm run build`. Note that image URLs for `<img>` elements need to use absolute URLs starting with `/` instead of `./`. Images defined in frontmatter work with relative URLs though.

3. Then run `cp -r dist/talks ../greenheart.github.io/static/`

4. In the website repo, commit and publish the built talks

### Export talk as PDF

Install `playwright-chromium` for the specific talk.

### Compress PDF to reduce file size

One way is to use `ghostscript` to make the PDF smaller:

```sh
gs -sDEVICE=pdfwrite -dCompatibilityLevel=1.4 -dPDFSETTINGS=/prepress -dNOPAUSE -dQUIET -dBATCH -sOutputFile=compressed-talk.pdf talk.pdf
```

If needed, the quality can be reduced by replacing `/prepress` (default, 300 dpi) in the command above to `/ebook` (150 dpi) or `screen` (70 dpi).
