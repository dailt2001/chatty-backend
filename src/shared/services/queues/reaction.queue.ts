import { IReactionJob } from '@reaction/interfaces/reaction.interface';
import { reactionWorker } from '@worker/reaction.worker';
import { BaseQueue } from './base.queue';


class ReactionQueue extends BaseQueue{
    constructor(){
        super('reactions');
        this.processJob('addReactionToDB', 5, reactionWorker.addReactionToDB);
        this.processJob('removeReactionToDB', 5, reactionWorker.removeReactionToDB);
    }

    public addReactionJob(name: string, data: IReactionJob): void{
        this.addJob(name, data);
    }
}

export const reactionQueue: ReactionQueue = new ReactionQueue();