/* eslint-disable */
// This is used for production start-up
const path = require("path");
const express = require("express");

var app = express();

app.use(express.static(path.join(process.cwd(), "dist")));

// If he tries to access other paths "/dummy", send him to index.html so client-side routing takes its toll
app.get("*", (req, res) => {
  res.sendFile(path.join(process.cwd(), "dist", "index.html"));
});

app.set("port", process.env.PORT || 8080);

var server = app.listen(app.get("port"), function () {
  console.log("Listening on port: ", server.address().port);
});
