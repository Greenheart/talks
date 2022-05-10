# talks

A collection of my talks and presentations.

---

## Prepare a new presentation

- Create a new [Slidev](https://sli.dev/) presentation as a subdirectory in this repo.
- Make sure to name the directory for the talk with the format `YYYY-MM-DD-title-of-talk`, to ensure automated build process works as expected.
- Remove Netlify and Vercel config.
- Set `routerMode: hash` in the first frontmatter of `slides.md`, to configure the router to work well with page reloads for static deployments.
- Update the npm `build` script for the talk to include correct basepath: `"build": "slidev build --base /talks/$(basename \"$PWD\")/",`
- Add final slide with image credits. See previous talks for formatting examples.

## Scripts

- `npm run build` - Build all talks and prepare a `dist` folder with all assets needed in the project root
- `npm run serve` - Preview all talks. View `http://localhost:5000` and verify the build before publishing.
- `npm run publish` - Build and publish the latest version to GitHub Pages.

### Update talks on webpage

1. Ensure both projects exist in the same parent directory, e.g. `projects/`

2. Build talks `npm run build`

3. Then run `cp -r dist/talks ../greenheart.github.io/static/`

4. In the website repo, commit and publish the built talks