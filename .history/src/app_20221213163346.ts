import express, {Express} from 'express'
import { ChattyServer } from './setupServer'

class Application{
    public initialize(): void{
        const app: Express = express()
        const server: ChattyServer = new ChattyServer
    }
}