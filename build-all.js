import { existsSync, statSync } from 'fs'
import { readdir, rm } from 'fs/promises'
import { resolve } from 'path'

const ignoredFolders = ['node_modules', 'dist', '.git']
const cwd = process.cwd()

async function getAllTalks(path) {
    const filesAndFolders = await readdir(path)
    return filesAndFolders
        .filter(file => !ignoredFolders.includes(file) && statSync(path + '/' + file).isDirectory())
}


// delete the previous root dist folder for all talks and previous builds
const distPath = resolve(cwd, 'dist')

async function deleteOldBuild(path) {
    if (existsSync(path)) {
        await rm(path, { recursive: true })
    }
}

async function buildAll() {
    await deleteOldBuild(distPath)
    const talks = await getAllTalks(cwd)
    console.log(talks)
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

// publish to gh-pages in npm script in the package.json to keep it separated from the build-all step.

// Open index.html
// replace `<!--LINKS-->` with the generated links, separated by year and ordered with newest talks at the top.

// for each year, add <h2>{year}</h2>
// for each year, add all links with <a href="/talks/"

// generate landing page
    // write result to dist/index.html