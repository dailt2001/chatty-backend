import { Request, Response } from 'express';
import HTTP_STATUS from 'http-status-codes';
import { ObjectId } from 'mongodb';
import { joiValidation } from '@global/decorators/joi-validation.decorators';
import { CommentCache } from '@service/redis/comment.cache';
import { addCommentSchema } from '@comment/schemes/comment';
import { ICommentDocument, ICommentJob } from '@comment/interfaces/comment.interface';
import { commentQueue } from '@service/queues/comment.queue';

const commentCache: CommentCache = new CommentCache();

export class Add {
    @joiValidation(addCommentSchema)
    public async comment(req: Request, res: Response): Promise<void> {
        const { userTo, postId, profilePicture, comment } = req.body;
        const commentObjectId: ObjectId = new ObjectId();
        const commentData: ICommentDocument = {
            _id: commentObjectId,
            postId,
            profilePicture,
            username: `${req.currentUser!.username}`,
            avatarColor: `${req.currentUser!.avatarColor}`,
            userTo,
            comment,
            createdAt: new Date()
        } as ICommentDocument;

        await commentCache.savePostCommentToCache(postId, JSON.stringify(commentData));

        const databaseCommentData: ICommentJob = {
            postId,
            userTo,// id cua user tao Post
            userFrom: req.currentUser!.userId, // id cua user comment
            username: req.currentUser!.username,
            comment: commentData
          }; 

          commentQueue.addCommentJob('addCommentToDB', databaseCommentData);
        
        res.status(HTTP_STATUS.OK).json({ message: 'Comment created successfully' });
    }
}
