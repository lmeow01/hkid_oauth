const express = require("express");
const R = require("ramda");

const { verifyAuthToken } = require("../middlewares/authenticate");
// const projectMiddleware = require("../middlewares/projectMiddleware");
const User = require("../models/user");

const router = new express.Router();

router.post("/register", async (req, res) => {
    const body = R.pick(["name", "hkid", "phone", "email", "password"], req.body)
    const user = new User(body)

    try {
        await user.save()
        const token = await user.generateAuthToken();
        return res.status(201).header("x-auth", token).send(R.pick(["name", "hkid"], user))
    } catch(e) {
        return res.status(400).send(e)
    }
})

router.route("/login").post(async function (req, res) {
  var body = R.pick(["email", "password"], req.body);
  try {
    var user = await User.findByCredentials(body.email, body.password);
    var token = await user.generateAuthToken();
    res.header("x-auth", token).send(R.pick(["name", "hkid"], user));
  } catch (e) {
    console.log(e);
    res.status(400).send({ code: 400, message: e });
  }
});


router.route("/logout").delete(verifyAuthToken, function (req, res) {
  req.user
    .removeToken(req.token)
    .then(function () {
      res.send({ message: "Logout Successfully" });
    })
    .catch(function (e) {
      console.log(e);
      res.status(400).send({ code: 400, message: e });
    });
});


module.exports = router;