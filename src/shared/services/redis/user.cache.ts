import { IUserDocument } from '@user/interfaces/user.interface';
import { BaseCache } from './base.cache';
import Logger from 'bunyan';
import { config } from '@root/config';
import { ServerError } from '@global/helpers/error-handler';
import { Helpers } from '@global/helpers/helpers';

const log: Logger = config.createLogger('userCache');


export class UserCache extends BaseCache {
    constructor() {
        super('userCache');
    }
    public async saveUserToCache(key: string, userUId: string, createdUser: IUserDocument): Promise<void> {
        const createdAt = new Date();
        const {
            _id,
            uId,
            username,
            email,
            avatarColor,
            blocked,
            blockedBy,
            postsCount,
            profilePicture,
            followersCount,
            followingCount,
            notifications,
            work,
            location,
            school,
            quote,
            bgImageId,
            bgImageVersion,
            social
        } = createdUser;
        const firstList: string[] = [
            '_id',
            `${_id}`,
            'uId',
            `${uId}`,
            'username',
            `${username}`,
            'email',
            `${email}`,
            'avatarColor',
            `${avatarColor}`,
            'createdAt',
            `${createdAt}`,
            'postsCount',
            `${postsCount}`
        ]; //luu vao trong redis duoi dang JSON key value
        const secondList: string[] = [
            'blocked',
            JSON.stringify(blocked), // blocked la 1 array 
            'blockedBy',
            JSON.stringify(blockedBy),
            'profilePicture',
            `${profilePicture}`,
            'followersCount',
            `${followersCount}`,
            'followingCount',
            `${followingCount}`,
            'notifications',
            JSON.stringify(notifications),// noti la 1 object
            'social',
            JSON.stringify(social)
        ];
        const thirdLIst: string[] = [
            'work',
            `${work}`,
            'location',
            `${location}`,
            'school',
            `${school}`,
            'quote',
            `${quote}`,
            'bgImageVersion',
            `${bgImageVersion}`,
            'bgImageId',
            `${bgImageId}`
        ];
        const dataToSave: string[] = [...firstList, ...secondList, ...thirdLIst];
        
        try{
            if(!this.client.isOpen){// kiem tra xem da connection chua,neu chua thi tao connection 
                await this.client.connect();
            }
            //luu data hoac lay data
            await this.client.ZADD('user',{ score: parseInt(userUId, 10), value:`${key}`});
            await this.client.HSET(`users:${key}`, dataToSave); // vd: lay ra user1, user2 1,2 la key
        }catch(error){
            log.error(error);
            throw new ServerError('server error. try again!');
        }
    }

    public async getUserFromCache(userId: string): Promise<IUserDocument | null>{
        try{
            if(!this.client.isOpen){
                await this.client.connect();
            }

            const response: IUserDocument = await this.client.HGETALL(`users:${userId}`) as unknown as IUserDocument;
            response.createdAt = new Date(Helpers.parseJson(`${response.createdAt}`));
            response.postsCount = Helpers.parseJson(`${response.postsCount}`);
            response.blocked = Helpers.parseJson(`${response.blocked}`);
            response.blockedBy = Helpers.parseJson(`${response.blockedBy}`);
            // response.work = Helpers.parseJson(response.work);
            // response.school = Helpers.parseJson(response.school);
            // response.location = Helpers.parseJson(response.location);
            // response.quote = Helpers.parseJson(response.quote);
            response.notifications = Helpers.parseJson(`${response.notifications}`);
            response.social = Helpers.parseJson(`${response.social}`);
            response.followingCount = Helpers.parseJson(`${response.followingCount}`);
            response.followersCount = Helpers.parseJson(`${response.followersCount}`);

            return response;
        }catch(error){
            log.error(error);
            throw new ServerError('Error retrieve data server');
        }
    }
}
