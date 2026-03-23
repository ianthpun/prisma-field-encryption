Object.defineProperty(exports, Symbol.toStringTag, { value: 'Module' });
//#region \0rolldown/runtime.js
var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
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
let _prisma_client_extension = require("@prisma/client/extension");
let debug = require("debug");
debug = __toESM(debug);
let _mrleebo_prisma_ast = require("@mrleebo/prisma-ast");
let _47ng_cloak = require("@47ng/cloak");
let immer = require("immer");
let object_path = require("object-path");
object_path = __toESM(object_path);
let _47ng_codec = require("@47ng/codec");
let node_crypto = require("node:crypto");
node_crypto = __toESM(node_crypto);

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
function analyseSchemaFile(schemaPath) {
	const fs = require("fs");
	require("path");
	if (fs.statSync(schemaPath).isDirectory()) return analyseSchemaDirectory(schemaPath);
	else return analyseSchema(fs.readFileSync(schemaPath, "utf8"));
}
function analyseSchemaDirectory(dirPath) {
	const fs = require("fs");
	const path = require("path");
	const schemaFiles = [];
	function findPrismaFiles(currentPath) {
		const items = fs.readdirSync(currentPath);
		for (const item of items) {
			const fullPath = path.join(currentPath, item);
			if (fs.statSync(fullPath).isDirectory()) findPrismaFiles(fullPath);
			else if (item.endsWith(".prisma")) schemaFiles.push(fullPath);
		}
	}
	findPrismaFiles(dirPath);
	if (schemaFiles.length === 0) throw new Error(`No .prisma files found in directory: ${dirPath}`);
	schemaFiles.sort();
	return analyseSchema(schemaFiles.map((filePath) => fs.readFileSync(filePath, "utf8")).join("\n\n"));
}
function resolveSchemaPath(schemaPath) {
	const path = require("path");
	if (schemaPath) return schemaPath;
	const fs = require("fs");
	const cwd = process.cwd();
	for (const configPath of [
		"prisma.config.ts",
		"prisma.config.js",
		".config/prisma.ts",
		".config/prisma.js"
	]) {
		const fullPath = path.join(cwd, configPath);
		if (fs.existsSync(fullPath)) try {
			const schemaMatch = fs.readFileSync(fullPath, "utf8").match(/schema:\s*['"]([^'"]+)['"]/);
			if (schemaMatch) return path.resolve(cwd, schemaMatch[1]);
		} catch (err) {}
	}
	const packageJsonPath = path.join(cwd, "package.json");
	if (fs.existsSync(packageJsonPath)) try {
		const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, "utf8"));
		if (packageJson.prisma?.schema) return path.resolve(cwd, packageJson.prisma.schema);
	} catch (err) {}
	const defaultPaths = [path.join(cwd, "prisma/schema.prisma"), path.join(cwd, "schema.prisma")];
	for (const defaultPath of defaultPaths) if (fs.existsSync(defaultPath)) return defaultPath;
	return "./prisma/schema.prisma";
}

//#endregion
//#region src/hash.ts
function hashString(input, config) {
	const decode = _47ng_codec.decoders[config.inputEncoding];
	const encode = _47ng_codec.encoders[config.outputEncoding];
	const data = decode(normalizeHashString(input, config.normalize));
	const hash = node_crypto.default.createHash(config.algorithm);
	hash.update(data);
	if (config.salt) hash.update(decode(config.salt));
	return encode(hash.digest());
}
function normalizeHashString(input, options = []) {
	let output = input;
	if (options.includes(HashFieldNormalizeOptions.lowercase)) output = output.toLowerCase();
	if (options.includes(HashFieldNormalizeOptions.uppercase)) output = output.toUpperCase();
	if (options.includes(HashFieldNormalizeOptions.trim)) output = output.trim();
	if (options.includes(HashFieldNormalizeOptions.spaces)) output = output.replace(/\s/g, "");
	if (options.includes(HashFieldNormalizeOptions.diacritics)) output = output.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
	return output;
}

//#endregion
//#region src/traverseTree.ts
/**
* Traverse a JSON object depth-first, in a `reduce` manner.
*
* @param input The root node to traverse
* @param callback A function to call on each visited node
* @param initialState Think of this as the last argument of `reduce`
*/
function traverseTree(input, callback, initialState) {
	const stack = [{
		path: [],
		type: typeOf(input),
		node: input,
		state: initialState
	}];
	while (stack.length > 0) {
		const { state, ...item } = stack.pop();
		const newState = callback(state, item);
		if (!isCollection(item.node)) continue;
		const children = Object.entries(item.node).map(([key, child]) => ({
			key,
			node: child,
			type: typeOf(child),
			path: [...item.path, key],
			state: newState
		}));
		for (let i = children.length - 1; i >= 0; --i) stack.push(children[i]);
	}
}
function isObject(item) {
	return typeof item === "object" && Object.prototype.toString.call(item) === "[object Object]";
}
function isCollection(item) {
	return Array.isArray(item) || isObject(item);
}
function typeOf(item) {
	if (Array.isArray(item)) return "array";
	if (isObject(item)) return "object";
	if (item === null) return "null";
	return typeof item;
}

//#endregion
//#region src/visitor.ts
const makeVisitor = (models, visitor, specialSubFields, debug) => function visitNode(state, { key, type, node, path }) {
	const model = models[state.currentModel];
	if (!model || !key) return state;
	if (type === "string" && key in model.fields) {
		const targetField = {
			field: key,
			model: state.currentModel,
			fieldConfig: model.fields[key],
			path: path.join("."),
			value: node
		};
		debug("Visiting %O", targetField);
		visitor(targetField);
		return state;
	}
	for (const specialSubField of specialSubFields) if (type === "object" && key in model.fields && typeof node?.[specialSubField] === "string") {
		const value = node[specialSubField];
		const targetField = {
			field: key,
			model: state.currentModel,
			fieldConfig: model.fields[key],
			path: [...path, specialSubField].join("."),
			value
		};
		debug("Visiting %O", targetField);
		visitor(targetField);
		return state;
	}
	if (["object", "array"].includes(type) && key in model.connections) {
		debug(`Changing model: following connection ${state.currentModel}.${key} to model ${model.connections[key].modelName}`);
		return { currentModel: model.connections[key].modelName };
	}
	return state;
};
function visitInputTargetFields(params, models, visitor) {
	traverseTree(params.args, makeVisitor(models, visitor, [
		"equals",
		"set",
		"not"
	], debug$1.encryption), { currentModel: params.model });
}
function visitOutputTargetFields(params, result, models, visitor) {
	traverseTree(result, makeVisitor(models, visitor, [], debug$1.decryption), { currentModel: params.model });
}

//#endregion
//#region src/encryption.ts
function configureKeys(config) {
	const encryptionKey = config.encryptionKey || process.env.PRISMA_FIELD_ENCRYPTION_KEY;
	if (!encryptionKey) throw new Error(errors.noEncryptionKey);
	const decryptionKeysFromEnv = (process.env.PRISMA_FIELD_DECRYPTION_KEYS ?? "").split(",").filter(Boolean);
	const keychain = (0, _47ng_cloak.makeKeychainSync)(Array.from(new Set([encryptionKey, ...config.decryptionKeys ?? decryptionKeysFromEnv])));
	return {
		encryptionKey: (0, _47ng_cloak.parseKeySync)(encryptionKey),
		keychain
	};
}
function encryptOnWrite(params, keys, models, operation) {
	debug$1.encryption("Clear-text input: %O", params);
	const encryptionErrors = [];
	const mutatedParams = (0, immer.produce)(params, (draft) => {
		visitInputTargetFields(draft, models, function encryptFieldValue({ fieldConfig, value: clearText, path, model, field }) {
			const hashedPath = rewriteHashedFieldPath(path, field, fieldConfig.hash?.targetField ?? field + "Hash");
			if (hashedPath) if (!fieldConfig.hash) console.warn(warnings.whereConnectClauseNoHash(operation, path));
			else {
				const hash = hashString(clearText, fieldConfig.hash);
				debug$1.encryption(`Swapping encrypted search of ${model}.${field} with hash search under ${fieldConfig.hash.targetField} (hash: ${hash})`);
				object_path.default.del(draft.args, path);
				object_path.default.set(draft.args, hashedPath, hash);
				return;
			}
			if (isOrderBy(path, field, clearText)) {
				console.error(errors.orderByUnsupported(model, field));
				debug$1.encryption(`Removing orderBy clause on ${model}.${field} at path \`${path}: ${clearText}\``);
				object_path.default.del(draft.args, path);
				return;
			}
			if (!fieldConfig.encrypt) return;
			try {
				const cipherText = (0, _47ng_cloak.encryptStringSync)(clearText, keys.encryptionKey);
				object_path.default.set(draft.args, path, cipherText);
				debug$1.encryption(`Encrypted ${model}.${field} at path \`${path}\``);
				if (fieldConfig.hash) {
					const hash = hashString(clearText, fieldConfig.hash);
					const hashPath = rewriteWritePath(path, field, fieldConfig.hash.targetField);
					object_path.default.set(draft.args, hashPath, hash);
					debug$1.encryption(`Added hash ${hash} of ${model}.${field} under ${fieldConfig.hash.targetField}`);
				}
			} catch (error) {
				encryptionErrors.push(errors.fieldEncryptionError(model, field, path, error));
			}
		});
	});
	if (encryptionErrors.length > 0) throw new Error(errors.encryptionErrorReport(operation, encryptionErrors));
	debug$1.encryption("Encrypted input: %O", mutatedParams);
	return mutatedParams;
}
function decryptOnRead(params, result, keys, models, operation) {
	const model = models[params.model];
	if (Object.keys(model.fields).length === 0 && !params.args?.include && !params.args?.select) {
		debug$1.decryption(`Skipping decryption: ${params.model} has no encrypted field and no connection was included`);
		return;
	}
	debug$1.decryption("Raw result from database: %O", result);
	const decryptionErrors = [];
	const fatalDecryptionErrors = [];
	visitOutputTargetFields(params, result, models, function decryptFieldValue({ fieldConfig, value: cipherText, path, model, field }) {
		try {
			if (!(0, _47ng_cloak.parseCloakedString)(cipherText)) return;
			const decryptionKey = (0, _47ng_cloak.findKeyForMessage)(cipherText, keys.keychain);
			const clearText = (0, _47ng_cloak.decryptStringSync)(cipherText, decryptionKey);
			object_path.default.set(result, path, clearText);
			debug$1.decryption(`Decrypted ${model}.${field} at path \`${path}\` using key fingerprint ${decryptionKey.fingerprint}`);
		} catch (error) {
			const message = errors.fieldDecryptionError(model, field, path, error);
			if (fieldConfig.strictDecryption) fatalDecryptionErrors.push(message);
			else decryptionErrors.push(message);
		}
	});
	if (decryptionErrors.length > 0) console.error(errors.decryptionErrorReport(operation, decryptionErrors));
	if (fatalDecryptionErrors.length > 0) throw new Error(errors.decryptionErrorReport(operation, fatalDecryptionErrors));
	debug$1.decryption("Decrypted result: %O", result);
}
function rewriteHashedFieldPath(path, field, hashField) {
	const items = path.split(".").reverse();
	if (items.includes("where") && items[1] === field && ["equals", "not"].includes(items[0])) {
		items[1] = hashField;
		return items.reverse().join(".");
	}
	for (const clause of [
		"where",
		"connect",
		"cursor"
	]) if (items.includes(clause) && items[0] === field) {
		items[0] = hashField;
		return items.reverse().join(".");
	}
	return null;
}
function rewriteWritePath(path, field, hashField) {
	const items = path.split(".").reverse();
	if (items[0] === field) items[0] = hashField;
	else if (items[0] === "set" && items[1] === field) items[1] = hashField;
	return items.reverse().join(".");
}
function isOrderBy(path, field, value) {
	const items = path.split(".").reverse();
	return items.includes("orderBy") && items[0] === field && ["asc", "desc"].includes(value.toLowerCase());
}

//#endregion
//#region src/extension.ts
function fieldEncryptionExtension(config = {}) {
	const keys = configureKeys(config);
	debug$1.setup("Keys: %O", keys);
	const schemaPath = resolveSchemaPath(config.schemaPath);
	debug$1.setup("Schema path: %s", schemaPath);
	const models = analyseSchemaFile(schemaPath);
	debug$1.setup("Models: %O", models);
	return _prisma_client_extension.Prisma.defineExtension({
		name: "prisma-field-encryption",
		query: { $allModels: { async $allOperations({ model, operation, args, query }) {
			if (!model) {
				debug$1.runtime("Unsupported operation %s (missing model): %O", operation, args);
				return await query(args);
			}
			const encryptedParams = encryptOnWrite({
				args,
				model,
				action: operation,
				dataPath: [],
				runInTransaction: false
			}, keys, models, operation);
			let result = await query(encryptedParams.args);
			decryptOnRead(encryptedParams, result, keys, models, operation);
			return result;
		} } }
	});
}

//#endregion
//#region src/middleware.ts
function fieldEncryptionMiddleware(config = {}) {
	const keys = configureKeys(config);
	debug$1.setup("Keys: %O", keys);
	const schemaPath = resolveSchemaPath(config.schemaPath);
	debug$1.setup("Schema path: %s", schemaPath);
	const models = analyseSchemaFile(schemaPath);
	debug$1.setup("Models: %O", models);
	return async function fieldEncryptionMiddleware(params, next) {
		if (!params.model) {
			debug$1.runtime("Unsupported operation (missing model): %O", params);
			return await next(params);
		}
		const operation = `${params.model}.${params.action}`;
		const encryptedParams = encryptOnWrite(params, keys, models, operation);
		let result = await next(encryptedParams);
		decryptOnRead(encryptedParams, result, keys, models, operation);
		return result;
	};
}

//#endregion
exports.fieldEncryptionExtension = fieldEncryptionExtension;
exports.fieldEncryptionMiddleware = fieldEncryptionMiddleware;