import { spawn } from 'node:child_process'
import { setTimeout as sleep } from 'node:timers/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import fs from 'node:fs'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const port = process.env.SLIDES_PORT || '3337'
const slidesUrl = `http://127.0.0.1:${port}/docs/slides/`
const outputPath = path.join(root, 'docs/slides/k6-intro-slides.pdf')

function run(command, args, options = {}) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, {
      cwd: root,
      stdio: options.inherit ? 'inherit' : 'pipe',
      ...options,
    })

    let stderr = ''

    if (!options.inherit) {
      child.stderr?.on('data', (chunk) => {
        stderr += chunk
      })
    }

    child.on('error', reject)
    child.on('close', (code) => {
      if (code === 0) {
        resolve()
        return
      }
      reject(new Error(`${command} ${args.join(' ')} exited with code ${code}\n${stderr}`))
    })
  })
}

async function waitForServer(url, attempts = 30) {
  for (let i = 0; i < attempts; i += 1) {
    try {
      const response = await fetch(url)
      if (response.ok) {
        return
      }
    } catch {
      // server not ready yet
    }
    await sleep(500)
  }
  throw new Error(`Slides server did not start at ${url}`)
}

async function main() {
  console.log('Starting local server for slides export...')
  const serve = spawn('npx', ['serve', '.', '-l', port, '--no-clipboard'], {
    cwd: root,
    stdio: 'pipe',
  })

  const cleanup = () => {
    if (!serve.killed) {
      serve.kill('SIGTERM')
    }
  }

  process.on('SIGINT', () => {
    cleanup()
    process.exit(130)
  })
  process.on('SIGTERM', cleanup)

  try {
    await waitForServer(slidesUrl)
    console.log(`Exporting slides to ${path.relative(root, outputPath)}...`)

    await run(
      'npx',
      [
        'decktape',
        '--chrome-arg=--disable-web-security',
        'reveal',
        slidesUrl,
        outputPath,
        '-s',
        '1280x720',
        '--pause',
        '800',
      ],
      { inherit: true },
    )

    const stats = fs.statSync(outputPath)
    console.log(`PDF created (${Math.round(stats.size / 1024)} KB): ${outputPath}`)
  } finally {
    cleanup()
  }
}

main().catch((error) => {
  console.error(error.message)
  process.exit(1)
})
