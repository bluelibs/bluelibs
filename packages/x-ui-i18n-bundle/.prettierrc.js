module.exports = {
  trailingComma: "es5",
  tabWidth: 2,
  singleQuote: false,
  overrides: [
    {
      files: ["*.ts"],
      options: {
        parser: "babel-ts",
      },
    },
  ],
};
