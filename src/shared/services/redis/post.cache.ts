import { BaseCache } from './base.cache';
import Logger from 'bunyan';
import { config } from '@root/config';
import { ServerError } from '@global/helpers/error-handler';
import { ISavePostToCache } from '@post/interfaces/post.interface';

const log: Logger = config.createLogger('postCache');

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
            if(!this.client.isOpen){
                await this.client.connect();
            }

            const postCount: string[] = await this.client.HMGET(`users:${currentUserId}`, 'postsCount');
            const multi: ReturnType<typeof this.client.multi> = this.client.multi(); //+ exec() or await this.client.ZADD/HSET...
            multi.ZADD('post', { score: parseInt(uId, 10), value: `${key}`});
            multi.HSET(`posts:${key}`, dataToSave);
            const count:number = parseInt(postCount[0], 10) + 1;//update post count
            multi.HSET(`users:${currentUserId}`, ['postsCount', count]); //List co key:postsCount value:count
            multi.exec();

        } catch (error) {
            log.error(error);
            throw new ServerError('Server error. Try againnnn!');
        }
    }
}
