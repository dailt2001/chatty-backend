import { ICommentDocument, ICommentJob, ICommentNameList, IQueryComment } from '@comment/interfaces/comment.interface';
import { CommentsModel } from '@comment/models/comment.schema';
import { IPostDocument } from '@post/interfaces/post.interface';
import { PostModel } from '@post/models/post.schema';
import { UserCache } from '@service/redis/user.cache';
import { IUserDocument } from '@user/interfaces/user.interface';
import { Query } from 'mongoose';

const userCache: UserCache = new UserCache();
//fetch data from cache

class CommentService {
    public async addCommentToDB(commentData: ICommentJob): Promise<void> {
        const { postId, userTo, userFrom, username, comment } = commentData;
        const comments: Promise<ICommentDocument> = CommentsModel.create(comment);
        //update commentsCount
        const post: Query<IPostDocument, IPostDocument> = PostModel.findOneAndUpdate(
            { _id: postId },
            { $inc: { commentsCount: 1 } },
            { new: true }
        ) as Query<IPostDocument, IPostDocument>;
        const user: Promise<IUserDocument> = userCache.getUserFromCache(userTo) as Promise<IUserDocument>;
        const response: [ICommentDocument, IPostDocument, IUserDocument] = await Promise.all([comments, post, user]);
        //send comment notification
    }

    public async getPostComments(query: IQueryComment, sort: Record<string, 1 | -1>): Promise<ICommentDocument[]> {
        // get single/multiple comments for a post
        const comments: ICommentDocument[] = await CommentsModel.aggregate([{ $match: query }, { $sort: sort }]);
        return comments;
    }

    public async getPostCommentName(query: IQueryComment, sort: Record<string, 1 | -1>): Promise<ICommentNameList[]> {
        //get comment's name from the post in DB
        const commentNamesLists: ICommentNameList[] = await CommentsModel.aggregate([
            { $match: query },
            { $sort: sort },
            { $group: { _id: null, names: { $addToSet: '$username' }, count: { $sum: 1 } } },
            { $project: { _id: 0 } }
        ]);
        return commentNamesLists;
    }
}

export const commentService: CommentService = new CommentService();