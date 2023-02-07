import { ICommentJob } from '@comment/interfaces/comment.interface';
import { commentWorker } from '@worker/comment.worker';
import { BaseQueue } from './base.queue';


class CommentQueue extends BaseQueue{
    constructor(){
        super('comments');// set the name of the queue
        this.processJob('addCommentToDB',5, commentWorker.addCommentToDB);
    }
    public addCommentJob(name: string, data: ICommentJob): void { // khai bao IAuthJob tai BaseQueue
        this.addJob(name, data);
    }
}

export const commentQueue: CommentQueue = new CommentQueue();