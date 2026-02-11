import * as nodePath from 'node:path'

interface ComponentInfo {
  name: string
  path: string
  line: number
  column: number
}

interface BabelTypes {
  isJSXAttribute: (node: any) => boolean
  jsxAttribute: (name: any, value: any) => any
  jsxIdentifier: (name: string) => any
  stringLiteral: (value: string) => any
  isIdentifier: (node: any) => boolean
  isArrowFunctionExpression: (node: any) => boolean
  isFunctionExpression: (node: any) => boolean
}

interface PluginObj {
  visitor: {
    [key: string]: any
  }
}

interface BabelPath {
  node: any
}

interface BabelState {
  file: {
    opts: {
      filename?: string
      cwd?: string
    }
  }
  relativeFilePath?: string
}

export default function componentAnnotatePlugin({
  types: t,
}: {
  types: BabelTypes
}): PluginObj {
  // Stack to track component hierarchy
  const componentStack: Array<ComponentInfo> = []

  // Helper to create data attributes
  function createDataAttributes(
    componentName: string,
    filePath: string,
    line: number,
    column: number,
  ) {
    const attributes = []

    // Add data-component-name
    attributes.push(
      t.jsxAttribute(
        t.jsxIdentifier('data-component-name'),
        t.stringLiteral(componentName),
      ),
    )

    // Add data-component-path with line and column
    const componentPath = `${filePath}:${line}:${column}`
    attributes.push(
      t.jsxAttribute(
        t.jsxIdentifier('data-component-path'),
        t.stringLiteral(componentPath),
      ),
    )

    return attributes
  }

  // Helper to check if JSX element already has our attributes
  function hasComponentAttributes(openingElement: any): boolean {
    return openingElement.attributes.some(
      (attr: any) =>
        t.isJSXAttribute(attr) &&
        (attr.name.name === 'data-component-name' ||
          attr.name.name === 'data-component-path'),
    )
  }

  return {
    visitor: {
      Program(_path: BabelPath, state: BabelState) {
        // Reset component stack for each file
        componentStack.length = 0

        // Get relative file path
        const filename = state.file.opts.filename || ''
        const cwd = state.file.opts.cwd || process.cwd()
        state.relativeFilePath = nodePath.relative(cwd, filename)
      },

      // Track React component declarations
      FunctionDeclaration: {
        enter(path: BabelPath, state: BabelState) {
          if (path.node.id && /^[A-Z]/.test(path.node.id.name)) {
            const loc = path.node.loc
            componentStack.push({
              name: path.node.id.name,
              path: state.relativeFilePath || '',
              line: loc?.start.line || 0,
              column: loc?.start.column || 0,
            })
          }
        },
        exit(path: BabelPath) {
          if (path.node.id && /^[A-Z]/.test(path.node.id.name)) {
            componentStack.pop()
          }
        },
      },

      // Track arrow function components
      VariableDeclarator: {
        enter(path: BabelPath, state: BabelState) {
          if (
            t.isIdentifier(path.node.id) &&
            /^[A-Z]/.test(path.node.id.name) &&
            (t.isArrowFunctionExpression(path.node.init) ||
              t.isFunctionExpression(path.node.init))
          ) {
            const loc = path.node.loc
            componentStack.push({
              name: path.node.id.name,
              path: state.relativeFilePath || '',
              line: loc?.start.line || 0,
              column: loc?.start.column || 0,
            })
          }
        },
        exit(path: BabelPath) {
          if (
            t.isIdentifier(path.node.id) &&
            /^[A-Z]/.test(path.node.id.name) &&
            (t.isArrowFunctionExpression(path.node.init) ||
              t.isFunctionExpression(path.node.init))
          ) {
            componentStack.pop()
          }
        },
      },

      // Annotate JSX elements
      JSXOpeningElement(path: BabelPath, state: BabelState) {
        const openingElement = path.node
        const elementName = openingElement.name.name

        // Skip if attributes already added or if it's a Fragment
        if (hasComponentAttributes(openingElement) || !elementName) {
          return
        }

        const loc = openingElement.loc

        // For ALL elements (both DOM and components), add attributes
        // DOM elements like div, a, img will use their own name
        // React components will also use their own name
        const attributes = createDataAttributes(
          elementName, // Use the actual element/component name (div, a, img, Button, etc.)
          state.relativeFilePath || '',
          loc?.start.line || 0,
          loc?.start.column || 0,
        )

        openingElement.attributes.push(...attributes)
      },
    },
  }
}
