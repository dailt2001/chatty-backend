import { BaseCache } from './base.cache';
import Logger from 'bunyan';
import { config } from '@root/config';
import { ServerError } from '@global/helpers/error-handler';
import { Helpers } from '@global/helpers/helpers';
import { ICommentDocument, ICommentNameList } from '@comment/interfaces/comment.interface';
import { find } from 'lodash';

const log: Logger = config.createLogger('commentsCache');

export class CommentCache extends BaseCache {
    constructor() {
        super('commentsCache');
    }
    public async savePostCommentToCache(postId: string, value: string): Promise<void>{
        try {
            if (!this.client.isOpen) {
                await this.client.connect();
            }
            await this.client.LPUSH(`comments:${postId}`, value);// push comment to list
            const commentsCount: string[] = await this.client.HMGET(`posts:${postId}`, 'commentsCount'); 
            //get commentsCount in index 0
            let count: number = Helpers.parseJson(commentsCount[0]) as number;
            count += 1;
            //update comments count
            const dataToSave: string[] = ['commentsCount', `${count}`];
            await this.client.HSET(`posts:${postId}`, dataToSave);
        } catch (error) {
            log.error(error);
            throw new ServerError('Server error, try againnnn');
        }
    }

    public async getCommentFromCache(postId: string): Promise<ICommentDocument[]>{
        try {
            if (!this.client.isOpen) {
                await this.client.connect();
            }
            // lay data tu properties in List dung LRANGE
            const reply: string[] = await this.client.LRANGE(`comments:${postId}`, 0, -1);
            const list: ICommentDocument[] = [];
            for(const item of reply){
                list.push(Helpers.parseJson(item));
            }
            return list;
        } catch (error) {
            log.error(error);
            throw new ServerError('Server error, try againnnn');
        }
    }

    public async getCommentsNamesFromCache(postId: string): Promise<ICommentNameList[]>{
        //get names of all users comment post
        try {
            if (!this.client.isOpen) {
                await this.client.connect();
            }
            //length of List comment
            const commentsCount: number = await this.client.LLEN(`comments:${postId}`);
            const comments: string[] = await this.client.LRANGE(`comments:${postId}`, 0, -1);
            const list: string[] = [];
            for(const item of comments){
                const comment: ICommentDocument = Helpers.parseJson(item) as ICommentDocument;
                list.push(comment.username);
            }
            const response: ICommentNameList = {
                count: commentsCount,
                names: list
            }; 
            return [response];
        } catch (error) {
            log.error(error);
            throw new ServerError('Server error, try againnnn');
        }
    }

    public async getSingleCommentFromCache(postId: string, commentId: string): Promise<ICommentDocument[]>{
        //get single comment of a user => ICommmentDocument
        try {
            if (!this.client.isOpen) {
                await this.client.connect();
            }
            const comments: string[] = await this.client.LRANGE(`comments:${postId}`, 0, -1);
            const list: ICommentDocument[] = [];
            for(const item of comments){
                list.push(Helpers.parseJson(item));
            }
            const result: ICommentDocument = find(list, (item: ICommentDocument) => {
                return item._id === commentId;
            }) as ICommentDocument;
            return [result];
        } catch (error) {
            log.error(error);
            throw new ServerError('Server error, try againnnn');
        }
    }
}