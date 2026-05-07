;(() => {
  const MESSAGE_TYPE = 'DOCY_SELECTOR'
  const state = {
    enabled: false,
    parentOrigin: '*',
    overlay: null,
    originalCursor: '',
    onMove: null,
    onClick: null,
    onLeave: null,
  }
  const acceptedAttrNames = new Set([
    'role',
    'name',
    'aria-label',
    'rel',
    'href',
  ])

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
              {
                kind: 'console',
                level,
                args,
                ts: Date.now(),
              },
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

  function wordLike(name) {
    if (!/^[a-z\-]{3,}$/i.test(name)) {
      return false
    }

    const words = name.split(/-|[A-Z]/)

    for (const word of words) {
      if (word.length <= 2) {
        return false
      }
      if (/[^aeiou]{4,}/i.test(word)) {
        return false
      }
    }

    return true
  }

  function isAcceptedAttr(name, value) {
    let nameIsOk = acceptedAttrNames.has(name)

    nameIsOk ||= name.startsWith('data-') && wordLike(name)

    let valueIsOk = wordLike(value) && value.length < 100

    valueIsOk ||= value.startsWith('#') && wordLike(value.slice(1))

    return nameIsOk && valueIsOk
  }

  function isAcceptedIdName(name) {
    return wordLike(name)
  }

  function isAcceptedClassName(name) {
    return wordLike(name)
  }

  function isAcceptedTagName() {
    return true
  }

  function getCssEscape() {
    if (typeof CSS !== 'undefined' && typeof CSS.escape === 'function') {
      return CSS.escape.bind(CSS)
    }

    return (value) => String(value).replace(/[^a-zA-Z0-9_-]/g, '\\$&')
  }

  function createFinderConfig(options) {
    return {
      root: document.body,
      idName: isAcceptedIdName,
      className: isAcceptedClassName,
      tagName: isAcceptedTagName,
      attr: isAcceptedAttr,
      timeoutMs: 1000,
      seedMinLength: 3,
      optimizedMinLength: 2,
      maxNumberOfPathChecks: Number.POSITIVE_INFINITY,
      ...options,
    }
  }

  function createKnotSelector(path) {
    let node = path[0]
    let query = node.name

    for (let i = 1; i < path.length; i++) {
      const level = path[i].level || 0

      if (node.level === level - 1) {
        query = `${path[i].name} > ${query}`
      } else {
        query = `${path[i].name} ${query}`
      }
      node = path[i]
    }

    return query
  }

  function getPathPenalty(path) {
    return path
      .map((node) => node.penalty)
      .reduce((acc, value) => acc + value, 0)
  }

  function compareByPenalty(a, b) {
    return getPathPenalty(a) - getPathPenalty(b)
  }

  function indexOfElement(input, tagName) {
    const parent = input.parentNode

    if (!parent) {
      return undefined
    }

    let child = parent.firstChild

    if (!child) {
      return undefined
    }

    let index = 0

    while (child) {
      if (
        child.nodeType === Node.ELEMENT_NODE &&
        (tagName === undefined || child.tagName.toLowerCase() === tagName)
      ) {
        index++
      }
      if (child === input) {
        break
      }
      child = child.nextSibling
    }

    return index
  }

  function nthChild(tagName, index) {
    if (tagName === 'html') {
      return 'html'
    }

    return `${tagName}:nth-child(${index})`
  }

  function nthOfType(tagName, index) {
    if (tagName === 'html') {
      return 'html'
    }

    return `${tagName}:nth-of-type(${index})`
  }

  function tie(element, config) {
    const level = []
    const escapeCss = getCssEscape()
    const elementId = element.getAttribute('id')

    if (elementId && config.idName(elementId)) {
      level.push({
        name: `#${escapeCss(elementId)}`,
        penalty: 0,
      })
    }

    for (let i = 0; i < element.classList.length; i++) {
      const name = element.classList[i]

      if (config.className(name)) {
        level.push({
          name: `.${escapeCss(name)}`,
          penalty: 1,
        })
      }
    }

    for (let i = 0; i < element.attributes.length; i++) {
      const attribute = element.attributes[i]

      if (config.attr(attribute.name, attribute.value)) {
        level.push({
          name: `[${escapeCss(attribute.name)}="${escapeCss(attribute.value)}"]`,
          penalty: 2,
        })
      }
    }

    const tagName = element.tagName.toLowerCase()

    if (config.tagName(tagName)) {
      level.push({
        name: tagName,
        penalty: 5,
      })

      const index = indexOfElement(element, tagName)

      if (index !== undefined) {
        level.push({
          name: nthOfType(tagName, index),
          penalty: 10,
        })
      }
    }

    const nth = indexOfElement(element)

    if (nth !== undefined) {
      level.push({
        name: nthChild(tagName, nth),
        penalty: 50,
      })
    }

    return level
  }

  function* combinations(stack, path = []) {
    if (stack.length === 0) {
      yield path

      return
    }

    for (const node of stack[0]) {
      yield* combinations(stack.slice(1), path.concat(node))
    }
  }

  function* search(input, config, rootDocument) {
    const stack = []
    let paths = []
    let current = input
    let levelIndex = 0

    while (current && current !== rootDocument) {
      const level = tie(current, config)

      for (const node of level) {
        node.level = levelIndex
      }
      stack.push(level)
      current = current.parentElement
      levelIndex++

      paths.push(...combinations(stack))

      if (levelIndex >= config.seedMinLength) {
        paths.sort(compareByPenalty)
        for (const candidate of paths) {
          yield candidate
        }
        paths = []
      }
    }

    paths.sort(compareByPenalty)
    for (const candidate of paths) {
      yield candidate
    }
  }

  function findRootDocument(rootNode, defaults, input) {
    const root = input.getRootNode ? input.getRootNode() : null

    if (root && root.constructor && root.constructor.name === 'ShadowRoot') {
      return root
    }
    if (rootNode.nodeType === Node.DOCUMENT_NODE) {
      return rootNode
    }
    if (rootNode === defaults.root) {
      return rootNode.ownerDocument
    }

    return rootNode
  }

  function isUniquePath(path, rootDocument) {
    const css = createKnotSelector(path)
    const count = rootDocument.querySelectorAll(css).length

    if (count === 0) {
      throw new Error(`Can't select any node with this selector: ${css}`)
    }

    return count === 1
  }

  function fallbackPath(input, rootDocument) {
    let current = input
    let levelIndex = 0
    const path = []

    while (current && current !== rootDocument) {
      const tagName = current.tagName.toLowerCase()
      const index = indexOfElement(current, tagName)

      if (index === undefined) {
        return undefined
      }

      path.push({
        name: nthOfType(tagName, index),
        penalty: Number.NaN,
        level: levelIndex,
      })
      current = current.parentElement
      levelIndex++
    }

    if (isUniquePath(path, rootDocument)) {
      return path
    }

    return undefined
  }

  function* optimize(path, input, config, rootDocument, startTime) {
    if (path.length <= 2 || path.length <= config.optimizedMinLength) {
      return
    }

    for (let i = 1; i < path.length - 1; i++) {
      if (Date.now() - startTime > config.timeoutMs) {
        return
      }

      const nextPath = [...path]

      nextPath.splice(i, 1)

      if (
        isUniquePath(nextPath, rootDocument) &&
        rootDocument.querySelector(createKnotSelector(nextPath)) === input
      ) {
        yield nextPath
        yield* optimize(nextPath, input, config, rootDocument, startTime)
      }
    }
  }

  function finder(input, options = {}) {
    if (input.nodeType !== Node.ELEMENT_NODE) {
      throw new Error(`Can't generate CSS selector for non-element node type.`)
    }
    if (input.tagName.toLowerCase() === 'html') {
      return 'html'
    }

    const defaults = createFinderConfig()
    const config = { ...defaults, ...options }
    const startTime = Date.now()
    const rootDocument = findRootDocument(config.root, defaults, input)
    let foundPath
    let count = 0

    for (const candidate of search(input, config, rootDocument)) {
      if (
        Date.now() - startTime > config.timeoutMs ||
        count >= config.maxNumberOfPathChecks
      ) {
        const fallback = fallbackPath(input, rootDocument)

        if (!fallback) {
          throw new Error(
            `Timeout: Can't find a unique selector after ${config.timeoutMs}ms`,
          )
        }

        return createKnotSelector(fallback)
      }

      count++
      if (isUniquePath(candidate, rootDocument)) {
        foundPath = candidate
        break
      }
    }

    if (!foundPath) {
      throw new Error('Selector was not found.')
    }

    const optimized = [
      ...optimize(foundPath, input, config, rootDocument, startTime),
    ]

    optimized.sort(compareByPenalty)

    if (optimized.length > 0) {
      return createKnotSelector(optimized[0])
    }

    return createKnotSelector(foundPath)
  }

  function getElementFilePath(el) {
    return (
      el.getAttribute('data-current-file-path') ||
      el.getAttribute('data-component-path')
    )
  }

  function getElementSelector(el) {
    try {
      return finder(el)
    } catch {
      return null
    }
  }

  function enableSelector(parentOrigin) {
    if (state.enabled) return
    state.enabled = true
    state.parentOrigin = parentOrigin || '*'

    const overlay = ensureOverlay()

    state.originalCursor = document.body.style.cursor || ''
    document.body.style.cursor = 'crosshair'

    state.onMove = (e) => {
      const { target } = e

      if (!(target instanceof Element)) return
      if (target === overlay) return

      const rect = target.getBoundingClientRect()

      overlay.style.display = 'block'
      // Position overlay in page coordinates
      overlay.style.left = `${rect.left + window.scrollX}px`
      overlay.style.top = `${rect.top + window.scrollY}px`
      overlay.style.width = `${rect.width}px`
      overlay.style.height = `${rect.height}px`
    }

    state.onClick = (e) => {
      e.preventDefault()
      e.stopPropagation()

      const { target } = e

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
        filePath: getElementFilePath(target),
        componentPath: target.getAttribute('data-component-path'),
        selector: getElementSelector(target),
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
      } catch {
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
    const { data } = event

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
