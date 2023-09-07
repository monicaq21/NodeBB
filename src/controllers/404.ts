import nconf = require('nconf');
import winston = require('winston');
import express = require('express');

import meta = require('../meta');
import plugins = require('../plugins');
import middleware = require('../middleware');

interface Helpers {
    buildBodyClass(req: express.Request, res: express.Response): string
}
let helpers: Helpers;

export async function send404(req: express.Request, res: express.Response) {
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
    await middleware.buildHeaderAsync(req, res);
    res.render('404', {
        path: encodeURI(path),
        title: '[[global:404.title]]',
        bodyClass: helpers.buildBodyClass(req, res),
    });
}

export function handle404(req: express.Request, res: express.Response) {
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
    } else if (
        !res.locals.isAPI && (
            req.path.startsWith(`${relativePath}/assets/uploads`) ||
            (req.get('accept') && !req.get('accept').includes('text/html')) ||
            req.path === '/favicon.ico'
        )
    ) {
        meta.errors.log404(req.path || '');
        res.sendStatus(404);
    } else if (req.accepts('html')) {
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
    } else {
        res.status(404).type('txt').send('Not found');
    }
}
