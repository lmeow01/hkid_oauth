const express = require("express");
const R = require("ramda");
require("../models/user")

const projectMiddleware = require("../middlewares/projectMiddleware");
const {
  verifyAccessToken,
  verifyAuthToken,
  verifyOAuthCode,
  receiveCodeChallenge,
  verifyCodeChallenge
} = require("../middlewares/authenticate");

const router = express.Router();



router
  .route("/verifyproject")
  .get(projectMiddleware, async function (req, res) {
    res.send(R.pick(["name", "scope"], req.project));
  });
router
  .route("/code")
  .get(projectMiddleware, verifyAuthToken, receiveCodeChallenge, async function (req, res) {
    try {
      var code = await req.user.generateOAuthCode(req.project);
      redirectURL = `${req.query.redirectURL}?code=${code}`;
      return res.send({ redirectURL });
    } catch (e) {
      console.log(e);
      res.status(500).send({ message: "Unknown Error", code: 500 });
    }
  });
router
  .route("/token")
  .get(projectMiddleware, verifyOAuthCode, verifyCodeChallenge,async function (req, res) {
    if (req.project.projectSecret != req.query.projectSecret) {
      return res
        .status(400)
        .send({ code: 400, message: "Mismatch ProjectID and Secret" });
    }
    user = req.user;

    user
      .generateAccessToken(req.decoded.scope)
      .then((token) => {
        return user.removeToken(req.token).then((e) => {
          return token;
        });
      })
      .then((token) => {
        res.send({ access_token: token });
      })
      .catch((e) => {
        res
          .status(400)
          .send({ message: "Error while generating access token" });
      });
  });

const scopeMapping = {
  full: ["_id", "name","hkid", "email", "phone"],
  default: ["_id", "name", "hkid"],
  email: ["_id", "name", "email"],
  phone: ["_id", "name", "phone"],
};

router
  .route("/userinfo")
  .get(verifyAccessToken, async function (req, res) {
    token = req.decoded;
    user = req.user;
    res.send(R.pick(scopeMapping[token.scope], user));
  });

module.exports = router;