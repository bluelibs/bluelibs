/* eslint-disable @typescript-eslint/no-var-requires */
const path = require("path");
const HtmlWebpackPlugin = require("html-webpack-plugin");
const { CleanWebpackPlugin } = require("clean-webpack-plugin");
const ForkTsCheckerWebpackPlugin = require("fork-ts-checker-webpack-plugin");
const MiniCssExtractPlugin = require("mini-css-extract-plugin");
const CopyPlugin = require("copy-webpack-plugin");
const ESLintPlugin = require("eslint-webpack-plugin");
const Dotenv = require("dotenv-webpack");

module.exports = function (env) {
  return {
    entry: "./src/index.ts",
    mode: "development",
    devtool: "source-map",
    devServer: {
      historyApiFallback: {
        rewrites: [{ from: /^\/$/, to: "/index.html" }],
      },
    },
    optimization: {
      usedExports: true,
    },
    output: {
      publicPath: "/",
      filename: "[name].[contenthash].js",
      path: path.resolve(__dirname, "dist"),
    },
    module: {
      rules: [
        {
          test: /\.tsx?$/,
          exclude: /node_modules/,
          use: {
            loader: "ts-loader",
            options: {
              // disable type checker - we will use it in fork plugin
              transpileOnly: true,
            },
          },
        },
        {
          test: /\.(scss|css)$/,
          use: [
            process.env.NODE_ENV !== "production"
              ? "style-loader"
              : MiniCssExtractPlugin.loader,
            "css-loader",
            {
              loader: "sass-loader",
              options: {
                sourceMap: true,
              },
            },
          ],
        },
      ],
    },
    resolve: {
      extensions: [".tsx", ".ts", ".js"],
      alias: {
        "@bundles": path.resolve(__dirname, "src", "bundles"),
        "@root": path.resolve(__dirname, "src"),
      },
    },
    plugins: [
      new Dotenv({
        systemvars: true,
      }),
      new MiniCssExtractPlugin({
        // Options similar to the same options in webpackOptions.output
        // both options are optional
        filename: "[name].[contenthash].css",
        chunkFilename: "[id].css",
      }),
      new CleanWebpackPlugin(),
      new HtmlWebpackPlugin({
        template: "./src/index.html",
      }),
      new ForkTsCheckerWebpackPlugin(),
      new CopyPlugin({
        patterns: [{ from: "public", to: "public" }],
      }),
      new ESLintPlugin({
        extensions: [".tsx", ".ts", ".js", ".jsx"],
        exclude: "node_modules",
      }),
    ],
  };
};
