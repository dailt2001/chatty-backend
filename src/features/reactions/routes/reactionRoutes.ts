import express , { Router } from 'express';
import { authMiddleware } from '@global/helpers/auth-middleware';
import { Add } from '@reaction/controllers/add-reaction';
import { Remove } from '@reaction/controllers/remove-reaction';
import { Get } from '@reaction/controllers/get-reactions';

class ReactionRoutes{
    private router: Router;
    constructor(){
        this.router = express.Router();
    }

    public routes(): Router{
        this.router.post('/post/reaction', authMiddleware.checkAuthentication, Add.prototype.reaction);

        this.router.get('/post/reactions/:postId', authMiddleware.checkAuthentication, Get.prototype.reactions);
        this.router.get('/post/single/reaction/:username/:postId', authMiddleware.checkAuthentication, Get.prototype.singleReactionByUserName);
        this.router.get('/post/reaction/:username', authMiddleware.checkAuthentication, Get.prototype.reactionsByUsername);

        this.router.delete('/post/reaction/:postId/:previousReaction/:postReactions', authMiddleware.checkAuthentication, Remove.prototype.reaction);
        return this.router;
    }
}

export const reactionRoutes = new ReactionRoutes();