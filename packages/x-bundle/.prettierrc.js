module.exports = {
  trailingComma: "es5",
  tabWidth: 2,
  singleQuote: false,
  endOfLine: "auto",
  overrides: [
    {
      files: ["*.ts"],
      options: {
        parser: "babel-ts",
      },
    },
  ],
};
