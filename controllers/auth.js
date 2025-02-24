const dbFunctions = require("../utils/mongooseDbFunctions");
const userModel = require("../models/user");
const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken')

exports.register = async (req, res) => {
    if (!req?.body?.email || !req?.body?.password)
        res.status(400).json({ status: 'error', message: 'Missing params' })
    else {
        const salt = await bcrypt.genSalt(10);
        const hash = await bcrypt.hash(req?.body?.password, salt);
        const createResponse = await dbFunctions.insertOne(userModel, { ...req?.body, password: hash });

        if (createResponse?.status === 'error')
            res.status(500).json(createResponse)

        res.send({ email: createResponse?.email, _id: createResponse?._id?.toString() })
    }
}

exports.login = async (req, res) => {
    if (!req?.body?.email || !req?.body?.password)
        res.status(400).json({ status: 'error', message: 'Missing params' })
    else {
        const response = await dbFunctions.find(userModel, { email: req.body.email });
        if (response?.status === 'error')
            res.status(500).json({ message: response })

        if (response.length === 0)
            res.status(404).json({ message: "The user doesn't exist" })

        const isValid = await bcrypt.compare(req.body.password, response[0].password);
        if (!isValid)
            res.status(403).json({ message: "The user/password combination is incorrect" })

        const user = { email: response[0]?.email, _id: response[0]?._id?.toString() }
        const token = jwt.sign({ _id: user?._id, email: user?.email }, process.env.JWT_SECRET, { expiresIn: '24h' });

        res.send({ ...user, token })
    }
}