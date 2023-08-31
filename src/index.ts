import type { types, PluginObj, PluginPass } from "@babel/core";
import type { Identifier, ImportDeclaration } from "@babel/types";

type BabelTypes = typeof types;

type API = { types: BabelTypes };

export type PluginOpts = {
  transform?: string | ((importName?: string) => string);
};

export type PluginState = Omit<PluginPass, "opts"> & {
  opts: Record<string, PluginOpts>;
};

export function getTransformLibraryName(
  transform: PluginOpts["transform"],
  importName?: string
) {
  if (typeof transform === "function") {
    return transform(importName);
  }

  return importName ? `${transform}/${importName}` : transform!;
}

export default function (api: API): PluginObj<PluginState> {
  const { types } = api;
  return {
    visitor: {
      ImportDeclaration(path, state) {
        const libraryName = Object.keys(state.opts)?.find((key) =>
          types.isStringLiteral(path.node.source, { value: key })
        );

        if (!libraryName) return;

        const transform = state.opts[libraryName]?.transform || libraryName;

        const fullImports: ImportDeclaration[] = [];
        const memberImports: ImportDeclaration[] = [];

        let isFullTransformed = false;

        path.node.specifiers.forEach((spec) => {
          // import { member } from 'module'; (ImportSpecifier)
          // import { member as alias } from 'module' (ImportSpecifier)
          if (types.isImportSpecifier(spec)) {
            const importName = (spec.imported as Identifier)?.name;
            const localName = spec.local?.name;
            const libName = getTransformLibraryName(transform, importName);
            memberImports.push(
              types.importDeclaration(
                [types.importDefaultSpecifier(types.identifier(localName))],
                types.stringLiteral(libName)
              )
            );
          } else {
            // import name from 'module'; (ImportDefaultSpecifier)
            // import * as name from 'module'; (ImportNamespaceSpecifier)
            // ImportDefaultSpecifier 和 ImportNamespaceSpecifier 没有 importName
            const libName = getTransformLibraryName(transform);
            // 全量导入只转换后面引入的库名称
            fullImports.push(
              types.importDeclaration([spec], types.stringLiteral(libName))
            );

            // 引入的库名称是否被转换过，相同表示转换过
            if (!isFullTransformed) {
              isFullTransformed = types.isStringLiteral(path.node.source, {
                value: libName,
              });
            }
          }
        });

        // 当有成员导入 或 全量导入未转换库名称
        if (memberImports.length > 0 || !isFullTransformed) {
          // replace imports
          path.replaceWithMultiple([...fullImports, ...memberImports]);
        }
      },
    },
  };
}
