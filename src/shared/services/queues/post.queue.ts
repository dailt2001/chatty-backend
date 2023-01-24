import { IPostJobData } from '@post/interfaces/post.interface';
import { postWorker } from '@worker/post.woker';
import { BaseQueue } from './base.queue';

class PostQueue extends BaseQueue{
    constructor(){
        super('posts');
        this.processJob('savePostToDb', 5, postWorker.savePostToDb);
        this.processJob('deletePostFromDB', 5, postWorker.deletePostFromDB);
        this.processJob('updatePostInDB', 5, postWorker.updatePostInDB);
    }

    public addPostJob(name: string, data: IPostJobData): void{
        this.addJob(name, data);
    }
}

export const postQueue: PostQueue =  new PostQueue();