import User from '../models/User';
import Notification from '../schemas/Notification';

class NotificationController {
  async index(req, res) {
    /**
     * Check user is a provider
     */
    const userIsProvider = await User.findOne({
      where: { id: req.userId, provider: true },
    });

    if (!userIsProvider) {
      return res
        .status(401)
        .json({ error: 'Notifications can only read by provider' });
    }
    /** */

    /**
     * List provider Notifications
     */
    const notifications = await Notification.find({
      user: req.userId,
    })
      .sort({ createdAt: 'desc' })
      .limit(20);
    /** */

    return res.json(notifications);
  }

  async update(req, res) {
    /**
     * Check user is a provider
     */
    const userIsProvider = await User.findOne({
      where: { id: req.userId, provider: true },
    });

    if (!userIsProvider) {
      return res
        .status(401)
        .json({ error: 'Notifications can only update by provider' });
    }
    /** */

    /**
     * Mark notification as read
     */
    const notification = await Notification.findByIdAndUpdate(
      req.params.id,
      { read: true },
      { new: true }
    );

    return res.json(notification);
  }
}

export default new NotificationController();
