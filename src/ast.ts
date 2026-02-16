import type { Encoding } from '@47ng/codec'
import { 
  getSchema,
  type Block, 
  type Field,
  type Attribute,
  type Model
} from '@mrleebo/prisma-ast'
import { errors, warnings } from './errors'
import {
  FieldConfiguration,
  HashFieldConfiguration,
  HashFieldNormalizeOptions
} from './types'

export interface ConnectionDescriptor {
  modelName: string
  isList: boolean
}

export interface ASTModelDescriptor {
  /**
   * The field to use to iterate over rows
   * in encryption/decryption/key rotation migrations.
   *
   * See https://github.com/47ng/prisma-field-encryption#migrations
   */
  cursor?: string
  fields: Record<string, FieldConfiguration> // key: field name
  connections: Record<string, ConnectionDescriptor> // key: field name
}

export type ASTModels = Record<string, ASTModelDescriptor> // key: model name

const supportedCursorTypes = ['Int', 'String', 'BigInt']

export function analyseSchema(schemaContent: string): ASTModels {
  const schema = getSchema(schemaContent)
  
  // Find all model blocks
  const modelBlocks = schema.list.filter((block: Block) => block.type === 'model') as Model[]
  
  return modelBlocks.reduce<ASTModels>((output: ASTModels, modelBlock: Model) => {
    const modelName = modelBlock.name
    const fields = modelBlock.properties.filter((prop): prop is Field => prop.type === 'field')
    
    // Find cursor field candidates
    const idField = fields.find(
      (field: Field) => 
        field.attributes?.some((attr: Attribute) => attr.name === 'id') &&
        supportedCursorTypes.includes(String(field.fieldType))
    )
    
    const uniqueField = fields.find(
      (field: Field) => 
        field.attributes?.some((attr: Attribute) => attr.name === 'unique') &&
        supportedCursorTypes.includes(String(field.fieldType))
    )
    
    const cursorField = fields.find((field: Field) => 
      field.comment?.includes('@encryption:cursor')
    )
    
    if (cursorField) {
      // Make sure custom cursor field is valid
      const isUnique = cursorField.attributes?.some((attr: Attribute) => 
        attr.name === 'unique' || attr.name === 'id'
      )
      if (!isUnique) {
        throw new Error(errors.nonUniqueCursor(modelName, cursorField.name))
      }
      if (!supportedCursorTypes.includes(String(cursorField.fieldType))) {
        throw new Error(
          errors.unsupportedCursorType(
            modelName,
            cursorField.name,
            String(cursorField.fieldType)
          )
        )
      }
      if (cursorField.comment?.includes('@encrypted')) {
        throw new Error(errors.encryptedCursor(modelName, cursorField.name))
      }
    }

    const modelDescriptor: ASTModelDescriptor = {
      cursor: cursorField?.name ?? idField?.name ?? uniqueField?.name,
      fields: fields.reduce<Record<string, FieldConfiguration>>(
        (fieldsAcc: Record<string, FieldConfiguration>, field: Field) => {
          const fieldConfig = parseEncryptedAnnotation(
            field.comment,
            modelName,
            field.name
          )
          if (fieldConfig && String(field.fieldType) !== 'String') {
            throw new Error(errors.unsupportedFieldType(modelBlock, field))
          }
          return fieldConfig ? { ...fieldsAcc, [field.name]: fieldConfig } : fieldsAcc
        },
        {}
      ),
      connections: fields.reduce<Record<string, ConnectionDescriptor>>(
        (connectionsAcc: Record<string, ConnectionDescriptor>, field: Field) => {
          const targetModel = modelBlocks.find((model: Model) => 
            String(field.fieldType) === model.name
          )
          if (!targetModel) {
            return connectionsAcc
          }
          const connection: ConnectionDescriptor = {
            modelName: targetModel.name,
            isList: field.array === true
          }
          return {
            ...connectionsAcc,
            [field.name]: connection
          }
        },
        {}
      )
    }
    
    // Inject hash information
    fields.forEach((field: Field) => {
      const hashConfig = parseHashAnnotation(
        field.comment,
        modelName,
        field.name
      )
      if (!hashConfig) {
        return
      }
      if (String(field.fieldType) !== 'String') {
        throw new Error(errors.unsupporteHashFieldType(modelBlock, field))
      }
      const { sourceField, ...hash } = hashConfig
      if (!(sourceField in modelDescriptor.fields)) {
        throw new Error(
          errors.hashSourceFieldNotFound(modelBlock, field, sourceField)
        )
      }
      modelDescriptor.fields[hashConfig.sourceField].hash = hash
    })

    if (
      Object.keys(modelDescriptor.fields).length > 0 &&
      !modelDescriptor.cursor
    ) {
      console.warn(warnings.noCursorFound(modelName))
    }
    
    return {
      ...output,
      [modelName]: modelDescriptor
    }
  }, {})
}

// --

const encryptedAnnotationRegex = /@encrypted(?<query>\?[\w=&]+)?/
const hashAnnotationRegex =
  /@encryption:hash\((?<fieldName>\w+)\)(?<query>\?[\w=&]+)?/

export function parseEncryptedAnnotation(
  annotation = '',
  model?: string,
  field?: string
): FieldConfiguration | null {
  const match = annotation.match(encryptedAnnotationRegex)
  if (!match) {
    return null
  }
  const query = new URLSearchParams(match.groups?.query ?? '')
  const strict = query.get('strict') !== null
  const readonly = query.get('readonly') !== null
  if (strict && process.env.NODE_ENV === 'development' && model && field) {
    console.warn(warnings.deprecatedModeAnnotation(model, field, 'strict'))
  }
  if (readonly && process.env.NODE_ENV === 'development' && model && field) {
    console.warn(warnings.deprecatedModeAnnotation(model, field, 'readonly'))
  }
  const mode =
    query.get('mode') ?? (readonly ? 'readonly' : strict ? 'strict' : 'default')
  /* istanbul ignore next */
  if (!['default', 'strict', 'readonly'].includes(mode)) {
    if (process.env.NODE_ENV === 'development' && model && field) {
      console.warn(warnings.unknownFieldModeAnnotation(model, field, mode))
    }
  }
  return {
    encrypt: mode !== 'readonly',
    strictDecryption: mode === 'strict'
  }
}

export function parseHashAnnotation(
  annotation = '',
  model?: string,
  field?: string
): HashFieldConfiguration | null {
  const match = annotation.match(hashAnnotationRegex)
  if (!match || !match.groups?.fieldName) {
    return null
  }
  const query = new URLSearchParams(match.groups.query ?? '')
  const inputEncoding = (query.get('inputEncoding') as Encoding) ?? 'utf8'
  if (
    !isValidEncoding(inputEncoding) &&
    process.env.NODE_ENV === 'development' &&
    model &&
    field
  ) {
    console.warn(
      warnings.unsupportedEncoding(model, field, inputEncoding, 'input')
    )
  }
  const outputEncoding = (query.get('outputEncoding') as Encoding) ?? 'hex'
  if (
    !isValidEncoding(outputEncoding) &&
    process.env.NODE_ENV === 'development' &&
    model &&
    field
  ) {
    console.warn(
      warnings.unsupportedEncoding(model, field, outputEncoding, 'output')
    )
  }
  const saltEnv = query.get('saltEnv')
  const salt =
    query.get('salt') ??
    (saltEnv
      ? process.env[saltEnv]
      : process.env.PRISMA_FIELD_ENCRYPTION_HASH_SALT)

  const normalize =
    (query.getAll('normalize') as HashFieldNormalizeOptions[]) ?? []

  if (
    !isValidNormalizeOptions(normalize) &&
    process.env.NODE_ENV === 'development' &&
    model &&
    field
  ) {
    console.warn(warnings.unsupportedNormalize(model, field, normalize))
  }

  if (
    normalize.length > 0 &&
    inputEncoding !== 'utf8' &&
    process.env.NODE_ENV === 'development' &&
    model &&
    field
  ) {
    console.warn(
      warnings.unsupportedNormalizeEncoding(model, field, inputEncoding)
    )
  }

  return {
    sourceField: match.groups.fieldName,
    targetField: field ?? match.groups.fieldName + 'Hash',
    algorithm: query.get('algorithm') ?? 'sha256',
    salt,
    inputEncoding,
    outputEncoding,
    normalize
  }
}

function isValidEncoding(encoding: string): encoding is Encoding {
  return ['hex', 'base64', 'utf8'].includes(encoding)
}

function isValidNormalizeOptions(
  options: string[]
): options is HashFieldNormalizeOptions[] {
  return options.every(option => option in HashFieldNormalizeOptions)
}

// Helper function to read schema from file or directory (multi-file schema support)
export function analyseSchemaFile(schemaPath: string): ASTModels {
  const fs = require('fs')
  const path = require('path')
  
  const stat = fs.statSync(schemaPath)
  
  if (stat.isDirectory()) {
    return analyseSchemaDirectory(schemaPath)
  } else {
    const schemaContent = fs.readFileSync(schemaPath, 'utf8')
    return analyseSchema(schemaContent)
  }
}

function analyseSchemaDirectory(dirPath: string): ASTModels {
  const fs = require('fs')
  const path = require('path')
  
  const schemaFiles: string[] = []
  
  function findPrismaFiles(currentPath: string) {
    const items = fs.readdirSync(currentPath)
    for (const item of items) {
      const fullPath = path.join(currentPath, item)
      const stat = fs.statSync(fullPath)
      
      if (stat.isDirectory()) {
        findPrismaFiles(fullPath)
      } else if (item.endsWith('.prisma')) {
        schemaFiles.push(fullPath)
      }
    }
  }
  
  findPrismaFiles(dirPath)
  
  if (schemaFiles.length === 0) {
    throw new Error(`No .prisma files found in directory: ${dirPath}`)
  }
  
  schemaFiles.sort()
  
  const combinedSchema = schemaFiles
    .map(filePath => fs.readFileSync(filePath, 'utf8'))
    .join('\n\n')
  
  return analyseSchema(combinedSchema)
}

export function resolveSchemaPath(schemaPath?: string): string {
  const path = require('path')
  
  if (schemaPath) {
    return schemaPath
  }
  
  const fs = require('fs')
  const cwd = process.cwd()
  
  const configPaths = [
    'prisma.config.ts',
    'prisma.config.js',
    '.config/prisma.ts',
    '.config/prisma.js'
  ]
  
  for (const configPath of configPaths) {
    const fullPath = path.join(cwd, configPath)
    if (fs.existsSync(fullPath)) {
      try {
        const content = fs.readFileSync(fullPath, 'utf8')
        const schemaMatch = content.match(/schema:\s*['"]([^'"]+)['"]/)
        if (schemaMatch) {
          const resolvedPath = path.resolve(cwd, schemaMatch[1])
          return resolvedPath
        }
      } catch (err) {
      }
    }
  }
  
  const packageJsonPath = path.join(cwd, 'package.json')
  if (fs.existsSync(packageJsonPath)) {
    try {
      const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'))
      if (packageJson.prisma?.schema) {
        return path.resolve(cwd, packageJson.prisma.schema)
      }
    } catch (err) {
    }
  }
  
  const defaultPaths = [
    path.join(cwd, 'prisma/schema.prisma'),
    path.join(cwd, 'schema.prisma')
  ]
  
  for (const defaultPath of defaultPaths) {
    if (fs.existsSync(defaultPath)) {
      return defaultPath
    }
  }
  
  return './prisma/schema.prisma'
}
