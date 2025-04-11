
Object.defineProperty(exports, "__esModule", { value: true });

const {
  PrismaClientKnownRequestError,
  PrismaClientUnknownRequestError,
  PrismaClientRustPanicError,
  PrismaClientInitializationError,
  PrismaClientValidationError,
  getPrismaClient,
  sqltag,
  empty,
  join,
  raw,
  skip,
  Decimal,
  Debug,
  objectEnumValues,
  makeStrictEnum,
  Extensions,
  warnOnce,
  defineDmmfProperty,
  Public,
  getRuntime,
  createParam,
} = require('./runtime/wasm.js')


const Prisma = {}

exports.Prisma = Prisma
exports.$Enums = {}

/**
 * Prisma Client JS version: 6.6.0
 * Query Engine version: f676762280b54cd07c770017ed3711ddde35f37a
 */
Prisma.prismaVersion = {
  client: "6.6.0",
  engine: "f676762280b54cd07c770017ed3711ddde35f37a"
}

Prisma.PrismaClientKnownRequestError = PrismaClientKnownRequestError;
Prisma.PrismaClientUnknownRequestError = PrismaClientUnknownRequestError
Prisma.PrismaClientRustPanicError = PrismaClientRustPanicError
Prisma.PrismaClientInitializationError = PrismaClientInitializationError
Prisma.PrismaClientValidationError = PrismaClientValidationError
Prisma.Decimal = Decimal

/**
 * Re-export of sql-template-tag
 */
Prisma.sql = sqltag
Prisma.empty = empty
Prisma.join = join
Prisma.raw = raw
Prisma.validator = Public.validator

/**
* Extensions
*/
Prisma.getExtensionContext = Extensions.getExtensionContext
Prisma.defineExtension = Extensions.defineExtension

/**
 * Shorthand utilities for JSON filtering
 */
Prisma.DbNull = objectEnumValues.instances.DbNull
Prisma.JsonNull = objectEnumValues.instances.JsonNull
Prisma.AnyNull = objectEnumValues.instances.AnyNull

Prisma.NullTypes = {
  DbNull: objectEnumValues.classes.DbNull,
  JsonNull: objectEnumValues.classes.JsonNull,
  AnyNull: objectEnumValues.classes.AnyNull
}





/**
 * Enums
 */
exports.Prisma.TransactionIsolationLevel = makeStrictEnum({
  ReadUncommitted: 'ReadUncommitted',
  ReadCommitted: 'ReadCommitted',
  RepeatableRead: 'RepeatableRead',
  Serializable: 'Serializable'
});

exports.Prisma.UserScalarFieldEnum = {
  id: 'id',
  email: 'email',
  username: 'username',
  password: 'password',
  role: 'role',
  created_at: 'created_at',
  updated_at: 'updated_at'
};

exports.Prisma.RelationLoadStrategy = {
  query: 'query',
  join: 'join'
};

exports.Prisma.PostScalarFieldEnum = {
  id: 'id',
  title: 'title',
  content: 'content',
  published: 'published',
  userId: 'userId',
  created_at: 'created_at',
  updated_at: 'updated_at'
};

exports.Prisma.CategoryScalarFieldEnum = {
  id: 'id',
  name: 'name'
};

exports.Prisma.CommentScalarFieldEnum = {
  id: 'id',
  content: 'content',
  postId: 'postId',
  created_at: 'created_at',
  updated_at: 'updated_at',
  userId: 'userId'
};

exports.Prisma.CommentResponseScalarFieldEnum = {
  id: 'id',
  content: 'content',
  userId: 'userId',
  created_at: 'created_at',
  updated_at: 'updated_at',
  commentId: 'commentId'
};

exports.Prisma.LikeScalarFieldEnum = {
  id: 'id',
  postId: 'postId',
  created_at: 'created_at',
  userId: 'userId'
};

exports.Prisma.SortOrder = {
  asc: 'asc',
  desc: 'desc'
};

exports.Prisma.QueryMode = {
  default: 'default',
  insensitive: 'insensitive'
};

exports.Prisma.NullsOrder = {
  first: 'first',
  last: 'last'
};
exports.Role = exports.$Enums.Role = {
  ADMIN: 'ADMIN',
  USER: 'USER'
};

exports.Prisma.ModelName = {
  User: 'User',
  Post: 'Post',
  Category: 'Category',
  Comment: 'Comment',
  CommentResponse: 'CommentResponse',
  Like: 'Like'
};
/**
 * Create the Client
 */
const config = {
  "generator": {
    "name": "client",
    "provider": {
      "fromEnvVar": null,
      "value": "prisma-client-js"
    },
    "output": {
      "value": "/Users/marcelonogueira/Projects/node/nestjs-blog-api/generated/prisma",
      "fromEnvVar": null
    },
    "config": {
      "engineType": "library"
    },
    "binaryTargets": [
      {
        "fromEnvVar": null,
        "value": "darwin-arm64",
        "native": true
      }
    ],
    "previewFeatures": [
      "driverAdapters",
      "relationJoins"
    ],
    "sourceFilePath": "/Users/marcelonogueira/Projects/node/nestjs-blog-api/prisma/schema.prisma",
    "isCustomOutput": true
  },
  "relativeEnvPaths": {
    "rootEnvPath": null,
    "schemaEnvPath": "../../.env"
  },
  "relativePath": "../../prisma",
  "clientVersion": "6.6.0",
  "engineVersion": "f676762280b54cd07c770017ed3711ddde35f37a",
  "datasourceNames": [
    "db"
  ],
  "activeProvider": "postgresql",
  "postinstall": false,
  "inlineDatasources": {
    "db": {
      "url": {
        "fromEnvVar": "DATABASE_URL",
        "value": null
      }
    }
  },
  "inlineSchema": "generator client {\n  provider        = \"prisma-client-js\"\n  output          = \"../generated/prisma\"\n  previewFeatures = [\"driverAdapters\", \"relationJoins\"]\n}\n\ndatasource db {\n  provider = \"postgresql\"\n  url      = env(\"DATABASE_URL\")\n}\n\nmodel User {\n  id              Int               @id @default(autoincrement())\n  email           String            @unique @db.VarChar(50)\n  username        String            @unique @db.VarChar(50)\n  password        String            @db.VarChar(100)\n  role            Role\n  created_at      DateTime          @default(now()) @db.Timestamp(6)\n  updated_at      DateTime          @default(now()) @db.Timestamp(6)\n  comments        Comment[]\n  likes           Like[]\n  posts           Post[]\n  commentResponse CommentResponse[]\n\n  @@map(\"users\")\n}\n\nmodel Post {\n  id         Int        @id @default(autoincrement())\n  title      String     @db.VarChar(255)\n  content    String\n  published  Boolean    @default(false)\n  userId     Int?\n  created_at DateTime   @default(now()) @db.Timestamp(6)\n  updated_at DateTime   @default(now()) @db.Timestamp(6)\n  comments   Comment[]\n  likes      Like[]\n  user       User?      @relation(fields: [userId], references: [id], onDelete: Cascade)\n  categories Category[] @relation(\"CategoryToPost\")\n\n  @@map(\"posts\")\n}\n\nmodel Category {\n  id    Int    @id @default(autoincrement())\n  name  String @db.VarChar(20)\n  posts Post[] @relation(\"CategoryToPost\")\n\n  @@map(\"categories\")\n}\n\nmodel Comment {\n  id         Int               @id @default(autoincrement())\n  content    String\n  postId     Int\n  created_at DateTime          @default(now()) @db.Timestamp(6)\n  updated_at DateTime          @default(now()) @db.Timestamp(6)\n  userId     Int\n  post       Post              @relation(fields: [postId], references: [id])\n  user       User              @relation(fields: [userId], references: [id], onDelete: Cascade)\n  response   CommentResponse[]\n\n  @@map(\"comments\")\n}\n\nmodel CommentResponse {\n  id         Int      @id @default(autoincrement())\n  content    String\n  userId     Int\n  created_at DateTime @default(now()) @db.Timestamp(6)\n  updated_at DateTime @default(now()) @db.Timestamp(6)\n  commentId  Int\n  comments   Comment  @relation(fields: [commentId], references: [id])\n  user       User     @relation(fields: [userId], references: [id])\n\n  @@map(\"response\")\n}\n\nmodel Like {\n  id         Int      @id @default(autoincrement())\n  postId     Int\n  created_at DateTime @default(now()) @db.Timestamp(6)\n  userId     Int?\n  post       Post     @relation(fields: [postId], references: [id])\n  user       User?    @relation(fields: [userId], references: [id])\n\n  @@map(\"likes\")\n}\n\nenum Role {\n  ADMIN\n  USER\n}\n",
  "inlineSchemaHash": "47e9f4f0a6663311cbf777619c38acf6a43ce6eae7d3afd5c65676a7578549c8",
  "copyEngine": true
}
config.dirname = '/'

config.runtimeDataModel = JSON.parse("{\"models\":{\"User\":{\"fields\":[{\"name\":\"id\",\"kind\":\"scalar\",\"type\":\"Int\"},{\"name\":\"email\",\"kind\":\"scalar\",\"type\":\"String\"},{\"name\":\"username\",\"kind\":\"scalar\",\"type\":\"String\"},{\"name\":\"password\",\"kind\":\"scalar\",\"type\":\"String\"},{\"name\":\"role\",\"kind\":\"enum\",\"type\":\"Role\"},{\"name\":\"created_at\",\"kind\":\"scalar\",\"type\":\"DateTime\"},{\"name\":\"updated_at\",\"kind\":\"scalar\",\"type\":\"DateTime\"},{\"name\":\"comments\",\"kind\":\"object\",\"type\":\"Comment\",\"relationName\":\"CommentToUser\"},{\"name\":\"likes\",\"kind\":\"object\",\"type\":\"Like\",\"relationName\":\"LikeToUser\"},{\"name\":\"posts\",\"kind\":\"object\",\"type\":\"Post\",\"relationName\":\"PostToUser\"},{\"name\":\"commentResponse\",\"kind\":\"object\",\"type\":\"CommentResponse\",\"relationName\":\"CommentResponseToUser\"}],\"dbName\":\"users\"},\"Post\":{\"fields\":[{\"name\":\"id\",\"kind\":\"scalar\",\"type\":\"Int\"},{\"name\":\"title\",\"kind\":\"scalar\",\"type\":\"String\"},{\"name\":\"content\",\"kind\":\"scalar\",\"type\":\"String\"},{\"name\":\"published\",\"kind\":\"scalar\",\"type\":\"Boolean\"},{\"name\":\"userId\",\"kind\":\"scalar\",\"type\":\"Int\"},{\"name\":\"created_at\",\"kind\":\"scalar\",\"type\":\"DateTime\"},{\"name\":\"updated_at\",\"kind\":\"scalar\",\"type\":\"DateTime\"},{\"name\":\"comments\",\"kind\":\"object\",\"type\":\"Comment\",\"relationName\":\"CommentToPost\"},{\"name\":\"likes\",\"kind\":\"object\",\"type\":\"Like\",\"relationName\":\"LikeToPost\"},{\"name\":\"user\",\"kind\":\"object\",\"type\":\"User\",\"relationName\":\"PostToUser\"},{\"name\":\"categories\",\"kind\":\"object\",\"type\":\"Category\",\"relationName\":\"CategoryToPost\"}],\"dbName\":\"posts\"},\"Category\":{\"fields\":[{\"name\":\"id\",\"kind\":\"scalar\",\"type\":\"Int\"},{\"name\":\"name\",\"kind\":\"scalar\",\"type\":\"String\"},{\"name\":\"posts\",\"kind\":\"object\",\"type\":\"Post\",\"relationName\":\"CategoryToPost\"}],\"dbName\":\"categories\"},\"Comment\":{\"fields\":[{\"name\":\"id\",\"kind\":\"scalar\",\"type\":\"Int\"},{\"name\":\"content\",\"kind\":\"scalar\",\"type\":\"String\"},{\"name\":\"postId\",\"kind\":\"scalar\",\"type\":\"Int\"},{\"name\":\"created_at\",\"kind\":\"scalar\",\"type\":\"DateTime\"},{\"name\":\"updated_at\",\"kind\":\"scalar\",\"type\":\"DateTime\"},{\"name\":\"userId\",\"kind\":\"scalar\",\"type\":\"Int\"},{\"name\":\"post\",\"kind\":\"object\",\"type\":\"Post\",\"relationName\":\"CommentToPost\"},{\"name\":\"user\",\"kind\":\"object\",\"type\":\"User\",\"relationName\":\"CommentToUser\"},{\"name\":\"response\",\"kind\":\"object\",\"type\":\"CommentResponse\",\"relationName\":\"CommentToCommentResponse\"}],\"dbName\":\"comments\"},\"CommentResponse\":{\"fields\":[{\"name\":\"id\",\"kind\":\"scalar\",\"type\":\"Int\"},{\"name\":\"content\",\"kind\":\"scalar\",\"type\":\"String\"},{\"name\":\"userId\",\"kind\":\"scalar\",\"type\":\"Int\"},{\"name\":\"created_at\",\"kind\":\"scalar\",\"type\":\"DateTime\"},{\"name\":\"updated_at\",\"kind\":\"scalar\",\"type\":\"DateTime\"},{\"name\":\"commentId\",\"kind\":\"scalar\",\"type\":\"Int\"},{\"name\":\"comments\",\"kind\":\"object\",\"type\":\"Comment\",\"relationName\":\"CommentToCommentResponse\"},{\"name\":\"user\",\"kind\":\"object\",\"type\":\"User\",\"relationName\":\"CommentResponseToUser\"}],\"dbName\":\"response\"},\"Like\":{\"fields\":[{\"name\":\"id\",\"kind\":\"scalar\",\"type\":\"Int\"},{\"name\":\"postId\",\"kind\":\"scalar\",\"type\":\"Int\"},{\"name\":\"created_at\",\"kind\":\"scalar\",\"type\":\"DateTime\"},{\"name\":\"userId\",\"kind\":\"scalar\",\"type\":\"Int\"},{\"name\":\"post\",\"kind\":\"object\",\"type\":\"Post\",\"relationName\":\"LikeToPost\"},{\"name\":\"user\",\"kind\":\"object\",\"type\":\"User\",\"relationName\":\"LikeToUser\"}],\"dbName\":\"likes\"}},\"enums\":{},\"types\":{}}")
defineDmmfProperty(exports.Prisma, config.runtimeDataModel)
config.engineWasm = {
  getRuntime: async () => require('./query_engine_bg.js'),
  getQueryEngineWasmModule: async () => {
    const loader = (await import('#wasm-engine-loader')).default
    const engine = (await loader).default
    return engine
  }
}
config.compilerWasm = undefined

config.injectableEdgeEnv = () => ({
  parsed: {
    DATABASE_URL: typeof globalThis !== 'undefined' && globalThis['DATABASE_URL'] || typeof process !== 'undefined' && process.env && process.env.DATABASE_URL || undefined
  }
})

if (typeof globalThis !== 'undefined' && globalThis['DEBUG'] || typeof process !== 'undefined' && process.env && process.env.DEBUG || undefined) {
  Debug.enable(typeof globalThis !== 'undefined' && globalThis['DEBUG'] || typeof process !== 'undefined' && process.env && process.env.DEBUG || undefined)
}

const PrismaClient = getPrismaClient(config)
exports.PrismaClient = PrismaClient
Object.assign(exports, Prisma)

