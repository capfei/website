import '@testing-library/jest-dom'
import 'regenerator-runtime/runtime'

if (typeof window !== 'undefined') {
  const ShadowRootCtor = window.ShadowRoot || window.DocumentFragment || class ShadowRoot { }
  Object.defineProperty(globalThis, 'ShadowRoot', {
    value: ShadowRootCtor,
    writable: true,
    configurable: true
  })
  Object.defineProperty(window, 'ShadowRoot', {
    value: ShadowRootCtor,
    writable: true,
    configurable: true
  })
}

// Polyfill window prompts to always confirm.  Needed for react-copy-to-clipboard to work.
global.prompt = () => true

// Polyfill text selection functionality.  Needed for react-copy-to-clipboard to work.
// Can remove this once https://github.com/jsdom/jsdom/issues/317 is implemented.
if (typeof window !== 'undefined') {
  const getSelection = () => ({
    rangeCount: 0,
    addRange: () => { },
    getRangeAt: () => { },
    removeAllRanges: () => { }
  })

  window.getSelection = getSelection
  document.getSelection = getSelection
}
