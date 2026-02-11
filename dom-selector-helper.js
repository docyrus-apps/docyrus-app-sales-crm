// @ts-nocheck
;(() => {
  const MESSAGE_TYPE = 'DOCY_SELECTOR'
  let state = {
    enabled: false,
    parentOrigin: '*',
    overlay: null,
    originalCursor: '',
    onMove: null,
    onClick: null,
    onLeave: null,
  }

  // Forward console logs to parent window (once)
  try {
    if (!window.__docy_console_patched__) {
      Object.defineProperty(window, '__docy_console_patched__', {
        value: true,
        writable: false,
        configurable: false,
        enumerable: false,
      })
      ;['log', 'info', 'warn', 'error', 'debug'].forEach((level) => {
        const orig = console[level]
        if (typeof orig !== 'function') return
        console[level] = (...args) => {
          try {
            window.parent.postMessage(
              { kind: 'console', level, args, ts: Date.now() },
              '*',
            )
          } catch (_) {
            // ignore postMessage errors
          }
          return orig.apply(console, args)
        }
      })
    }
  } catch (_) {
    // ignore
  }

  function ensureOverlay() {
    if (state.overlay) return state.overlay
    const ov = document.createElement('div')
    ov.className = 'docy-element-selector-overlay'
    Object.assign(ov.style, {
      position: 'absolute',
      pointerEvents: 'none',
      border: '2px solid #3b82f6',
      backgroundColor: 'rgba(59,130,246,0.25)',
      zIndex: '2147483647',
      transition: 'all 0.1s ease',
      display: 'none',
      left: '0px',
      top: '0px',
      width: '0px',
      height: '0px',
    })
    document.body.appendChild(ov)
    return (state.overlay = ov)
  }

  function enableSelector(parentOrigin) {
    if (state.enabled) return
    state.enabled = true
    state.parentOrigin = parentOrigin || '*'

    const overlay = ensureOverlay()
    state.originalCursor = document.body.style.cursor || ''
    document.body.style.cursor = 'crosshair'

    state.onMove = (e) => {
      const target = e.target
      if (!(target instanceof Element)) return
      if (target === overlay) return

      const rect = target.getBoundingClientRect()
      overlay.style.display = 'block'
      // Position overlay in page coordinates
      overlay.style.left = rect.left + window.scrollX + 'px'
      overlay.style.top = rect.top + window.scrollY + 'px'
      overlay.style.width = rect.width + 'px'
      overlay.style.height = rect.height + 'px'
    }

    state.onClick = (e) => {
      e.preventDefault()
      e.stopPropagation()

      const target = e.target
      if (!(target instanceof Element)) return
      const rect = target.getBoundingClientRect()

      const hasTextContent =
        target.childNodes.length === 1 &&
        target.childNodes[0].nodeType === Node.TEXT_NODE

      const payload = {
        // Viewport-relative rect (parent will translate using iframe position)
        rect: {
          left: rect.left,
          top: rect.top,
          right: rect.right,
          bottom: rect.bottom,
          width: rect.width,
          height: rect.height,
        },
        componentName: target.getAttribute('data-component-name'),
        componentPath: target.getAttribute('data-component-path'),
        tagName: target.tagName.toLowerCase(),
        className: target.className || '',
        hasTextContent: !!hasTextContent,
        textContent: hasTextContent ? (target.textContent ?? '') : null,
        src:
          target.tagName.toLowerCase() === 'img'
            ? (target.getAttribute('src') ?? '')
            : null,
      }

      try {
        window.parent.postMessage(
          { type: MESSAGE_TYPE, action: 'elementSelected', payload },
          state.parentOrigin,
        )
      } catch (err) {
        // No-op
      }

      overlay.style.display = 'none'
    }

    state.onLeave = () => {
      if (state.overlay) state.overlay.style.display = 'none'
    }

    document.addEventListener('pointermove', state.onMove, { passive: true })
    document.addEventListener('click', state.onClick, true)
    document.addEventListener('mouseleave', state.onLeave)
  }

  function disableSelector() {
    if (!state.enabled) return
    state.enabled = false

    document.removeEventListener('pointermove', state.onMove, { passive: true })
    document.removeEventListener('click', state.onClick, true)
    document.removeEventListener('mouseleave', state.onLeave)

    state.onMove = state.onClick = state.onLeave = null

    if (state.overlay) {
      state.overlay.remove()
      state.overlay = null
    }
    document.body.style.cursor = state.originalCursor || ''
  }

  function onMessage(event) {
    const data = event.data
    if (!data || data.type !== MESSAGE_TYPE) return

    if (data.action === 'enable') {
      // Store initiator origin for secure replies
      enableSelector(event.origin)
    } else if (data.action === 'disable') {
      disableSelector()
    }
  }

  window.addEventListener('message', onMessage)
})()
