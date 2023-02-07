import { IAuthJob } from '@auth/interfaces/auth.interface';
import { authWorker } from '@worker/auth.worker';
import { BaseQueue } from './base.queue';


class AuthQueue extends BaseQueue{
    constructor(){
        super('auth');// set the name of the queue
        this.processJob('addAuthUserToDB',5, authWorker.addAuthUserToDB);
    }
    public addAuthUserJob(name: string, data: IAuthJob): void { // khai bao IAuthJob tai BaseQueue
        this.addJob(name, data);
    }
}

export const authQueue: AuthQueue = new AuthQueue();