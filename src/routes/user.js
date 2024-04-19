const express = require("express");
const R = require("ramda");
const sgMail = require('@sendgrid/mail')
const nodemailer = require('nodemailer');
const { verifyAuthToken } = require("../middlewares/authenticate");
// const projectMiddleware = require("../middlewares/projectMiddleware");
const User = require("../models/user");
const router = new express.Router();
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: "hkidoauth@gmail.com",
    pass: process.env.GOOGLE_APP_PASSWORD
  },
});


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
  var body = R.pick(["email", "projectID", "redirectURL", "scope"], req.body);


  try {
    var user = await User.findByCredentials(body.email);
    var token = await user.generateAuthToken();

    const info = await transporter.sendMail({
      to: body.email,
      from: 'hkidoauth@gmail.com',
      subject: 'Magic Link: User Authentication of HKID OAuth',
      text: `Login to your HKID OAuth account with this link: \n https://hkid-frontend.vercel.app/authorization?token=${token}&projectID=${body.projectID}&redirectUrl=${body.redirectURL}&scope=${body.scope}`
    });

    return res.status(200).send({"message": "Successfully generated and sent email!"});

    
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