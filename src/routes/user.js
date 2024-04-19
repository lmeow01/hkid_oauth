const express = require("express");
const R = require("ramda");
const sgMail = require('@sendgrid/mail')
const { verifyAuthToken } = require("../middlewares/authenticate");
// const projectMiddleware = require("../middlewares/projectMiddleware");
const User = require("../models/user");

const router = new express.Router();

sgMail.setApiKey(process.env.SENDGRID_API_KEY)


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
    console.log(body)
    var user = await User.findByCredentials(body.email);
    var token = await user.generateAuthToken();
    sgMail.send({
      to: body.email,
      from: 'maple_pro@live.com',
      subject: 'Magic Link: User Authentication of HKID OAuth',
      text: `Login to your HKID OAuth account with this link: https://hkid-frontend.vercel.app/authorization?token=${token}&projectID=${body.projectID}&redirectUrl=${body.redirectURL}&scope=${body.scope}`,
    }).then((response) => {
      if (response[0].statusCode === 202) {
        res.status(200).send({"message": "Successfully generated and sent email!"});
      } else {
        res.status(400).send({ code: 400, message: response[0].body.errors[0].message  });
      }
    })  
    
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