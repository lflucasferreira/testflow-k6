(function () {
  const STORAGE_KEY = 'k6-docs-theme'

  function getPreferredTheme() {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (stored === 'light' || stored === 'dark') return stored
    return window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark'
  }

  function resolveBasePath(scriptEl) {
    const base = scriptEl?.getAttribute('data-base') || '.'
    return base.replace(/\/?$/, '/')
  }

  function swapStylesheet(id, href) {
    const link = document.getElementById(id)
    if (link && href) link.href = href
  }

  function applyTheme(theme, basePath) {
    document.documentElement.setAttribute('data-theme', theme)

    if (basePath) {
      const isRevealSlides = !!document.querySelector('.reveal')
      const hlFile = isRevealSlides && theme === 'light' ? 'github.css' : 'github-dark.css'
      const revealFile = theme === 'light' ? 'white.css' : 'black.css'
      swapStylesheet('hljs-theme', `${basePath}node_modules/highlight.js/styles/${hlFile}`)
      if (isRevealSlides) {
        swapStylesheet('reveal-theme', `${basePath}node_modules/reveal.js/dist/theme/${revealFile}`)
      }
    }

    document.querySelectorAll('.theme-toggle').forEach((btn) => {
      btn.setAttribute('aria-label', theme === 'light' ? 'Switch to dark theme' : 'Switch to light theme')
      btn.setAttribute('title', theme === 'light' ? 'Dark theme' : 'Light theme')
    })
  }

  function initToggleButtons(onToggle) {
    document.querySelectorAll('.theme-toggle').forEach((btn) => {
      if (btn.dataset.themeBound) return
      btn.dataset.themeBound = 'true'
      btn.addEventListener('click', onToggle)
    })
  }

  const earlyScript = document.currentScript
  const basePath = resolveBasePath(earlyScript)

  window.__pwApplyTheme = function (theme) {
    applyTheme(theme, basePath)
  }

  applyTheme(getPreferredTheme(), basePath)

  function bindToggles() {
    initToggleButtons(() => {
      const next = document.documentElement.getAttribute('data-theme') === 'light' ? 'dark' : 'light'
      localStorage.setItem(STORAGE_KEY, next)
      applyTheme(next, basePath)
      if (window.hljs) window.hljs.highlightAll()
    })
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', bindToggles)
  } else {
    bindToggles()
  }
})()
