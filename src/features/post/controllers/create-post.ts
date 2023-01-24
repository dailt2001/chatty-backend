import { joiValidation } from '@global/decorators/joi-validation.decorators';
import { uploads } from '@global/helpers/cloudinary-upload';
import { BadRequestError } from '@global/helpers/error-handler';
import { IPostDocument } from '@post/interfaces/post.interface';
import { postSchema, postWithImageSchema } from '@post/schemes/post.schemes';
import { postQueue } from '@service/queues/post.queue';
import { PostCache } from '@service/redis/post.cache';
import { socketIOPostObject } from '@socket/post.socket';
import { UploadApiResponse } from 'cloudinary';
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
        // before save data to redis and db
        socketIOPostObject.emit('ad post', createdPost);

        await postCache.savePostToCache({
            key: postObjectId,
            currentUserId: `${req.currentUser!.userId}`,
            uId: `${req.currentUser!.uId}`,
            createdPost
        });

        postQueue.addPostJob('savePostToDb',{
            key: req.currentUser!.userId,
            value: createdPost
        });

        res.status(HTTP_STATUS.CREATED).json({
            mes: 'Post created successfully'
        }); 
    }

    @joiValidation(postWithImageSchema)
    public async postWithImage(req: Request, res: Response): Promise<void> {
        const { post, bgColor, privacy, gifUrl, profilePicture, feelings, image } = req.body;

        const result: UploadApiResponse = await uploads(image) as UploadApiResponse;
        if(!result?.public_id){
            throw new BadRequestError(result.message);
        }

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
            imgVersion: result.version.toString(),
            imgId: result.public_id,
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
        // before save data to redis and db
        socketIOPostObject.emit('ad post', createdPost);

        await postCache.savePostToCache({
            key: postObjectId,
            currentUserId: `${req.currentUser!.userId}`,
            uId: `${req.currentUser!.uId}`,
            createdPost
        });

        postQueue.addPostJob('savePostToDb',{
            key: req.currentUser!.userId,
            value: createdPost
        });
        // call image queue to add image to mongodb database
        res.status(HTTP_STATUS.CREATED).json({
            mes: 'Post created with image successfully'
        }); 
    }
}
