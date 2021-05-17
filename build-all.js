import { existsSync, statSync } from 'fs'
import { readdir, rm, readFile, writeFile, mkdir } from 'fs/promises'
import { resolve } from 'path'

const ignoredFolders = ['node_modules', 'dist', '.git']
const cwd = process.cwd()
const distPath = resolve(cwd, 'dist')

async function getAllTalks(path) {
    const filesAndFolders = await readdir(path)
    return filesAndFolders.filter(
        (file) =>
            !ignoredFolders.includes(file) &&
            statSync(path + '/' + file).isDirectory()
    )
}

async function deleteOldBuild(path) {
    if (existsSync(path)) {
        await rm(path, { recursive: true })
    }
}

function getTalksByYear(talks) {
    return talks.reduce((years, talk) => {
        const year = talk.slice(0, 4)
        years[year] = years[year] ? years[year].concat(talk) : [talk]
        return years
    }, {})
}

function getLinksForYear([year, talks]) {
    const linksForYear = talks.map(talk => `\n    <a href="/${talk}/">${talk}</a>`)
    return `<h2>${year}</h2>${linksForYear}`
}

async function buildIndexPage(talks) {
    const inputHTML = await readFile(resolve(cwd, 'index.html'), { encoding: 'utf-8' })

    const links = Object.entries(getTalksByYear(talks)).map(getLinksForYear)
    const outputHTML = inputHTML.replace('<!--LINKS-->', links)

    await writeFile(resolve(distPath, 'index.html'), outputHTML, { encoding: 'utf-8' })
}

async function buildAll() {
    await deleteOldBuild(distPath)
    const talks = await getAllTalks(cwd)
    console.log(talks)

    if (!existsSync(distPath)) {
        await mkdir(`dist`, { recursive: true })
    }

    await buildIndexPage(talks)
}

buildAll()

// For folder in talks
// execute each in parallell
// build talk with local build script
// wait for it to finish
// create folder with same name as the talk in the root dist folder.
// copy contents of talk dist folder into root dist folder

// when all subprocesses have finished, Promise.all()
// print status and how many talks were built

// Open index.html
// replace `<!--LINKS-->` with the generated links, separated by year and ordered with newest talks at the top.

// for each year, add <h2>{year}</h2>
// for each year, add all links with <a href="/talks/"

// generate landing page
// write result to dist/index.html
