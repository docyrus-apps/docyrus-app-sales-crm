import * as nodePath from 'node:path'

const COMPONENT_NAME_ATTR = 'data-component-name'
const COMPONENT_PATH_ATTR = 'data-component-path'
const CURRENT_FILE_PATH_ATTR = 'data-current-file-path'

const COMPONENT_NAME_LOCAL = '__docyrusComponentAnnotateName'
const CURRENT_FILE_PATH_LOCAL = '__docyrusComponentAnnotateCurrentFilePath'

interface ComponentInfo {
  name: string
  hasRuntimeBindings: boolean
}

interface BabelTypes {
  isAssignmentPattern: (node: any) => boolean
  isArrowFunctionExpression: (node: any) => boolean
  isFunctionExpression: (node: any) => boolean
  isIdentifier: (node: any) => boolean
  isJSXAttribute: (node: any) => boolean
  isJSXIdentifier: (node: any) => boolean
  isJSXMemberExpression: (node: any) => boolean
  isJSXNamespacedName: (node: any) => boolean
  isObjectPattern: (node: any) => boolean
  isRestElement: (node: any) => boolean
  blockStatement: (body: Array<any>) => any
  cloneNode: (node: any) => any
  identifier: (name: string) => any
  jsxAttribute: (name: any, value: any) => any
  jsxExpressionContainer: (expression: any) => any
  jsxIdentifier: (name: string) => any
  logicalExpression: (operator: '||', left: any, right: any) => any
  objectPattern: (properties: Array<any>) => any
  objectProperty: (
    key: any,
    value: any,
    computed?: boolean,
    shorthand?: boolean,
  ) => any
  returnStatement: (argument: any) => any
  stringLiteral: (value: string) => any
  variableDeclaration: (kind: 'const', declarations: Array<any>) => any
  variableDeclarator: (id: any, init: any) => any
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
      cwd?: string
      filename?: string
    }
  }
  relativeFilePath?: string
}

export default function componentAnnotatePlugin({
  types: t,
}: {
  types: BabelTypes
}): PluginObj {
  const componentStack: Array<ComponentInfo> = []

  function getRelativeLocation(
    filePath: string,
    line: number,
    column: number,
  ): string {
    return `${filePath}:${line}:${column}`
  }

  function getPatternPropertyKeyName(property: any): string | null {
    if (!property || property.type !== 'ObjectProperty') return null
    if (!property.computed && property.key?.type === 'Identifier') {
      return property.key.name
    }
    if (property.key?.type === 'StringLiteral') {
      return property.key.value
    }

    return null
  }

  function hasAttribute(openingElement: any, attributeName: string): boolean {
    return openingElement.attributes.some(
      (attribute: any) =>
        t.isJSXAttribute(attribute) &&
        t.isJSXIdentifier(attribute.name) &&
        attribute.name.name === attributeName,
    )
  }

  function createStringAttribute(name: string, value: string) {
    return t.jsxAttribute(t.jsxIdentifier(name), t.stringLiteral(value))
  }

  function createExpressionAttribute(name: string, expression: any) {
    return t.jsxAttribute(
      t.jsxIdentifier(name),
      t.jsxExpressionContainer(expression),
    )
  }

  function createBindingProperty(attributeName: string, localName: string) {
    return t.objectProperty(
      t.stringLiteral(attributeName),
      t.identifier(localName),
      false,
      false,
    )
  }

  function insertBindingIntoPattern(
    pattern: any,
    attributeName: string,
    localName: string,
  ) {
    const alreadyBound = pattern.properties.some(
      (property: any) => getPatternPropertyKeyName(property) === attributeName,
    )

    if (alreadyBound) return

    const restIndex = pattern.properties.findIndex((property: any) =>
      t.isRestElement(property),
    )

    const insertIndex = restIndex === -1 ? pattern.properties.length : restIndex

    pattern.properties.splice(
      insertIndex,
      0,
      createBindingProperty(attributeName, localName),
    )
  }

  function ensureBlockBody(functionNode: any) {
    if (functionNode.body.type === 'BlockStatement') return

    functionNode.body = t.blockStatement([t.returnStatement(functionNode.body)])
  }

  function createBindingDeclaration(propsIdentifier: any) {
    return t.variableDeclaration('const', [
      t.variableDeclarator(
        t.objectPattern([
          createBindingProperty(COMPONENT_NAME_ATTR, COMPONENT_NAME_LOCAL),
          createBindingProperty(
            CURRENT_FILE_PATH_ATTR,
            CURRENT_FILE_PATH_LOCAL,
          ),
        ]),
        t.cloneNode(propsIdentifier),
      ),
    ])
  }

  function ensureRuntimeBindings(functionNode: any): boolean {
    const firstParam = functionNode.params[0]

    if (!firstParam) {
      functionNode.params[0] = t.objectPattern([
        createBindingProperty(COMPONENT_NAME_ATTR, COMPONENT_NAME_LOCAL),
        createBindingProperty(CURRENT_FILE_PATH_ATTR, CURRENT_FILE_PATH_LOCAL),
      ])

      return true
    }

    if (t.isObjectPattern(firstParam)) {
      insertBindingIntoPattern(
        firstParam,
        COMPONENT_NAME_ATTR,
        COMPONENT_NAME_LOCAL,
      )
      insertBindingIntoPattern(
        firstParam,
        CURRENT_FILE_PATH_ATTR,
        CURRENT_FILE_PATH_LOCAL,
      )

      return true
    }

    if (
      t.isAssignmentPattern(firstParam) &&
      t.isObjectPattern(firstParam.left)
    ) {
      insertBindingIntoPattern(
        firstParam.left,
        COMPONENT_NAME_ATTR,
        COMPONENT_NAME_LOCAL,
      )
      insertBindingIntoPattern(
        firstParam.left,
        CURRENT_FILE_PATH_ATTR,
        CURRENT_FILE_PATH_LOCAL,
      )

      return true
    }

    const propsIdentifier = t.isIdentifier(firstParam)
      ? firstParam
      : t.isAssignmentPattern(firstParam) && t.isIdentifier(firstParam.left)
        ? firstParam.left
        : null

    if (!propsIdentifier) return false

    ensureBlockBody(functionNode)
    functionNode.body.body.unshift(createBindingDeclaration(propsIdentifier))

    return true
  }

  function getElementName(node: any): string | null {
    if (t.isJSXIdentifier(node)) return node.name

    if (t.isJSXMemberExpression(node)) {
      const objectName = getElementName(node.object)
      const propertyName = getElementName(node.property)

      if (!objectName || !propertyName) return null

      return `${objectName}.${propertyName}`
    }

    if (t.isJSXNamespacedName(node)) {
      const namespaceName = getElementName(node.namespace)
      const localName = getElementName(node.name)

      if (!namespaceName || !localName) return null

      return `${namespaceName}:${localName}`
    }

    return null
  }

  function isIntrinsicElement(node: any): boolean {
    return t.isJSXIdentifier(node) && /^[a-z]/.test(node.name)
  }

  function isFragmentElement(node: any): boolean {
    if (t.isJSXIdentifier(node)) return node.name === 'Fragment'

    if (t.isJSXMemberExpression(node)) {
      return (
        t.isJSXIdentifier(node.property) && node.property.name === 'Fragment'
      )
    }

    return false
  }

  function getCurrentComponent(): ComponentInfo | undefined {
    return componentStack[componentStack.length - 1]
  }

  function createRuntimeBackedValue(
    localName: string,
    fallbackValue: string,
    hasRuntimeBindings: boolean,
  ) {
    if (!hasRuntimeBindings) {
      return t.stringLiteral(fallbackValue)
    }

    return t.logicalExpression(
      '||',
      t.identifier(localName),
      t.stringLiteral(fallbackValue),
    )
  }

  function annotateIntrinsicElement(
    openingElement: any,
    elementName: string,
    state: BabelState,
  ) {
    const currentComponent = getCurrentComponent()
    const { loc } = openingElement
    const componentPath = getRelativeLocation(
      state.relativeFilePath || '',
      loc?.start.line || 0,
      loc?.start.column || 0,
    )

    if (!hasAttribute(openingElement, COMPONENT_NAME_ATTR)) {
      const fallbackName = currentComponent?.name || elementName

      openingElement.attributes.push(
        createExpressionAttribute(
          COMPONENT_NAME_ATTR,
          createRuntimeBackedValue(
            COMPONENT_NAME_LOCAL,
            fallbackName,
            Boolean(currentComponent?.hasRuntimeBindings),
          ),
        ),
      )
    }

    if (!hasAttribute(openingElement, COMPONENT_PATH_ATTR)) {
      openingElement.attributes.push(
        createStringAttribute(COMPONENT_PATH_ATTR, componentPath),
      )
    }

    if (!hasAttribute(openingElement, CURRENT_FILE_PATH_ATTR)) {
      openingElement.attributes.push(
        createExpressionAttribute(
          CURRENT_FILE_PATH_ATTR,
          createRuntimeBackedValue(
            CURRENT_FILE_PATH_LOCAL,
            componentPath,
            Boolean(currentComponent?.hasRuntimeBindings),
          ),
        ),
      )
    }
  }

  function annotateComponentUsage(
    openingElement: any,
    elementName: string,
    state: BabelState,
  ) {
    const { loc } = openingElement
    const currentFilePath = getRelativeLocation(
      state.relativeFilePath || '',
      loc?.start.line || 0,
      loc?.start.column || 0,
    )

    if (!hasAttribute(openingElement, COMPONENT_NAME_ATTR)) {
      openingElement.attributes.push(
        createStringAttribute(COMPONENT_NAME_ATTR, elementName),
      )
    }

    if (!hasAttribute(openingElement, CURRENT_FILE_PATH_ATTR)) {
      openingElement.attributes.push(
        createStringAttribute(CURRENT_FILE_PATH_ATTR, currentFilePath),
      )
    }
  }

  function enterComponent(componentName: string, functionNode: any) {
    componentStack.push({
      name: componentName,
      hasRuntimeBindings: ensureRuntimeBindings(functionNode),
    })
  }

  return {
    visitor: {
      Program(_path: BabelPath, state: BabelState) {
        componentStack.length = 0

        const filename = state.file.opts.filename || ''
        const cwd = state.file.opts.cwd || process.cwd()

        state.relativeFilePath = nodePath.relative(cwd, filename)
      },

      FunctionDeclaration: {
        enter(path: BabelPath) {
          if (path.node.id && /^[A-Z]/.test(path.node.id.name)) {
            enterComponent(path.node.id.name, path.node)
          }
        },
        exit(path: BabelPath) {
          if (path.node.id && /^[A-Z]/.test(path.node.id.name)) {
            componentStack.pop()
          }
        },
      },

      VariableDeclarator: {
        enter(path: BabelPath) {
          if (
            t.isIdentifier(path.node.id) &&
            /^[A-Z]/.test(path.node.id.name) &&
            (t.isArrowFunctionExpression(path.node.init) ||
              t.isFunctionExpression(path.node.init))
          ) {
            enterComponent(path.node.id.name, path.node.init)
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

      JSXOpeningElement(path: BabelPath, state: BabelState) {
        const openingElement = path.node
        const elementName = getElementName(openingElement.name)

        if (!elementName) return

        if (isFragmentElement(openingElement.name)) return

        if (isIntrinsicElement(openingElement.name)) {
          annotateIntrinsicElement(openingElement, elementName, state)

          return
        }

        annotateComponentUsage(openingElement, elementName, state)
      },
    },
  }
}
