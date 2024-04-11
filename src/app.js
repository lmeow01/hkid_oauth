const path = require("path");
const bodyParser = require("body-parser");
const express = require("express");
require("./db/mongoose");
const app = express();
const publicPath = path.join(__dirname, "../public");
const userRouter = require("./routes/user");
const projectRouter = require("./routes/project");
const OAuthRouter = require("./routes/oauth");

app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(
    express.static(publicPath, {
        extensions: ["html"],
    })
);

app.use(function (req, res, next) {
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Expose-Headers", "x-auth");
    res.setHeader("Access-Control-Allow-Methods", "GET, PUT, POST, DELETE");
    res.setHeader(
        "Access-Control-Allow-Headers",
        "Origin, X-Requested-With,content-type, Accept , x-auth"
    );

    next();
});

app.use("/api/users", userRouter);
app.use("/api/projects", projectRouter);
app.use("/api/oauth", OAuthRouter);
module.exports = app;
