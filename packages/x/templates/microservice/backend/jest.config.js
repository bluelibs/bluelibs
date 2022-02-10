const tsconfig = require("./tsconfig.json");

const getModuleNameMapper = () => {
  const { paths } = tsconfig.compilerOptions

  return Object.keys(paths).reduce((mappedModuleNames, moduleName) => ({
    ...mappedModuleNames,

    [`${moduleName.slice(0, -1)}(.*)`]: `<rootDir>/${paths[moduleName][0].slice(0, -1)}/$1`
  }), {})
}

module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',

  moduleNameMapper: getModuleNameMapper()
};
