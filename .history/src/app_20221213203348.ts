import express, {Express} from 'express'
import { ChattyServer } from './setupServer'
import databaseConnection from './setupDatabase'
import 

class Application{
    public initialize(): void{
        databaseConnection()
        const app: Express = express()
        const server: ChattyServer = new ChattyServer(app)
        server.start()
    }

    private loadConfig(): void{

    }
}
const application: Application = new Application()
application.initialize()