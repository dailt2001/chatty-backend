import { userWorker } from '@worker/user.worker';
import { BaseQueue } from './base.queue';


class UserQueue extends BaseQueue{
    constructor(){
        super('user');// set the name of the queue
        this.processJob('addUserToDB',5, userWorker.addUserToDB);
    }
    public addUserJob(name: string, data: any): void { // khai bao IAuthJob tai BaseQueue
        this.addJob(name, data);
    }
}

export const userQueue: UserQueue = new UserQueue();