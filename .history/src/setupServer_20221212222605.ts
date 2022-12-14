import { Application, json, urlencoded, Response, Request, NextFunction } from 'express';

export class ChattyServer {
    private app: Application;

    constructor(app: Application){
        this.app = app
    }

    public start(): void{}

    private security
}