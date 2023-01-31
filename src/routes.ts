import { authRoutes } from '@auth/routes/authRoutes';
import { currentUserRoutes } from '@auth/routes/currentUserRoutes';
import { commentRoutes } from '@comment/routes/commentRoutes';
import { authMiddleware } from '@global/helpers/auth-middleware';
import { imageRoutes } from '@image/routes/imageRoutes';
import { notificationRoutes } from '@notification/routes/notificationRoutes';
import { postRoutes } from '@post/routes/postRoutes';
import { reactionRoutes } from '@reaction/routes/reactionRoutes';
import { serverAdapter } from '@service/queues/base.queue';
import { Application } from 'express';
import { followerRoutes } from './features/follower/routes/followerRoutes';

const BASE_PATH = '/api/v1';

export default (app: Application) => {
    const routes = () => {
        app.use('/queues', serverAdapter.getRouter());
        app.use(BASE_PATH, authRoutes.routes());
        app.use(BASE_PATH, authRoutes.signoutRoute());


        app.use(BASE_PATH, authMiddleware.verifyUser, currentUserRoutes.routes());
        app.use(BASE_PATH, authMiddleware.verifyUser, postRoutes.routes());
        app.use(BASE_PATH, authMiddleware.verifyUser, reactionRoutes.routes());
        app.use(BASE_PATH, authMiddleware.verifyUser, commentRoutes.routes());
        app.use(BASE_PATH, authMiddleware.verifyUser, followerRoutes.routes());
        app.use(BASE_PATH, authMiddleware.verifyUser, notificationRoutes.routes());
        app.use(BASE_PATH, authMiddleware.verifyUser, imageRoutes.routes());
    };
    routes();
}; 