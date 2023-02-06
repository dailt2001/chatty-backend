import { IUserJob } from '@user/interfaces/user.interface';
import { userWorker } from '@worker/user.worker';
import { BaseQueue } from './base.queue';


class UserQueue extends BaseQueue{
    constructor(){
        super('user');// set the name of the queue
        this.processJob('addUserToDB',5, userWorker.addUserToDB);
        this.processJob('updateSocialLinksInDB', 5, userWorker.updateSocialLinks);
        this.processJob('updateBasicInfoInDB', 5, userWorker.updateUserInfo);
        this.processJob('updateNotificationSettings', 5, userWorker.updateNotificationSettings);
    }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    public addUserJob(name: string, data: IUserJob): void { // khai bao IAuthJob tai BaseQueue
        this.addJob(name, data);
    }
}

export const userQueue: UserQueue = new UserQueue();