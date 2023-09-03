let execSync, fs

const { execSync: rawExec } = require('node:child_process')
const rawFS = require("node:fs")
execSync = rawExec
fs = rawFS

console.log("Building Discord Player Deezer ...")

console.log("Running \"tsc\"")

execSync("tsc")