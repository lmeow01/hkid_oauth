const mongoose = require("mongoose");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");

var Schema = mongoose.Schema;

var UserSchema = new Schema({
    name: {
        type: String,
        required: true,
        trim: true,
    },
    hkid: {
        type: String,
        required: true,
        trim: true,
    },
    email: {
        type: String,
        required: true,
        unique: true,
        trim: true,
    },
    phone: {
        type: Number,
        required: true,
        unique: true,
        trim: true,
    },
    password: {
        type: String,
        minlength: 6,
    },
    createdAt: {
        type: Date,
        default: Date.now,
    },
    tokens: [
        {
            access: {
                type: String,
                required: true,
            },
            token: {
                type: String,
                required: true,
            },
        },
    ],
});

// This is to hide the important attributes of user if user object is sent inside the response
UserSchema.methods.toJSON = function () {
    const user = this;
    const userObject = user.toObject();

    delete userObject.password;
    delete userObject.tokens;

    return userObject;
};

UserSchema.methods.generateAuthToken = function () {
    var user = this;
    var access = "auth";
    var token = jwt
        .sign({ _id: user._id.toHexString(), access }, process.env.JWT_SECRET)
        .toString();
    user.tokens.push({ access, token });
    return user.save().then(function () {
        return token;
    });
};
/*
 * This function will be used later in the article in step 3 while generating
 * Authorization Code. You can ignore it for now.
 */
UserSchema.methods.generateOAuthCode = async function (project) {
    var user = this;
    var access = "auth_code";
    var token = jwt
        .sign(
            {
                access,
                _id: user._id.toHexString(),
                projectID: project.projectID,
                projectSecret: project.projectSecret,
                scope: project.scope,
            },
            process.env.JWT_SECRET
        )
        .toString();
    user.tokens.push({ access, token });
    await user.save()
    return token;
};
/*
 * This function will be used later in the article in step 3 while exchanging access_token
 * for Authorization Code. You can ignore it for now.
 */
UserSchema.methods.generateAccessToken = function (scope) {
    var user = this;
    var access = "access_token";
    var token = jwt
        .sign(
            { _id: user._id.toHexString(), access, scope },
            process.env.JWT_SECRET
        )
        .toString();
    user.tokens.push({ access, token });
    return user.save().then(function () {
        return token;
    });
};

UserSchema.statics.findByToken = async function (token, access) {
    var User = this;
    var decoded;

    try {
        decoded = jwt.verify(token, process.env.JWT_SECRET);
    } catch (e) {
        return Promise.reject({ code: 401, message: "Invalid Code" });
    }
    user = await User.findOne({
        _id: decoded._id,
        "tokens.token": token,
        "tokens.access": access,
    });
    return {
        decoded,
        user,
    };
};

UserSchema.statics.findByCredentials = function (email) {
    var User = this;
    return User.findOne({ email }).then(function (user) {
        if (!user) {
            return Promise.reject({
                code: 400,
                message: "Invalid Credentials",
            });
        }
        return new Promise(function (resolve, reject) {
            resolve(user);
        });
    });
};

UserSchema.pre("save", function (next) {
    var user = this;
    if (user.isModified("password")) {
        bcrypt.genSalt(10, function (err, salt) {
            bcrypt.hash(user.password, salt, function (err, hash) {
                user.password = hash;
                next();
            });
        });
    } else {
        next();
    }
});

UserSchema.methods.removeToken = function (token) {
    var user = this;
    return user.updateOne({
        $pull: {
            tokens: { token },
        },
    });
};

module.exports = mongoose.model("User", UserSchema);
