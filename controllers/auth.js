const dbFunctions = require("../utils/mongooseDbFunctions");
const userModel = require("../models/user");
const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken');
const { generateAccessToken } = require("../utils/common");

exports.register = async (req, res) => {
    if (!req?.body?.email || !req?.body?.password)
        return res.status(400).json({ status: 'error', message: 'Missing params' })
    else {
        const salt = await bcrypt.genSalt(10);
        const hash = await bcrypt.hash(req?.body?.password, salt);
        const createResponse = await dbFunctions.insertOne(userModel, { ...req?.body, password: hash });

        if (createResponse?.status === 'error')
            return res.status(500).json(createResponse)

        return res.send({ email: createResponse?.email, _id: createResponse?._id?.toString() })
    }
}

exports.login = async (req, res) => {
    try {
        if (!req?.body?.email || !req?.body?.password)
            return res.status(400).json({ status: 'error', message: 'Missing params' })
        else {
            const response = await dbFunctions.find(userModel, { email: req.body.email });
            if (response?.status === 'error')
                return res.status(500).json({ message: response })

            if (response.length === 0)
                return res.status(404).json({ message: "The user doesn't exist" })

            const isValid = await bcrypt.compare(req.body.password, response[0].password);
            if (!isValid)
                return res.status(403).json({ message: "The user/password combination is incorrect" })

            const user = { email: response[0]?.email, _id: response[0]?._id?.toString() }
            const token = generateAccessToken(user)

            return res.send({ ...user, token })
        }
    } catch (error) {
        console.error('Login error:', error);
        return res.status(500).json({ message: 'Internal server error' });
    }
}

exports.verifyOauthAccessToken = async (req, res) => {
    try {

        if (!req?.body?.provider || !req?.body?.user || !req?.body?.accessToken)
            return res.status(400).json({ code: 'missing-params', message: 'Missing params' })

        const url = req.body.provider === 'github' ?
            "https://api.github.com/user" :
            "https://www.googleapis.com/oauth2/v3/userinfo"

        const response = await fetch(url, {
            headers: { Authorization: `Bearer ${req.body.accessToken}` },
        });
        if (!response?.ok)
            return res.status(401).json({ code: 'invalid-token', message: 'Access denied' })

        const token = generateAccessToken(req.body.user)

        return res.send({ ...req.body.user, token })
    } catch (error) {
        console.error('***verifyOauthAccessToken error:', error);
        return res.status(500).json({ code: 'internal-server-error', message: 'Internal server error' });
    }
}