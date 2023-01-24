import { BaseCache } from './base.cache';
import Logger from 'bunyan';
import { config } from '@root/config';
import { ServerError } from '@global/helpers/error-handler';
import { IPostDocument, IReactions, ISavePostToCache } from '@post/interfaces/post.interface';
import { Helpers } from '@global/helpers/helpers';
import { RedisCommandRawReply } from '@redis/client/dist/lib/commands';

const log: Logger = config.createLogger('postCache');
export type PostCacheMultiType = string | number | Buffer | RedisCommandRawReply[] | IPostDocument | IPostDocument[];

export class PostCache extends BaseCache {
    constructor() {
        super('postCache');
    }

    public async savePostToCache(data: ISavePostToCache): Promise<void> {
        const { key, currentUserId, uId, createdPost } = data;
        const {
            _id,
            userId,
            username,
            email,
            avatarColor,
            profilePicture,
            post,
            bgColor,
            feelings,
            privacy,
            gifUrl,
            commentsCount,
            imgVersion,
            imgId,
            // videoId,
            // videoVersion,
            reactions,
            createdAt
        } = createdPost;

        const firstList: string[] = [
            '_id',
            `${_id}`,
            'userId',
            `${userId}`,
            'username',
            `${username}`,
            'email',
            `${email}`,
            'avatarColor',
            `${avatarColor}`,
            'profilePicture',
            `${profilePicture}`,
            'post',
            `${post}`,
            'bgColor',
            `${bgColor}`,
            'feelings',
            `${feelings}`,
            'privacy',
            `${privacy}`,
            'gifUrl',
            `${gifUrl}`
        ];

        const secondList: string[] = [
            'commentsCount',
            `${commentsCount}`,
            'reactions',
            JSON.stringify(reactions),
            'imgVersion',
            `${imgVersion}`,
            'imgId',
            `${imgId}`,
            // 'videoId',
            // `${videoId}`,
            // 'videoVersion',
            // `${videoVersion}`,
            'createdAt',
            `${createdAt}`
        ];

        const dataToSave: string[] = [...firstList, ...secondList];

        try {
            if (!this.client.isOpen) {
                await this.client.connect();
            }

            const postCount: string[] = await this.client.HMGET(`users:${currentUserId}`, 'postsCount');
            const multi: ReturnType<typeof this.client.multi> = this.client.multi(); //+ exec() or await this.client.ZADD/HSET...
            multi.ZADD('post', { score: parseInt(uId, 10), value: `${key}` });
            multi.HSET(`posts:${key}`, dataToSave);
            const count: number = parseInt(postCount[0], 10) + 1; //update post count
            multi.HSET(`users:${currentUserId}`, ['postsCount', count]); //List co key:postsCount value:count
            multi.exec();
        } catch (error) {
            log.error(error);
            throw new ServerError('Server error. Try againnnn!');
        }
    }

    public async getPostsFromCache(key: string, start: number, end: number): Promise<IPostDocument[]> {
        try {
            if (!this.client.isOpen) {
                await this.client.connect();
            }
            // lay nhieu value trong sorted set cho vao 1 list,,, key:name of SET
            const reply: string[] = await this.client.ZRANGE(key, start, end);//, { REV: true }
            const multi: ReturnType<typeof this.client.multi> = this.client.multi();
            for (const value of reply) {
                // lay thong tin user trong bang hash dua vao bai post
                multi.HGETALL(`posts:${value}`);
            }
            // replies chua postHash type IPostDocument
            const replies: PostCacheMultiType = (await multi.exec()) as PostCacheMultiType; // multi dc save khi goi exec
            const postReplies: IPostDocument[] = []; // replies chua list user
            for (const post of replies as IPostDocument[]) {
                post.commentsCount = Helpers.parseJson(`${post.commentsCount}`) as number;
                post.reactions = Helpers.parseJson(`${post.reactions}`) as IReactions;
                post.createdAt = new Date(Helpers.parseJson(`${post.createdAt}`)) as Date;
                postReplies.push(post);
            }
            return postReplies;
        } catch (error) {
            log.error(error);
            throw new ServerError('Server error. Try againnnn!');
        }
    }

    public async getTotalPostsFromCache(): Promise<number> {
        try {
            if (!this.client.isOpen) {
                await this.client.connect();
            }
            const count: number = await this.client.ZCARD('post');
            return count;
        } catch (error) {
            log.error(error);
            throw new ServerError('Server error. Try againnnn!');
        }
    }

    public async getPostsWithImageFromCache(key: string, start: number, end: number): Promise<IPostDocument[]> {
        try {
            if (!this.client.isOpen) {
                await this.client.connect();
            }
            // lay nhieu value trong sorted set cho vao 1 list
            const reply: string[] = await this.client.ZRANGE(key, start, end);//, { REV: true }
            const multi: ReturnType<typeof this.client.multi> = this.client.multi();
            for (const value of reply) {
                // lay thong tin user trong bang hash dua vao bai post
                multi.HGETALL(`posts:${value}`);
            }
            // replies chua postHash type IPostDocument
            const replies: PostCacheMultiType = (await multi.exec()) as PostCacheMultiType; // multi dc save khi goi exec
            const postWithImage: IPostDocument[] = []; // replies chua list user
            for (const post of replies as IPostDocument[]) {
                if ((post.imgId && post.imgVersion) || post.gifUrl) {
                    post.commentsCount = Helpers.parseJson(`${post.commentsCount}`) as number;
                    post.reactions = Helpers.parseJson(`${post.reactions}`) as IReactions;
                    post.createdAt = new Date(Helpers.parseJson(`${post.createdAt}`)) as Date;
                    postWithImage.push(post);
                }
            }
            return postWithImage;
        } catch (error) {
            log.error(error);
            throw new ServerError('Server error. Try againnnn!');
        }
    }

    public async getUserPostsFromCache(key: string, uId: number): Promise<IPostDocument[]> {
        try {
            if (!this.client.isOpen) {
                await this.client.connect();
            }
            // lay tat ca data lien quan den uId rieng biet
            const reply: string[] = await this.client.ZRANGE(key, uId, uId, { REV: true, BY: 'SCORE' });
            const multi: ReturnType<typeof this.client.multi> = this.client.multi();
            for (const value of reply) {
                // lay thong tin user trong bang hash dua vao bai post
                multi.HGETALL(`posts:${value}`);
            }
            // replies chua postHash type IPostDocument
            const replies: PostCacheMultiType = (await multi.exec()) as PostCacheMultiType; // multi dc save khi goi exec
            const postReplies: IPostDocument[] = []; // replies chua list user
            for (const post of replies as IPostDocument[]) {
                post.commentsCount = Helpers.parseJson(`${post.commentsCount}`) as number;
                post.reactions = Helpers.parseJson(`${post.reactions}`) as IReactions;
                post.createdAt = new Date(Helpers.parseJson(`${post.createdAt}`)) as Date;
                postReplies.push(post);
            }
            return postReplies;
        } catch (error) {
            log.error(error);
            throw new ServerError('Server error. Try againnnn!');
        }
    }

    public async getTotalUserPostsFromCache(uId: number): Promise<number> {
        try {
            if (!this.client.isOpen) {
                await this.client.connect();
            }
            const count: number = await this.client.ZCOUNT('post', uId, uId);
            return count;
        } catch (error) {
            log.error(error);
            throw new ServerError('Server error. Try againnnn!');
        }
    }

    public async deletePostFromCache(key: string, currentUserId: string): Promise<void> {
        try {
            if (!this.client.isOpen) {
                await this.client.connect();
            }
            const postCount: string[] = await this.client.HMGET(`users:${currentUserId}`, 'postsCount');
            const multi: ReturnType<typeof this.client.multi> = this.client.multi();
            multi.ZREM('post', `${key}`); // key la cot value trong post sorted set
            multi.DEL(`posts:${key}`); // delete post trong hash
            multi.DEL(`comments:${key}`); // delete comments trong hash
            multi.DEL(`reactions:${key}`); // delete reactions trong hash
            const count: number = parseInt(postCount[0], 10) - 1;
            multi.HSET(`users:${currentUserId}`, ['postsCount', count]);
            await multi.exec();
        } catch (error) {
            log.error(error);
            throw new ServerError('Server error. Try again.');
        }
    }

    public async updatePostInCache(key: string, updatedPost: IPostDocument): Promise<IPostDocument> {
        const { post, bgColor, feelings, privacy, gifUrl, imgVersion, imgId, profilePicture } = updatedPost;
        const firstList: string[] = [
            'post',
            `${post}`,
            'bgColor',
            `${bgColor}`,
            'feelings',
            `${feelings}`,
            'privacy',
            `${privacy}`,
            'gifUrl',
            `${gifUrl}`
            // 'videoId'
            //   `${videoId}`,
            //   'videoVersion',
            //   `${videoVersion}`
        ];
        const secondList: string[] = ['profilePicture', `${profilePicture}`, 'imgVersion', `${imgVersion}`, 'imgId', `${imgId}`];
        const dataToSave: string[] = [...firstList, ...secondList];

        try {
            if (!this.client.isOpen) {
                await this.client.connect();
            }
            await this.client.HSET(`posts:${key}`, dataToSave); // save update hash
            const multi: ReturnType<typeof this.client.multi> = this.client.multi();
            multi.HGETALL(`posts:${key}`);
            const reply: PostCacheMultiType = (await multi.exec()) as PostCacheMultiType;
            //reply chua tat ca thuoc tinh cua user lay tu bai post(HGETALL)
            const postReply = reply as IPostDocument[]; // document co index la 0
            postReply[0].commentsCount = Helpers.parseJson(`${postReply[0].commentsCount}`) as number;
            postReply[0].reactions = Helpers.parseJson(`${postReply[0].reactions}`) as IReactions;
            postReply[0].createdAt = new Date(Helpers.parseJson(`${postReply[0].createdAt}`)) as Date;

            return postReply[0];
        } catch (error) {
            log.error(error);
            throw new ServerError('Server error. Try again.');
        }
    }
}
