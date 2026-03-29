import { NextFunction, Request, Response } from "express"

const fs = require("fs")
const path = require("path")
// logger

const Logger = (req: Request, res: Response, next: NextFunction) => {
    const date = new Date()
    const time = date.toLocaleDateString() + " -- " + date.getHours() + ":" + date.getMinutes() + ":" + date.getSeconds()
    const log = `${time} --  ${req.method} -- ${req.originalUrl}  ${res.statusCode} `
    console.log(log)
    fs.appendFile(path.join(__dirname, "../", "logs", "log.txt"), log + "\n", (err: Error) => {
        if (err) {
            console.log(err)
        }
    })
    next()
}

export default Logger;