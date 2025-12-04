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
import { promisify } from 'util'
import { exec } from 'child_process'

const execAsync = promisify(exec)

const ignoredDirectories = [
    'node_modules',
    'dist',
    '.git',
    '.vscode',
    // Ignore old talks since they have already been published
    // This works around https://github.com/Greenheart/talks/issues/11
    '2021-05-17-chalmers-sustainability-entrepreneurship',
    '2021-09-11-hackforfuture-co-creation',
    '2022-05-09-chalmers-entrepreneurship-inner-development',
    '2022-12-15-idg-toolkit-launch',
    '2023-05-08-chalmers-entrepreneurship',
    '2024-04-11-chalmers-entrepreneurship',
    '2025-04-10-chalmers-entrepreneurship',
]
const cwd = process.cwd()
const basePath = 'talks'
const distPath = resolve(cwd, 'dist', basePath)

/**
 * Get the names of all talks, based on directory names in the project root.
 *
 * Ignores unrelated directories and all files.
 *
 * @param path the path where to get all talks from.
 * @returns Array with names of all talks.
 */
async function getAllTalks(path: string) {
    const filesAndFolders = (await readdir(path)).filter(
        (entry) => !ignoredDirectories.includes(entry),
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
 * @param path Path to the old build directory.
 */
async function deleteOldBuild(path: string) {
    try {
        await rm(path, { recursive: true })
    } catch (e) {
        console.error(e)
    }
}

/**
 * Group all talks by year into an object.
 *
 * @param talks Array of directory names matching the talks to build.
 * @returns Object with all talks grouped by year.
 */
function getTalksByYear(talks: string[]) {
    return talks.reduce((years, talk) => {
        const year = talk.slice(0, 4)
        years[year] = years[year] ? years[year].concat(talk) : [talk]
        return years
    }, {} as Record<string, string[]>)
}

/**
 * Get HTML string with links for a given year.
 *
 * @param linksForYear Entry with all links for a given year.
 * @returns HTML string with links for a given year.
 */
function getLinksForYear([year, talks]: [string, string[]]) {
    const linksForYear = talks
        .map((talk) => `\n    <a href="/${basePath}/${talk}/">${talk}</a>`)
        .join('\n')
    return `<h2>${year}</h2>${linksForYear}`
}

/**
 * Generate a simple index.html page to list all talks, grouped by year.
 *
 * @param talks Array of directory names matching the talks to build.
 * @returns Promise resolving when the index.html file has been written to storage.
 */
async function buildIndexPage(talks: string[]) {
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
 * @param path The path of the directory to create if it doesn't exist.
 */
async function ensureDirExists(path: string) {
    try {
        await mkdir(path, { recursive: true })
    } catch (e) {
        console.error(e)
    }
}

/**
 * Build all talks and move them to the right place in the build output folder.
 *
 * @param talks Array of directory names matching the talks to build.
 * @returns Array of promises for each build happening concurrently.
 */
async function buildAllTalks(talks: string[]) {
    console.log(`Building ${talks.length} talks...`)
    return Promise.all(
        talks.map(async (talk) => {
            const base = `/talks/${talk}/`
            const out = resolve(distPath, talk)
            const { stderr, stdout } = await execAsync(
                `cd ${talk} && pnpm run build --base ${base} --out ${out}`,
            )

            if (stderr) {
                console.error(`❌ ${talk}\n\n${stderr}`)
            }
            if (stdout) {
                console.log(`✅ ${talk}`)
                await Promise.all([
                    removeUnwantedFiles(distPath, talk),
                    cleanupTalk(distPath, talk),
                ])
            }
        }),
    )
}

const faviconRegex = /<link rel="icon"(.*?)\/?>/gi

async function cleanupTalk(distPath: string, talk: string) {
    const file = await readFile(resolve(`${distPath}/${talk}/`), 'utf-8')

    return file
        // Ensure the favicon is inherited from the website
        .replaceAll(faviconRegex, '')
        // Ensure fonts are GDPR compliant
        .replaceAll('fonts.googleapis.com/css2', 'fonts.bunny.net/css')
}

const UNWANTED_FILES = ['_redirects', '404.html']

async function removeUnwantedFiles(distPath: string, talk: string) {
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
 * @param includeHelperFiles
 */
async function buildAll(includeHelperFiles = false) {
    const [talks] = await Promise.all([
        getAllTalks(cwd),
        deleteOldBuild(distPath),
    ])
    console.log(talks)

    await ensureDirExists(distPath)

    const buildTasks: Promise<any>[] = [buildAllTalks(talks)]
    if (includeHelperFiles) {
        buildTasks.push(buildIndexPage(talks), copyRedirectPage())
    }

    await Promise.all(buildTasks)
}

buildAll(false)
