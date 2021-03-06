import * as Yup from 'yup';
import { startOfHour, parseISO, isBefore, format, subHours } from 'date-fns';
import pt from 'date-fns/locale/pt';
import Appointment from '../models/Appointment';
import User from '../models/User';
import File from '../models/File';
import Notification from '../schemas/Notification';
import Mail from '../../lib/Mail';

class AppointmentController {
  async index(req, res) {
    /**
     * List appoitnments formatted
     */
    const { page } = req.query;

    const appointments = await Appointment.findAll({
      where: { user_id: req.userId, canceled_at: null },
      order: ['date'],
      attributes: ['id', 'date'],
      limit: 20,
      offset: (page - 1) * 20,
      include: [
        {
          model: User,
          as: 'provider',
          attributes: ['id', 'name'],
          include: [
            {
              model: File,
              as: 'avatar',
              attributes: ['id', 'path', 'url'],
            },
          ],
        },
      ],
    });
    /** */

    return res.json(appointments);
  }

  async store(req, res) {
    /**
     * Check schema of req body is valid
     */
    const schema = Yup.object().shape({
      provider_id: Yup.number().required(),
      date: Yup.date().required(),
    });

    if (!(await schema.isValid(req.body))) {
      return res.status(400).json({ error: 'Validation fails' });
    }
    /** */

    /**
     * Check if an appointment is create to provider
     */
    const { provider_id, date } = req.body;

    const isProvider = await User.findOne({
      where: { id: provider_id, provider: true },
    });

    if (!isProvider) {
      return res
        .status(400)
        .json({ error: 'You can only create a appointment with providers' });
    }
    /** */

    /**
     * Check if an provider create a appointment to himself
     */
    if (req.userId === provider_id) {
      return res
        .status(400)
        .json({ error: 'Providers can not create a appointment to himself' });
    }
    /** */

    /**
     * Check for past dates
     */
    const hourStart = startOfHour(parseISO(date));

    if (isBefore(hourStart, new Date())) {
      return res.status(400).json({ error: 'Past dates are not permited' });
    }
    /** */

    /**
     * Check date availabity
     */
    const checkAvailabity = await Appointment.findOne({
      where: {
        provider_id,
        canceled_at: null,
        date: hourStart,
      },
    });

    if (checkAvailabity) {
      return res
        .status(400)
        .json({ error: 'Appointment date is not availabity' });
    }

    const appointment = await Appointment.create({
      user_id: req.userId,
      provider_id,
      date,
    });
    /** */

    /**
     * Notify appointement to provider
     */
    const user = await User.findByPk(req.userId);
    const formattedDate = format(
      hourStart,
      "'dia' dd 'de' MMMM', às' H:mm'h'",
      { locale: pt }
    );

    await Notification.create({
      content: `Novo agendamento de ${user.name} para ${formattedDate}`,
      user: provider_id,
    });
    /** */

    return res.json(appointment);
  }

  async delete(req, res) {
    const appointment = await Appointment.findByPk(req.params.id, {
      include: [
        {
          model: User,
          as: 'provider',
          attributes: ['name', 'email'],
        },
      ],
    });

    /**
     * Check user is a owner or provider of appointment
     */
    if (appointment.user_id !== req.userId) {
      return res.status(401).json({
        error: 'Only the owner user and provider can canceled this appointment',
      });
    }
    /** */

    /**
     * Check if the cancel is before 2 hours of appointment
     */
    const dateWithSub = subHours(appointment.date, 2);

    if (isBefore(dateWithSub, new Date())) {
      return res
        .status(401)
        .json({ error: 'You can only cancel the appointment 2 hours before' });
    }
    /** */

    /**
     * Atualize field in DB
     */
    appointment.canceled_at = new Date();

    await appointment.save();
    /** */

    /**
     * Send e-mail to provider
     */
    await Mail.sendMail({
      to: `${appointment.provider.name} <${appointment.provider.email}>`,
      subject: 'Agendamento cancelado',
      text: `Você possui um novo cancelamento. Compromisso de id: ${appointment.id}`,
    });
    /** */

    return res.json(appointment);
  }
}

export default new AppointmentController();
