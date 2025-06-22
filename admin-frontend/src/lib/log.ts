export class Log {
    static _logMsg(...args: any[]) {
        if (typeof window !== "undefined" && window.console) {
            console.log(...args);
        }
    }
    static info(...args: any[]) {
        this._logMsg("INFO:", ...args);
    }
    static warn(...args: any[]) {
        this._logMsg("WARN:", ...args);
    }
    static error(...args: any[]) {
        this._logMsg("ERROR:", ...args);
    }
}