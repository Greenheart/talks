import { exec } from 'promisify-child-process'
import {
    readdir,
    rm,
    readFile,
    writeFile,
    mkdir,
    copyFile,
    stat,
} from 'fs/promises'
import { resolve } from 'path'

const ignoredFolders = [
    'node_modules',
    'dist',
    '.git',
    '.vscode',
    // Ignore old talks since they have already been published
    // This works around https://github.com/Greenheart/talks/issues/11
    '2021-05-17-chalmers-sustainability-entrepreneurship',
    '2021-09-11-hackforfuture-co-creation',
]
const cwd = process.cwd()
const basePath = 'talks'
const distPath = resolve(cwd, 'dist', basePath)

/**
 * Get the names of all talks, based on directory names in the project root.
 *
 * Ignores unrelated directories and all files.
 *
 * @param {string} path the path where to get all talks from.
 * @returns {string[]} Array with names of all talks.
 */
async function getAllTalks(path) {
    const filesAndFolders = (await readdir(path)).filter(
        (entry) => !ignoredFolders.includes(entry),
    )

    // Async filter function: https://stackoverflow.com/a/47095184/4183985
    const shouldKeepFolder = await Promise.all(
        filesAndFolders.map(async (entry) =>
            (await stat(path + '/' + entry)).isDirectory(),
        ),
    )

    return filesAndFolders.filter((_, index) => !!shouldKeepFolder[index])
}

/**
 * Delete old build directory.
 *
 * @param {string} path Path to the old build directory.
 */
async function deleteOldBuild(path) {
    try {
        await rm(path, { recursive: true })
    } catch (e) {
        console.error(e)
    }
}

/**
 * Group all talks by year into an object.
 *
 * @param {string[]} talks Array of directory names matching the talks to build.
 * @returns {Map<string, string[]>} Object with all talks grouped by year.
 */
function getTalksByYear(talks) {
    return talks.reduce((years, talk) => {
        const year = talk.slice(0, 4)
        years[year] = years[year] ? years[year].concat(talk) : [talk]
        return years
    }, {})
}

/**
 * Get HTML string with links for a given year.
 *
 * @param {[string, string[]]} linksForYear Entry with all links for a given year.
 * @returns {string} HTML string with links for a given year.
 */
function getLinksForYear([year, talks]) {
    const linksForYear = talks
        .map((talk) => `\n    <a href="/${basePath}/${talk}/">${talk}</a>`)
        .join('\n')
    return `<h2>${year}</h2>${linksForYear}`
}

/**
 * Generate a simple index.html page to list all talks, grouped by year.
 *
 * @param {string[]} talks Array of directory names matching the talks to build.
 * @returns {Promise} Promise resolving when the index.html file has been written to storage.
 */
async function buildIndexPage(talks) {
    const inputHTML = await readFile(resolve(cwd, 'index.html'), {
        encoding: 'utf-8',
    })

    const links = Object.entries(getTalksByYear(talks))
        .map(getLinksForYear)
        .reverse()
        .join('\n')
    const outputHTML = inputHTML.replace('<!--LINKS-->', links)

    await writeFile(resolve(distPath, 'index.html'), outputHTML, {
        encoding: 'utf-8',
    })
}

/**
 * Create a directory if it doesn't exist.
 *
 * @param {string} path The path of the directory to create if it doesn't exist.
 */
async function ensureDirExists(path) {
    try {
        await mkdir(path, { recursive: true })
    } catch (e) {
        console.error(e)
    }
}

const pluralize = (count, noun, suffix = 's') =>
    `${count} ${noun}${count !== 1 ? suffix : ''}`

/**
 * Build all talks and move them to the right place in the build output folder.
 *
 * @param {string[]} talks Array of directory names matching the talks to build.
 * @returns {Promise[]} Array of promises for each build happening concurrently.
 */
async function buildAllTalks(talks) {
    console.log(`Building ${pluralize(talks.length, 'talk')}...`)
    return Promise.all(
        talks.map(async (talk) => {
            const base = `/talks/${talk}/`
            const out = resolve(distPath, talk)
            const { stderr, stdout } = await exec(
                `cd ${talk} && npm run build -- --base ${base} --out ${out}`,
            )

            if (stderr) {
                console.error(`❌ ${talk}\n\n${stderr}`)
            }
            if (stdout) {
                console.log(`✅ ${talk}`)
                await removeUnwantedFiles(distPath, talk)
            }
        }),
    )
}

const UNWANTED_FILES = ['_redirects', '404.html']

async function removeUnwantedFiles(distPath, talk) {
    return Promise.all(
        UNWANTED_FILES.map((path) =>
            rm(`${distPath}/${talk}/${path}`, { force: true }),
        ),
    )
}

/**
 * Copy the redirect script used to simplify local testing.
 */
async function copyRedirectPage() {
    return copyFile('redirect.html', resolve(distPath, '..', 'index.html'))
}

/**
 * Build all talks and optionally include helper files to aid local development and deployment to GitHub Pages
 * @param {boolean} includeHelperFiles
 */
async function buildAll(includeHelperFiles = false) {
    const [talks] = await Promise.all([
        getAllTalks(cwd),
        deleteOldBuild(distPath),
    ])
    console.log(talks)

    await ensureDirExists(distPath)

    const buildTasks = [buildAllTalks(talks)]
    if (includeHelperFiles) {
        buildTasks.push(buildIndexPage(talks), copyRedirectPage(talks))
    }

    await Promise.all(buildTasks)
}

buildAll(false)
