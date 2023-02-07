import { IFollowerJobData } from '@root/features/follower/interfaces/follower.interface';
import { followerWorker } from '@worker/follower.worker';
import { BaseQueue } from './base.queue';


class FollowerQueue extends BaseQueue{
    constructor(){
        super('follower');// set the name of the queue
        this.processJob('addFollowerUserToDB',5, followerWorker.addFollowerUserToDB);
        this.processJob('removeFollowerUserToDB',5, followerWorker.removeFollowerUserToDB);
    }
    public addFollowerJob(name: string, data: IFollowerJobData): void { // khai bao IFollowerJob tai BaseQueue
        this.addJob(name, data);
    }
}

export const followerQueue: FollowerQueue = new FollowerQueue();