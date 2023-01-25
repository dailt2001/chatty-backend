import { Request, Response } from 'express';
import HTTP_STATUS from 'http-status-codes';
import { ObjectId } from 'mongodb';
import { joiValidation } from '@global/decorators/joi-validation.decorators';
import { addReactionSchema } from '@reaction/schemes/reaction';
import { IReactionDocument, IReactionJob } from '@reaction/interfaces/reaction.interface';
import { ReactionCache } from '@service/redis/reaction.cache';
import { reactionQueue } from '@service/queues/reaction.queue';

const reactionCache: ReactionCache = new ReactionCache();

export class Add {
    @joiValidation(addReactionSchema)
    public async reaction(req: Request, res: Response): Promise<void> {
        const { userTo, postId, type, previousReaction, postReactions, profilePicture } = req.body;
        const reactionObject: IReactionDocument = {
            _id: new ObjectId(),
            type,
            postId,
            profilePicture,
            //userTo, // _id of user created Post
            avatarColor: req.currentUser!.avatarColor,
            username: req.currentUser!.username
        } as unknown as IReactionDocument;

        await reactionCache.savePostReactionToCache(postId, reactionObject, postReactions, type, previousReaction);

        const databaseReactionData: IReactionJob = {
            postId,
            userTo,
            userFrom: req.currentUser!.userId,
            username: req.currentUser!.username,
            type,
            previousReaction,
            reactionObject
        };
        reactionQueue.addReactionJob('addReactionToDB', databaseReactionData);

        res.status(HTTP_STATUS.OK).json({
            message: 'Save reaction to Cache successfully',
            reactionObject,
            postReactions
        });
    }
}
