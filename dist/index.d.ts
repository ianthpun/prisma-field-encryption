import * as _prisma_client_runtime_client0 from "@prisma/client/runtime/client";
import * as _prisma_client_extension0 from "@prisma/client/extension";

//#region src/types.d.ts
/**
 * Not ideal to use `any` on model & action, but Prisma's
 * strong typing there actually prevents using the correct
 * type without excessive generics wizardry.
 */
type MiddlewareParams<Models extends string, Actions extends string> = {
  model?: Models;
  action: Actions;
  args: any;
  dataPath: string[];
  runInTransaction: boolean;
};
type Middleware<Models extends string, Actions extends string, Result = any> = (params: MiddlewareParams<Models, Actions>, next: (params: MiddlewareParams<Models, Actions>) => Promise<Result>) => Promise<Result>;
interface Configuration {
  encryptionKey?: string;
  decryptionKeys?: string[];
  schemaPath?: string;
}
//#endregion
//#region src/extension.d.ts
declare function fieldEncryptionExtension<Models extends string = any, Actions extends string = any>(config?: Configuration): (client: any) => _prisma_client_extension0.PrismaClientExtends<_prisma_client_runtime_client0.InternalArgs<{}, {}, {}, {}>>;
//#endregion
//#region src/middleware.d.ts
declare function fieldEncryptionMiddleware<Models extends string = any, Actions extends string = any>(config?: Configuration): Middleware<Models, Actions>;
//#endregion
export { fieldEncryptionExtension, fieldEncryptionMiddleware };