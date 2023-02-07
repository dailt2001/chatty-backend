import { BaseCache } from './base.cache';
import Logger from 'bunyan';
import { config } from '@root/config';
import { ServerError } from '@global/helpers/error-handler';
import { IReactionDocument, IReactions } from '@reaction/interfaces/reaction.interface';
import { Helpers } from '@global/helpers/helpers';
import { find } from 'lodash';

const log: Logger = config.createLogger('reactionsCache');

export class ReactionCache extends BaseCache {
    constructor() {
        super('reactionsCache');
    }

    public async savePostReactionToCache(
        key: string,
        reaction: IReactionDocument,
        postReactions: IReactions,
        type: string,
        previousReaction: string
    ): Promise<void> {
        try {
            if (!this.client.isOpen) {
                await this.client.connect();
            }
            if (previousReaction) {
                // call remove reaction method
                this.removePostReactionFromCache(key, reaction.username, postReactions);
            }

            if (type) {
                // new Reaction
                await this.client.LPUSH(`reactions:${key}`, JSON.stringify(reaction)); //push data(1) into a list[4,5,6] = [1,4,5,6] RPUSH = [4,5,6,1]
                const dataToSave: string[] = ['reactions', JSON.stringify(postReactions)]; // data save to Post
                await this.client.HSET(`posts:${key}`, dataToSave); // update reactions field in post hash
            }
        } catch (error) {
            log.error(error);
            throw new ServerError('Server error, try againnnn');
        }
    }

    public async removePostReactionFromCache(key: string, username: string, postReactions: IReactions): Promise<void> {
        try {
            if (!this.client.isOpen) {
                await this.client.connect();
            }
            const response: string[] = await this.client.LRANGE(`reactions:${key}`, 0, -1);
            //response la 1 LIST chua cac Obj duoi dang string khi lay ra can Parse
            //LRANGE(key, start, end) // start:0, end:-1 get all data in List ,get 6: 0->5
            const multi: ReturnType<typeof this.client.multi> = this.client.multi();
            const userPreviousReaction: IReactionDocument = this.getPreviousReaction(response, username) as IReactionDocument;
            multi.LREM(`reactions:${key}`, 1, JSON.stringify(userPreviousReaction)); // remove Obj from a List
            await multi.exec();
            //Update after delete
            const dataToSave: string[] = ['reactions', JSON.stringify(postReactions)];
            await this.client.HSET(`posts:${key}`, dataToSave);
        } catch (error) {
            log.error(error);
            throw new ServerError('Server error, try againnnn');
        }
    }

    public async getReactionsFromCache(postId: string): Promise<[IReactionDocument[], number]> {
        try {
            if (!this.client.isOpen) {
                await this.client.connect();
            }
            const reactionsCount: number = await this.client.LLEN(`reactions:${postId}`); //length of the list
            const response: string[] = await this.client.LRANGE(`reactions:${postId}`, 0, -1);
            const list: IReactionDocument[] = [];
            for (const item of response) {
                list.push(Helpers.parseJson(item));
            }
            return response.length ? [list, reactionsCount] : [[], 0];
        } catch (error) {
            log.error(error);
            throw new ServerError('Server error. Try again.');
        }
    }

    public async getSingleReactionByUsernameFromCache(postId: string, username: string): Promise<[IReactionDocument, number] | []> {
        try {
            if (!this.client.isOpen) {
                await this.client.connect();
            }
            const response: string[] = await this.client.LRANGE(`reactions:${postId}`, 0, -1);
            const list: IReactionDocument[] = [];
            for (const item of response) {
                list.push(Helpers.parseJson(item));
            }
            const result: IReactionDocument = find(list, (listItem: IReactionDocument) => {
                return listItem?.postId === postId && listItem?.username === username;
            }) as IReactionDocument;

            return result ? [result, 1] : [];
        } catch (error) {
            log.error(error);
            throw new ServerError('Server error. Try again.');
        }
    }

    private getPreviousReaction(response: string[], username: string): IReactionDocument | undefined {
        const list: IReactionDocument[] = [];
        for (const item of response) {
            list.push(Helpers.parseJson(item) as IReactionDocument);
        }
        return find(list, (listItem: IReactionDocument) => {
            return listItem.username === username;
        });
    }
}
