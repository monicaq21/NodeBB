"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.handle404 = exports.send404 = void 0;
const nconf = require("nconf");
const winston = require("winston");
const meta = require("../meta");
const plugins = require("../plugins");
const middleware = require("../middleware");
let helpers;
function send404(req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        res.status(404);
        const path = String(req.path || '');
        if (res.locals.isAPI) {
            return res.json({
                path: encodeURI(path.replace(/^\/api/, '')),
                title: '[[global:404.title]]',
                bodyClass: helpers.buildBodyClass(req, res),
            });
        }
        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
        yield middleware.buildHeaderAsync(req, res);
        res.render('404', {
            path: encodeURI(path),
            title: '[[global:404.title]]',
            bodyClass: helpers.buildBodyClass(req, res),
        });
    });
}
exports.send404 = send404;
function handle404(req, res) {
    const relativePath = String(nconf.get('relative_path'));
    const isClientScript = new RegExp(`^${relativePath}\\/assets\\/src\\/.+\\.js(\\?v=\\w+)?$`);
    if (plugins.hooks.hasListeners('action:meta.override404')) {
        return plugins.hooks.fire('action:meta.override404', {
            req: req,
            res: res,
            error: {},
        });
    }
    if (isClientScript.test(req.url)) {
        res.type('text/javascript').status(404).send('Not Found');
    }
    else if (!res.locals.isAPI && (req.path.startsWith(`${relativePath}/assets/uploads`) ||
        (req.get('accept') && !req.get('accept').includes('text/html')) ||
        req.path === '/favicon.ico')) {
        meta.errors.log404(req.path || '');
        res.sendStatus(404);
    }
    else if (req.accepts('html')) {
        if (process.env.NODE_ENV === 'development') {
            winston.warn(`Route requested but not found: ${req.url}`);
        }
        meta.errors.log404(req.path.replace(/^\/api/, '') || '');
        send404(req, res)
            .then(() => {
            // Handle success
            console.log('Success');
        })
            .catch((error) => {
            // Handle error
            console.log(error);
        });
    }
    else {
        res.status(404).type('txt').send('Not found');
    }
}
exports.handle404 = handle404;
