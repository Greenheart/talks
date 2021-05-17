import fs from 'fs/promises'

const ignoredFolders = ['node_modules', 'dist']

// delete the previous root dist folder for all talks and previous builds
// read all directories except a few special ones, like node_modules and dist

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

// generate landing page
    // write result to dist/index.html