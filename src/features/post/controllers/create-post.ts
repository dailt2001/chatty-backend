import { joiValidation } from '@global/decorators/joi-validation.decorators';
import { IPostDocument } from '@post/interfaces/post.interface';
import { postSchema } from '@post/schemes/post.schemes';
import { PostCache } from '@service/redis/post.cache';
import { Request, Response } from 'express';
import HTTP_STATUS from 'http-status-codes';
import { ObjectId } from 'mongodb';

const postCache: PostCache = new PostCache();

export class Create {
    @joiValidation(postSchema)
    public async post(req: Request, res: Response): Promise<void> {
        const { post, bgColor, privacy, gifUrl, profilePicture, feelings } = req.body;
        const postObjectId: ObjectId = new ObjectId(); 
        const createdPost: IPostDocument = { //save to cache an database
            _id: postObjectId,
            userId: req.currentUser!.userId, // only login user can create post
            username: req.currentUser!.username,
            email: req.currentUser!.email,
            avatarColor: req.currentUser!.avatarColor,
            post,
            bgColor,
            privacy,
            gifUrl,
            profilePicture,
            feelings,
            commentsCount: 0,
            imgVersion: '',
            imgId: '',
            createdAt: new Date(),
            reactions: {
                like: 0,
                love: 0,
                happy: 0,
                wow: 0,
                sad: 0,
                angry: 0
            }
        } as IPostDocument;

        await postCache.savePostToCache({
            key: postObjectId,
            currentUserId: `${req.currentUser!.userId}`,
            uId: `${req.currentUser!.uId}`,
            createdPost
        });

        res.status(HTTP_STATUS.CREATED).json({
            mes: 'Post created successfully'
        }); 
    }
}
