import { defineConfig } from 'prisma/config'

export default defineConfig({
  schema: 'prisma/schema.prisma',
  migrations: {
    path: 'prisma/migrations'
  },
  engineType: 'library',
  datasource: {
    url: 'file:./prisma/db.test.sqlite'
  }
})
