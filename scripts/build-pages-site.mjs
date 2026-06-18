import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const siteDir = path.join(root, 'site')
const docsSrc = path.join(root, 'docs')

function patchFileInPlace(filePath, replacements) {
  if (!fs.existsSync(filePath)) return

  let html = fs.readFileSync(filePath, 'utf8')
  for (const [from, to] of replacements) {
    html = html.replaceAll(from, to)
  }
  fs.writeFileSync(filePath, html)
}

function patchSlidesForPages(slidesDir) {
  patchFileInPlace(path.join(slidesDir, 'index.html'), [
    ['../../node_modules/', '../node_modules/'],
    ['data-base="../../"', 'data-base="../"'],
  ])
  console.log('Patched slides/index.html paths for GitHub Pages')
}

function patchGuideForPages(filePath) {
  patchFileInPlace(filePath, [
    ['../node_modules/', 'node_modules/'],
    ['data-base="../"', 'data-base="./"'],
  ])
}

function patchHubForPages(filePath) {
  patchFileInPlace(filePath, [['data-base="../"', 'data-base="./"']])
}

function copyPagesVendorAssets() {
  const nodeModules = path.join(root, 'node_modules')
  const revealSrc = path.join(nodeModules, 'reveal.js')
  const hljsSrc = path.join(nodeModules, 'highlight.js')
  const siteModules = path.join(siteDir, 'node_modules')

  if (!fs.existsSync(revealSrc)) {
    throw new Error('Missing reveal.js — run npm ci before pages:build')
  }
  if (!fs.existsSync(hljsSrc)) {
    throw new Error('Missing highlight.js — run npm ci before pages:build')
  }

  fs.cpSync(path.join(revealSrc, 'dist'), path.join(siteModules, 'reveal.js', 'dist'), { recursive: true })
  fs.mkdirSync(path.join(siteModules, 'reveal.js', 'plugin', 'highlight'), { recursive: true })
  fs.copyFileSync(
    path.join(revealSrc, 'plugin', 'highlight', 'highlight.js'),
    path.join(siteModules, 'reveal.js', 'plugin', 'highlight', 'highlight.js'),
  )

  const hlStyles = path.join(siteModules, 'highlight.js', 'styles')
  fs.mkdirSync(hlStyles, { recursive: true })
  for (const style of ['github.css', 'github-dark.css']) {
    fs.copyFileSync(path.join(hljsSrc, 'styles', style), path.join(hlStyles, style))
  }

  console.log('Copied reveal.js + highlight.js assets to site/node_modules/')
}

fs.rmSync(siteDir, { recursive: true, force: true })
fs.mkdirSync(siteDir, { recursive: true })

fs.cpSync(docsSrc, siteDir, { recursive: true })
patchSlidesForPages(path.join(siteDir, 'slides'))

for (const guide of ['guia-completo.html', 'complete-guide.html']) {
  const dest = path.join(siteDir, guide)
  if (fs.existsSync(dest)) {
    patchGuideForPages(dest)
  }
}

patchHubForPages(path.join(siteDir, 'index.html'))
copyPagesVendorAssets()

fs.writeFileSync(path.join(siteDir, '.nojekyll'), '')
console.log(`GitHub Pages site ready at ${path.relative(root, siteDir)}/`)
