import { fieldEncryptionExtension, fieldEncryptionMiddleware } from '../index'
import { Configuration } from '../types'
import { PrismaClient } from './.generated/client'
import { PrismaBetterSqlite3 } from '@prisma/adapter-better-sqlite3'

const TEST_ENCRYPTION_KEY =
  'k1.aesgcm256.__________________________________________8='

const config: Configuration = {
  encryptionKey: TEST_ENCRYPTION_KEY,
  schemaPath: './prisma/schema.prisma'
}

const adapter = new PrismaBetterSqlite3({
  url: 'file:./prisma/db.test.sqlite'
})

const prismaClientOptions: any = {
  adapter,
  log: process.env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error']
}

export function makeMiddlewareClient() {
  const client = new PrismaClient(prismaClientOptions)
  // Note: Prisma v7 removed the $use method. Use extensions instead.
  // client.$use(fieldEncryptionMiddleware(config))
  return client
}

export function makeExtensionClient() {
  const client = new PrismaClient(prismaClientOptions)
  return client.$extends(fieldEncryptionExtension(config)) as PrismaClient
}

export async function runIntegrationTests() {
  return true
}
