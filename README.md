# talks

A collection of my talks and presentations.

---

## Prepare a new presentation

- Create a new [Slidev](https://sli.dev/) presentation as a subdirectory in this repo.
- Remove Netlify and Vercel config.
- Update the npm `build` script for the talk to include correct basepath: `"build": "slidev build --base /$(basename \"$PWD\")/",`

## Scripts

- `npm run build` - Build all talks and prepare a `dist` folder with all assets needed in the project root
- `npm run serve` - Preview all talks. View `http://localhost:5000` and verify the build before publishing.
- `npm run publish` - Build and publish the latest version to GitHub Pages.