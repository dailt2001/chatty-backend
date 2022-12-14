import express, {Express} from 'express'
import { ChattyServer } from './setupServer'
import databaseConnection from './'

class Application{
    public initialize(): void{
        const app: Express = express()
        const server: ChattyServer = new ChattyServer(app)
        server.start()
    }
}
const application: Application = new Application()
application.initialize()