import { NextFunction, Request, Response } from "express";
import fs from "fs";
import path from "path";

const Logger = (req: Request, res: Response, next: NextFunction) => {
    res.on('finish', () => {
        const date = new Date();
        const time = `${date.toLocaleDateString()} -- ${date.getHours()}:${date.getMinutes()}:${date.getSeconds()}`;
        const log = `${time} -- ${req.method} -- ${req.originalUrl} -- ${res.statusCode}`;
        
        console.log(log);

        const logDir = path.join(__dirname, "../../logs");
        const logFile = path.join(logDir, "log.txt");

        // Ensure logs directory exists
        if (!fs.existsSync(logDir)) {
            fs.mkdirSync(logDir, { recursive: true });
        }

        fs.appendFile(logFile, log + "\n", (err) => {
            if (err) {
                console.error("Error writing to log file:", err);
            }
        });
    });

    next();
};

export default Logger;
