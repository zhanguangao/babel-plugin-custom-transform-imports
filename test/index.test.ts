import { transform } from "@babel/core";
import { PluginState, getTransformLibraryName } from "../src/index";

function transformCode(code: string, opts: PluginState["opts"]) {
  const result = transform(code, {
    plugins: [["./lib/index.js", opts]],
  });
  return result?.code;
}

function testByOptions(desc: string, opts: PluginState["opts"]) {
  const libraryName = "react-bootstrap";
  const transformLibraryName = getTransformLibraryName(
    opts[libraryName]?.transform || libraryName
  );

  describe(desc, () => {
    test("test default imports", () => {
      expect(
        transformCode(`import Bootstrap from "${libraryName}";`, opts)
      ).toBe(`import Bootstrap from "${transformLibraryName}";`);
    });

    test("test namespace imports", () => {
      expect(
        transformCode(`import * as Bootstrap from "${libraryName}";`, opts)
      ).toBe(`import * as Bootstrap from "${transformLibraryName}";`);
    });

    test("test member imports", () => {
      expect(
        transformCode(`import { Grid, Row } from "${libraryName}";`, opts)
      ).toBe(
        `import Grid from "${transformLibraryName}/Grid";\nimport Row from "${transformLibraryName}/Row";`
      );
    });

    test("test named imports", () => {
      expect(
        transformCode(`import { Row as row } from "${libraryName}";`, opts)
      ).toBe(`import row from "${transformLibraryName}/Row";`);
    });

    test("test default imports and named imports", () => {
      expect(
        transformCode(
          `import Bootstrap, { Grid, Row as row } from "${libraryName}";`,
          opts
        )
      ).toBe(
        `import Bootstrap from "${transformLibraryName}";\nimport Grid from "${transformLibraryName}/Grid";\nimport row from "${transformLibraryName}/Row";`
      );
    });
  });
}

testByOptions("test react-bootstrap => react-bootstrap, transform is string", {
  "react-bootstrap": {
    transform: "react-bootstrap",
  },
});

testByOptions("test react-bootstrap => bootstrap, transform is string", {
  "react-bootstrap": {
    transform: "bootstrap",
  },
});

testByOptions(
  "test react-bootstrap => react-bootstrap, transform is function",
  {
    "react-bootstrap": {
      transform: (importName?: string) => {
        return importName ? `react-bootstrap/${importName}` : "react-bootstrap";
      },
    },
  }
);

testByOptions("test react-bootstrap => bootstrap, transform is function", {
  "react-bootstrap": {
    transform: (importName?: string) => {
      return importName ? `bootstrap/${importName}` : "bootstrap";
    },
  },
});

testByOptions(
  "test react-bootstrap => react-bootstrap, transform is undefined",
  {
    "react-bootstrap": {},
  }
);

describe("test tow library name", () => {
  const opts = {
    "react-bootstrap": {
      transform: "bootstrap",
    },
    lodash: {
      transform: "lodash-es",
    },
  };
  test("test default imports", () => {
    expect(
      transformCode(
        `import Bootstrap from "react-bootstrap";\nimport * as lodash from "lodash";`,
        opts
      )
    ).toBe(
      `import Bootstrap from "bootstrap";\nimport * as lodash from "lodash-es";`
    );
  });
  test("test member imports", () => {
    expect(
      transformCode(
        `import { Grid, Row } from "react-bootstrap";\nimport { get, pick } from "lodash";`,
        opts
      )
    ).toBe(
      `import Grid from "bootstrap/Grid";\nimport Row from "bootstrap/Row";\nimport get from "lodash-es/get";\nimport pick from "lodash-es/pick";`
    );
  });
});
