const Router = require('koa-router');
const statusController = require('@controllers/statusController');
const authController = require('@controllers/authController');
const memberController = require('@controllers/memberController');
const childController = require('@controllers/childController');
const taskController = require('@controllers/taskController');
const rewardController = require('@controllers/rewardController');
const authenticationMiddleware = require('@middlewares/authenticationMiddleware');
const { validateInput } = require('@middlewares/inputValidationMiddleware');

/****
  Public
 ****/

const publicRouter = new Router();

publicRouter.get('/status', statusController.get);
publicRouter.post(
  '/authenticate',
  validateInput(authController.inputs.authenticate),
  authController.authenticate
);
publicRouter.post(
  '/member',
  validateInput(memberController.inputs.post),
  memberController.post
);

/****
 * Protected
 */

const authRouter = new Router();
authRouter.use(authenticationMiddleware.jwt);
authRouter.use(authenticationMiddleware.isAuthenticated);

/**
 * Authentication
 */
// authRouter.post('/revoke', authController.revoke);

/**
 * Member
 */
authRouter.get(
  '/member/:memberId',
  validateInput(memberController.inputs.get),
  memberController.get
);

/**
 * Child
 */
authRouter.get('/child', childController.getAll);
authRouter.get(
  '/child/:childId',
  validateInput(childController.inputs.get),
  childController.get
);
authRouter.post(
  '/child',
  validateInput(childController.inputs.post),
  childController.post
);

/**
 * Task
 */
authRouter.get('/task', taskController.getAll);
authRouter.get(
  '/task/:taskId',
  validateInput(taskController.inputs.get),
  taskController.get
);
authRouter.post(
  '/task',
  validateInput(taskController.inputs.post),
  taskController.post
);
authRouter.post(
  '/task/:taskId/complete',
  validateInput(taskController.inputs.complete),
  taskController.complete
);

/**
 * Reward
 */
authRouter.get('/reward', rewardController.getAll);
authRouter.get(
  '/reward/:rewardId',
  validateInput(rewardController.inputs.get),
  rewardController.get
);

authRouter.post(
  '/reward',
  validateInput(rewardController.inputs.post),
  rewardController.post
);
authRouter.post(
  '/reward/:rewardId/complete',
  validateInput(rewardController.inputs.complete),
  rewardController.complete
);


const router = new Router();
router.use('/api', publicRouter.routes());
router.use('/api', authRouter.routes());

module.exports = router.routes();
