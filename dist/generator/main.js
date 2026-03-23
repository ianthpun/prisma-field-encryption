#!/usr/bin/env node
#!/usr/bin/env node
//#region \0rolldown/runtime.js
var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __commonJSMin = (cb, mod) => () => (mod || cb((mod = { exports: {} }).exports, mod), mod.exports);
var __copyProps = (to, from, except, desc) => {
	if (from && typeof from === "object" || typeof from === "function") {
		for (var keys = __getOwnPropNames(from), i = 0, n = keys.length, key; i < n; i++) {
			key = keys[i];
			if (!__hasOwnProp.call(to, key) && key !== except) {
				__defProp(to, key, {
					get: ((k) => from[k]).bind(null, key),
					enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable
				});
			}
		}
	}
	return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", {
	value: mod,
	enumerable: true
}) : target, mod));

//#endregion
let _prisma_generator_helper = require("@prisma/generator-helper");
let node_fs_promises = require("node:fs/promises");
node_fs_promises = __toESM(node_fs_promises);
let path_posix = require("path/posix");
path_posix = __toESM(path_posix);
let _mrleebo_prisma_ast = require("@mrleebo/prisma-ast");
let debug = require("debug");
debug = __toESM(debug);
let node_path = require("node:path");
node_path = __toESM(node_path);

//#region src/debugger.ts
const namespace = "prisma-field-encryption";
const debug$1 = {
	setup: (0, debug.default)(`${namespace}:setup`),
	runtime: (0, debug.default)(`${namespace}:runtime`),
	encryption: (0, debug.default)(`${namespace}:encryption`),
	decryption: (0, debug.default)(`${namespace}:decryption`)
};

//#endregion
//#region src/types.ts
let HashFieldNormalizeOptions = /* @__PURE__ */ function(HashFieldNormalizeOptions) {
	HashFieldNormalizeOptions["lowercase"] = "lowercase";
	HashFieldNormalizeOptions["uppercase"] = "uppercase";
	HashFieldNormalizeOptions["trim"] = "trim";
	HashFieldNormalizeOptions["spaces"] = "spaces";
	HashFieldNormalizeOptions["diacritics"] = "diacritics";
	return HashFieldNormalizeOptions;
}({});

//#endregion
//#region src/errors.ts
const error = `[${namespace}] Error`;
const warning = `[${namespace}] Warning`;
const errors = {
	noEncryptionKey: `${error}: no encryption key provided.`,
	unsupportedFieldType: (model, field) => `${error}: encryption enabled for field ${model.name}.${field.name} of unsupported type ${field.type}: only String fields can be encrypted.`,
	unsupporteHashFieldType: (model, field) => `${error}: hash enabled for field ${model.name}.${field.name} of unsupported type ${field.type}: only String fields can contain hashes.`,
	hashSourceFieldNotFound: (model, hashField, sourceField) => `${error}: no such field \`${sourceField}\` in ${model.name}
  -> Referenced by hash field ${model.name}.${hashField.name}`,
	fieldEncryptionError: (model, field, path, error) => `Encryption error for ${model}.${field} at ${path}: ${error}`,
	encryptionErrorReport: (operation, errors) => `${error}: encryption error(s) encountered in operation ${operation}:
  ${errors.join("\n  ")}`,
	fieldDecryptionError: (model, field, path, error) => `Decryption error for ${model}.${field} at ${path}: ${error}`,
	decryptionErrorReport: (operation, errors) => `${error}: decryption error(s) encountered in operation ${operation}:
  ${errors.join("\n  ")}`,
	orderByUnsupported: (model, field) => `${error}: Running \`orderBy\` on encrypted field ${model}.${field} is not supported (results won't be sorted).
  See: https://github.com/47ng/prisma-field-encryption/issues/43
`,
	nonUniqueCursor: (model, field) => `${error}: the cursor field ${model}.${field} should have a @unique attribute.
  Read more: https://github.com/47ng/prisma-field-encryption#custom-cursors`,
	unsupportedCursorType: (model, field, type) => `${error}: the cursor field ${model}.${field} has an unsupported type ${type}.
  Only String and Int cursors are supported.
  Read more: https://github.com/47ng/prisma-field-encryption#custom-cursors`,
	encryptedCursor: (model, field) => `${error}: the field ${model}.${field} cannot be used as a cursor as it is encrypted.
  Read more: https://github.com/47ng/prisma-field-encryption#custom-cursors`
};
const warnings = {
	deprecatedModeAnnotation: (model, field, mode) => `${warning}: deprecated annotation \`/// @encrypted?${mode}\` on field ${model}.${field}.
  -> Please replace with /// @encrypted?mode=${mode}
  (support for undocumented annotations will be removed in a future update)`,
	unknownFieldModeAnnotation: (model, field, mode) => `${warning}: the field ${model}.${field} defines an unknown mode \`${mode}\`.
  Accepted modes are \`strict\` or \`readonly\`.`,
	noCursorFound: (model) => `${warning}: could not find a field to use to iterate over rows in model ${model}.
  Automatic encryption/decryption/key rotation migrations are disabled for this model.
  Read more: https://github.com/47ng/prisma-field-encryption#migrations`,
	whereConnectClauseNoHash: (operation, path) => `${warning}: you're using an encrypted field in a \`where\` or \`connect\` clause without a hash.
  -> In ${operation}: ${path}
  This will not work as-is, read more: https://github.com/47ng/prisma-field-encryption#caveats--limitations
  Consider adding a hash field to enable searching encrypted fields:
  https://github.com/47ng/prisma-field-encryption#enable-search-with-hashes
  `,
	unsupportedHashAlgorithm: (model, field, algorithm) => `${warning}: unsupported hash algorithm \`${algorithm}\` for hash field ${model}.${field}
  -> Valid values are algorithms accepted by Node's crypto.createHash:
  https://nodejs.org/dist/latest-v16.x/docs/api/crypto.html#cryptocreatehashalgorithm-options
`,
	unsupportedEncoding: (model, field, encoding, io) => `${warning}: unsupported ${io} encoding \`${encoding}\` for hash field ${model}.${field}
  -> Valid values are utf8, base64, hex
`,
	unsupportedNormalize: (model, field, normalize) => `${warning}: unsupported normalize \`${normalize}\` for hash field ${model}.${field}
  -> Valid values are ${Object.values(HashFieldNormalizeOptions)}
`,
	unsupportedNormalizeEncoding: (model, field, inputEncoding) => `${warning}: unsupported normalize flag on field with encoding \`${inputEncoding}\` for hash field ${model}.${field}
-> Valid inputEncoding values for normalize are [utf8]
`
};

//#endregion
//#region src/ast.ts
const supportedCursorTypes = [
	"Int",
	"String",
	"BigInt"
];
function analyseSchema(schemaContent) {
	const modelBlocks = (0, _mrleebo_prisma_ast.getSchema)(schemaContent).list.filter((block) => block.type === "model");
	return modelBlocks.reduce((output, modelBlock) => {
		const modelName = modelBlock.name;
		const fields = modelBlock.properties.filter((prop) => prop.type === "field");
		const idField = fields.find((field) => field.attributes?.some((attr) => attr.name === "id") && supportedCursorTypes.includes(String(field.fieldType)));
		const uniqueField = fields.find((field) => field.attributes?.some((attr) => attr.name === "unique") && supportedCursorTypes.includes(String(field.fieldType)));
		const cursorField = fields.find((field) => field.comment?.includes("@encryption:cursor"));
		if (cursorField) {
			if (!cursorField.attributes?.some((attr) => attr.name === "unique" || attr.name === "id")) throw new Error(errors.nonUniqueCursor(modelName, cursorField.name));
			if (!supportedCursorTypes.includes(String(cursorField.fieldType))) throw new Error(errors.unsupportedCursorType(modelName, cursorField.name, String(cursorField.fieldType)));
			if (cursorField.comment?.includes("@encrypted")) throw new Error(errors.encryptedCursor(modelName, cursorField.name));
		}
		const modelDescriptor = {
			cursor: cursorField?.name ?? idField?.name ?? uniqueField?.name,
			fields: fields.reduce((fieldsAcc, field) => {
				const fieldConfig = parseEncryptedAnnotation(field.comment, modelName, field.name);
				if (fieldConfig && String(field.fieldType) !== "String") throw new Error(errors.unsupportedFieldType(modelBlock, field));
				return fieldConfig ? {
					...fieldsAcc,
					[field.name]: fieldConfig
				} : fieldsAcc;
			}, {}),
			connections: fields.reduce((connectionsAcc, field) => {
				const targetModel = modelBlocks.find((model) => String(field.fieldType) === model.name);
				if (!targetModel) return connectionsAcc;
				const connection = {
					modelName: targetModel.name,
					isList: field.array === true
				};
				return {
					...connectionsAcc,
					[field.name]: connection
				};
			}, {})
		};
		fields.forEach((field) => {
			const hashConfig = parseHashAnnotation(field.comment, modelName, field.name);
			if (!hashConfig) return;
			if (String(field.fieldType) !== "String") throw new Error(errors.unsupporteHashFieldType(modelBlock, field));
			const { sourceField, ...hash } = hashConfig;
			if (!(sourceField in modelDescriptor.fields)) throw new Error(errors.hashSourceFieldNotFound(modelBlock, field, sourceField));
			modelDescriptor.fields[hashConfig.sourceField].hash = hash;
		});
		if (Object.keys(modelDescriptor.fields).length > 0 && !modelDescriptor.cursor) console.warn(warnings.noCursorFound(modelName));
		return {
			...output,
			[modelName]: modelDescriptor
		};
	}, {});
}
const encryptedAnnotationRegex = /@encrypted(?<query>\?[\w=&]+)?/;
const hashAnnotationRegex = /@encryption:hash\((?<fieldName>\w+)\)(?<query>\?[\w=&]+)?/;
function parseEncryptedAnnotation(annotation = "", model, field) {
	const match = annotation.match(encryptedAnnotationRegex);
	if (!match) return null;
	const query = new URLSearchParams(match.groups?.query ?? "");
	const strict = query.get("strict") !== null;
	const readonly = query.get("readonly") !== null;
	if (strict && process.env.NODE_ENV === "development" && model && field) console.warn(warnings.deprecatedModeAnnotation(model, field, "strict"));
	if (readonly && process.env.NODE_ENV === "development" && model && field) console.warn(warnings.deprecatedModeAnnotation(model, field, "readonly"));
	const mode = query.get("mode") ?? (readonly ? "readonly" : strict ? "strict" : "default");
	/* istanbul ignore next */
	if (![
		"default",
		"strict",
		"readonly"
	].includes(mode)) {
		if (process.env.NODE_ENV === "development" && model && field) console.warn(warnings.unknownFieldModeAnnotation(model, field, mode));
	}
	return {
		encrypt: mode !== "readonly",
		strictDecryption: mode === "strict"
	};
}
function parseHashAnnotation(annotation = "", model, field) {
	const match = annotation.match(hashAnnotationRegex);
	if (!match || !match.groups?.fieldName) return null;
	const query = new URLSearchParams(match.groups.query ?? "");
	const inputEncoding = query.get("inputEncoding") ?? "utf8";
	if (!isValidEncoding(inputEncoding) && process.env.NODE_ENV === "development" && model && field) console.warn(warnings.unsupportedEncoding(model, field, inputEncoding, "input"));
	const outputEncoding = query.get("outputEncoding") ?? "hex";
	if (!isValidEncoding(outputEncoding) && process.env.NODE_ENV === "development" && model && field) console.warn(warnings.unsupportedEncoding(model, field, outputEncoding, "output"));
	const saltEnv = query.get("saltEnv");
	const salt = query.get("salt") ?? (saltEnv ? process.env[saltEnv] : process.env.PRISMA_FIELD_ENCRYPTION_HASH_SALT);
	const normalize = query.getAll("normalize") ?? [];
	if (!isValidNormalizeOptions(normalize) && process.env.NODE_ENV === "development" && model && field) console.warn(warnings.unsupportedNormalize(model, field, normalize));
	if (normalize.length > 0 && inputEncoding !== "utf8" && process.env.NODE_ENV === "development" && model && field) console.warn(warnings.unsupportedNormalizeEncoding(model, field, inputEncoding));
	return {
		sourceField: match.groups.fieldName,
		targetField: field ?? match.groups.fieldName + "Hash",
		algorithm: query.get("algorithm") ?? "sha256",
		salt,
		inputEncoding,
		outputEncoding,
		normalize
	};
}
function isValidEncoding(encoding) {
	return [
		"hex",
		"base64",
		"utf8"
	].includes(encoding);
}
function isValidNormalizeOptions(options) {
	return options.every((option) => option in HashFieldNormalizeOptions);
}

//#endregion
//#region src/generator/generateIndex.ts
async function generateIndex({ concurrently, models, outputDir, modelNamePad, prismaClientModule }) {
	const contents = `// This file was generated by prisma-field-encryption.

import type { PrismaClient } from '${prismaClientModule}'
${Object.keys(models).map((modelName) => `import { migrate as migrate${modelName} } from './${modelName}'`).join("\n")}

export interface ProgressReport {
  model: string
  processed: number
  totalCount: number
  performance: number
}

export type ProgressReportCallback = (
  progress: ProgressReport
) => void | Promise<void>

export const defaultProgressReport: ProgressReportCallback = ({
  model,
  totalCount,
  processed,
  performance
}) => {
  const length = totalCount.toString().length
  const pct = Math.round((100 * processed) / totalCount)
    .toString()
    .padStart(3)
  console.info(
    \`\${model.padEnd(${modelNamePad})} \${pct}% processed \${processed
      .toString()
      .padStart(length)} / \${totalCount} (took \${performance.toFixed(2)}ms)\`
  )
}

// --

export type MigrationReport = {
${Object.keys(models).map((modelName) => `  ${modelName}: number`).join(",\n")}
}

/**
 * Migrate models ${concurrently ? "concurrently" : "sequentially"}.
 *
 * Processed models:
${Object.keys(models).map((modelName) => ` * - ${modelName}`).join("\n")}
 *
 * @returns a dictionary of the number of processed records per model.
 */
export async function migrate(
  client: PrismaClient,
  reportProgress: ProgressReportCallback = defaultProgressReport
): Promise<MigrationReport> {
${concurrently ? `  const [
${Object.keys(models).map((modelName) => `    processed${modelName}`).join(",\n")}
  ] = await Promise.all([
${Object.keys(models).map((modelName) => `    migrate${modelName}(client, reportProgress)`).join(",\n")}
  ])` : Object.keys(models).map((modelName) => `  const processed${modelName} = await migrate${modelName}(client, reportProgress)`).join("\n")}
  return {
${Object.keys(models).map((modelName) => `    ${modelName}: processed${modelName}`).join(",\n")}
  }
}
`;
	const outputPath = node_path.default.join(outputDir, "index.ts");
	return node_fs_promises.default.writeFile(outputPath, contents);
}

//#endregion
//#region src/generator/generateModel.ts
async function generateModel({ modelName, model, prismaClientModule, outputDir }) {
	const fields = Object.keys(model.fields);
	const interfaceName = modelName.slice(0, 1).toLowerCase() + modelName.slice(1);
	const content = `// This file was generated by prisma-field-encryption.

import type { PrismaClient, ${modelName} } from '${prismaClientModule}'
import {
  ProgressReportCallback,
  defaultProgressReport,
  visitRecords
} from 'prisma-field-encryption/dist/generator/runtime'

type Cursor = ${modelName}['${model.cursor}']

export async function migrate(
  client: PrismaClient,
  reportProgress: ProgressReportCallback = defaultProgressReport
): Promise<number> {
  return visitRecords<PrismaClient, Cursor>({
    modelName: '${modelName}',
    client,
    getTotalCount: client.${interfaceName}.count,
    migrateRecord,
    reportProgress,
  })
}

async function migrateRecord(client: PrismaClient, cursor: Cursor | undefined) {
  return await client.$transaction(async tx => {
    const record = await tx.${interfaceName}.findFirst({
      take: 1,
      skip: cursor === undefined ? undefined : 1,
      ...(cursor === undefined
        ? {}
        : {
            cursor: {
              ${model.cursor}: cursor
            }
          }),
      orderBy: {
        ${model.cursor}: 'asc'
      },
      select: {
        ${model.cursor}: true,
        ${fields.map((field) => `${field}: true`).join(",\n        ")}
      }
    })
    if (!record) {
      return cursor
    }
    await tx.${interfaceName}.update({
      where: {
        ${model.cursor}: record.${model.cursor}
      },
      data: {
        ${fields.map((field) => `${field}: record.${field}`).join(",\n        ")}
      }
    })
    return record.${model.cursor}
  })
}

/**
 * Internal model:
 * ${JSON.stringify(model, null, 2).split("\n").join("\n * ")}
 */
`;
	const outputPath = node_path.default.join(outputDir, `${modelName}.ts`);
	return node_fs_promises.default.writeFile(outputPath, content);
}

//#endregion
//#region src/generator/prismaModule.ts
function getPrismaClientModule(prismaClientOutput, outputDir) {
	const normalizedPrismaClientOutput = prismaClientOutput.replace(/\\/g, "/");
	let prismaClientModule;
	if (normalizedPrismaClientOutput.endsWith("node_modules/@prisma/client")) prismaClientModule = "@prisma/client";
	else prismaClientModule = path_posix.default.relative(outputDir, prismaClientOutput).replace(/\\/g, "/");
	return prismaClientModule;
}

//#endregion
//#region package.json
var require_package = /* @__PURE__ */ __commonJSMin(((exports, module) => {
	module.exports = {
		"name": "prisma-field-encryption",
		"version": "0.0.0-semantically-released",
		"description": "Transparent field-level encryption at rest for Prisma",
		"type": "commonjs",
		"main": "dist/index.js",
		"types": "dist/index.d.ts",
		"license": "MIT",
		"bin": { "prisma-field-encryption": "dist/generator/main.js" },
		"files": ["dist"],
		"author": {
			"name": "François Best",
			"email": "contact@francoisbest.com",
			"url": "https://francoisbest.com"
		},
		"repository": {
			"type": "git",
			"url": "git+https://github.com/47ng/prisma-field-encryption.git"
		},
		"keywords": [
			"prisma",
			"middleware",
			"encryption",
			"aes-256-gcm"
		],
		"publishConfig": { "access": "public" },
		"scripts": {
			"clean": "rm -rf ./dist ./coverage",
			"prebuild": "pnpm run generate:prisma",
			"build": "tsdown",
			"postbuild": "chmod +x ./dist/generator/main.js && cd node_modules/.bin && ln -sf ../../dist/generator/main.js ./prisma-field-encryption",
			"generate:prisma": "prisma generate",
			"test": "pnpm run --stream '/^test:/'",
			"test:types": "tsc --noEmit",
			"test:runtime": "vitest run",
			"ci": "pnpm run build && pnpm run test",
			"prepare": "husky",
			"migrate": "node ./src/tests/migrate.ts"
		},
		"packageManager": "pnpm@10.27.0",
		"dependencies": {
			"@47ng/cloak": "^1.2.0",
			"@47ng/codec": "^1.1.0",
			"@mrleebo/prisma-ast": "^0.13.0",
			"@prisma/adapter-better-sqlite3": "^7.4.0",
			"@prisma/generator-helper": "^7.4.0",
			"better-sqlite3": "^12.6.2",
			"debug": "^4.4.0",
			"immer": "^10.1.1",
			"object-path": "^0.11.8",
			"zod": "^3.24.0"
		},
		"peerDependencies": { "@prisma/client": ">= 7.0.0" },
		"devDependencies": {
			"@commitlint/config-conventional": "^19.8.1",
			"@prisma/client": "^7.0.0",
			"@prisma/internals": "^7.0.0",
			"@prisma/adapter-better-sqlite3": "^7.4.0",
			"@types/better-sqlite3": "^7.6.13",
			"@types/debug": "^4.1.12",
			"@types/node": "^22.15.33",
			"@types/object-path": "^0.11.4",
			"@vitest/coverage-v8": "^4.0.18",
			"better-sqlite3": "^12.6.2",
			"commitlint": "^19.8.1",
			"husky": "^9.1.7",
			"prisma": "^7.0.0",
			"semantic-release": "^25.0.2",
			"tsdown": "^0.20.1",
			"typescript": "^5.9.3",
			"vitest": "^4.0.18"
		},
		"prettier": {
			"arrowParens": "avoid",
			"semi": false,
			"singleQuote": true,
			"tabWidth": 2,
			"trailingComma": "none",
			"useTabs": false
		},
		"commitlint": {
			"extends": ["@commitlint/config-conventional"],
			"rules": {
				"type-enum": [
					2,
					"always",
					[
						"build",
						"chore",
						"ci",
						"clean",
						"doc",
						"feat",
						"fix",
						"perf",
						"ref",
						"revert",
						"style",
						"test"
					]
				],
				"subject-case": [
					0,
					"always",
					"sentence-case"
				],
				"body-leading-blank": [
					2,
					"always",
					true
				]
			}
		}
	};
}));

//#endregion
//#region src/generator/main.ts
(0, _prisma_generator_helper.generatorHandler)({
	onManifest() {
		return {
			prettyName: "field-level encryption migrations",
			version: require_package().version,
			requiresGenerators: ["prisma-client-js"],
			defaultOutput: "migrations"
		};
	},
	async onGenerate(options) {
		const models = analyseSchema(options.datamodel);
		const outputDir = options.generator.output?.value;
		const concurrently = options.generator.config?.concurrently === "true";
		const prismaClient = options.otherGenerators.find((each) => each.provider.value === "prisma-client-js");
		try {
			await node_fs_promises.default.mkdir(outputDir, { recursive: true });
		} catch {}
		const validModels = Object.fromEntries(Object.entries(models).filter(([, model]) => Object.keys(model.fields).length > 0 && Boolean(model.cursor)));
		const prismaClientModule = getPrismaClientModule(prismaClient.output?.value ?? "node_modules/@prisma/client", outputDir);
		const longestModelNameLength = Object.keys(validModels).reduce((max, model) => Math.max(max, model.length), 0);
		await Promise.all(Object.entries(validModels).map(([modelName, model]) => generateModel({
			modelName,
			model,
			outputDir,
			prismaClientModule
		})));
		await generateIndex({
			concurrently,
			models: validModels,
			outputDir,
			prismaClientModule,
			modelNamePad: longestModelNameLength
		});
	}
});

//#endregion