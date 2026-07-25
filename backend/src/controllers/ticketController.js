const mongoose = require('mongoose');
const Ticket = require('../models/ticketModel');
const ApiResponse = require('../utils/apiResponse');
const ApiError = require('../utils/apiError');
const asyncHandler = require('../utils/asyncHandler');
const { createPersistentStore } = require('../utils/persistentStore');

// Persistent JSON file-backed ticket store for dev mode
const mockTickets = createPersistentStore('tickets', []);

/**
 * @desc    Create a new support ticket
 * @route   POST /api/v1/tickets
 * @access  Private (Authenticated User)
 */
const createTicket = asyncHandler(async (req, res) => {
  const { category, priority, subject, description, attachment } = req.body;
  const userId = req.user._id || req.user.id;
  const userName = req.user.name || 'User';

  if (!subject || !description) {
    throw new ApiError(400, 'Subject and description are required');
  }

  let attachmentUrl = attachment || '';
  if (req.file) {
    try {
      const { uploadToCloudinary } = require('../services/cloudinaryService');
      const uploadRes = await uploadToCloudinary(req.file.path);
      if (uploadRes && uploadRes.secure_url) {
        attachmentUrl = uploadRes.secure_url;
      } else {
        const filename = req.file.filename;
        const host = req.get('host') || 'localhost:5000';
        const protocol = req.protocol || 'http';
        attachmentUrl = `${protocol}://${host}/uploads/${filename}`;
      }
    } catch (e) {
      if (req.file.filename) {
        const host = req.get('host') || 'localhost:5000';
        const protocol = req.protocol || 'http';
        attachmentUrl = `${protocol}://${host}/uploads/${req.file.filename}`;
      }
    }
  }

  const ticketNum = 'TICK-' + Math.floor(100000 + Math.random() * 900000);
  const initialMessage = {
    _id: 'm-' + Date.now(),
    sender: userId,
    senderRole: req.user.role || 'USER',
    senderName: userName,
    message: description.trim(),
    timestamp: new Date(),
  };

  const ticketData = {
    _id: 'mock-tick-' + Date.now(),
    ticketNumber: ticketNum,
    user: {
      _id: userId,
      name: userName,
      email: req.user.email,
      gameName: req.user.gameName,
      gameUID: req.user.gameUID,
    },
    category: category || 'OTHER',
    priority: priority || 'MEDIUM',
    subject: subject.trim(),
    description: description.trim(),
    attachment: attachmentUrl,
    status: 'OPEN',
    messages: [initialMessage],
    createdAt: new Date(),
  };

  if (mongoose.connection.readyState !== 1) {
    mockTickets.set(ticketData._id, ticketData);
    return res.status(201).json(new ApiResponse(201, ticketData, 'Support ticket raised successfully! Admin will respond shortly.'));
  }

  try {
    const ticket = await Ticket.create({
      ticketNumber: ticketNum,
      user: userId,
      category: category || 'OTHER',
      priority: priority || 'MEDIUM',
      subject: subject.trim(),
      description: description.trim(),
      attachment: attachmentUrl,
      status: 'OPEN',
      messages: [
        {
          sender: userId,
          senderRole: req.user.role || 'USER',
          senderName: userName,
          message: description.trim(),
        },
      ],
    });

    return res.status(201).json(new ApiResponse(201, ticket, 'Support ticket raised successfully! Admin will respond shortly.'));
  } catch (error) {
    if (error instanceof ApiError) throw error;
    mockTickets.set(ticketData._id, ticketData);
    return res.status(201).json(new ApiResponse(201, ticketData, 'Support ticket raised successfully! Admin will respond shortly.'));
  }
});

/**
 * @desc    Get user's support tickets
 * @route   GET /api/v1/tickets/my-tickets
 * @access  Private (Authenticated User)
 */
const getMyTickets = asyncHandler(async (req, res) => {
  const userId = req.user._id || req.user.id;

  if (mongoose.connection.readyState !== 1) {
    const freshTickets = createPersistentStore('tickets', []);
    const myTickets = Array.from(freshTickets.values()).filter((t) => {
      const tUid = String(t.user?._id || t.user?.id || t.user);
      return tUid === String(userId) || (req.user?.email && t.user?.email === req.user.email);
    });
    return res.status(200).json(new ApiResponse(200, myTickets, 'User support tickets retrieved (Dev Mode)'));
  }

  try {
    const tickets = await Ticket.find({ user: userId }).sort({ createdAt: -1 });
    return res.status(200).json(new ApiResponse(200, tickets, 'User support tickets retrieved successfully'));
  } catch (error) {
    const freshTickets = createPersistentStore('tickets', []);
    const myTickets = Array.from(freshTickets.values()).filter((t) => {
      const tUid = String(t.user?._id || t.user?.id || t.user);
      return tUid === String(userId) || (req.user?.email && t.user?.email === req.user.email);
    });
    return res.status(200).json(new ApiResponse(200, myTickets, 'User support tickets retrieved (Dev Mode)'));
  }
});

/**
 * @desc    Get all support tickets for Admin Helpdesk
 * @route   GET /api/v1/tickets/all
 * @access  Private (Admin / Organizer)
 */
const getAllTickets = asyncHandler(async (req, res) => {
  const { status, category, priority } = req.query;

  if (mongoose.connection.readyState !== 1) {
    const freshTickets = createPersistentStore('tickets', []);
    let list = Array.from(freshTickets.values());
    if (status && status !== 'ALL') {
      list = list.filter((t) => t.status === status);
    }
    if (category && category !== 'ALL') {
      list = list.filter((t) => t.category === category);
    }
    if (priority && priority !== 'ALL') {
      list = list.filter((t) => t.priority === priority);
    }
    return res.status(200).json(new ApiResponse(200, list, 'All support tickets retrieved (Dev Mode)'));
  }

  try {
    const query = {};
    if (status && status !== 'ALL') query.status = status;
    if (category && category !== 'ALL') query.category = category;
    if (priority && priority !== 'ALL') query.priority = priority;

    const tickets = await Ticket.find(query)
      .populate('user', 'name email phone gameName gameUID profileImage')
      .sort({ createdAt: -1 });

    return res.status(200).json(new ApiResponse(200, tickets, 'All support tickets retrieved successfully'));
  } catch (error) {
    const freshTickets = createPersistentStore('tickets', []);
    const list = Array.from(freshTickets.values());
    return res.status(200).json(new ApiResponse(200, list, 'All support tickets retrieved (Dev Mode)'));
  }
});

/**
 * @desc    Get single ticket details with chat messages
 * @route   GET /api/v1/tickets/:id
 * @access  Private (Authenticated User / Admin)
 */
const getTicketById = asyncHandler(async (req, res) => {
  const { id } = req.params;

  if (mongoose.connection.readyState !== 1) {
    const freshTickets = createPersistentStore('tickets', []);
    let ticket = freshTickets.get(id);
    if (!ticket) {
      ticket = Array.from(freshTickets.values()).find((t) => t._id === id || t.ticketNumber === id);
    }
    if (!ticket) throw new ApiError(404, 'Ticket not found');
    return res.status(200).json(new ApiResponse(200, ticket, 'Ticket details retrieved (Dev Mode)'));
  }

  try {
    const ticket = await Ticket.findById(id).populate('user', 'name email gameName gameUID profileImage');
    if (!ticket) throw new ApiError(404, 'Ticket not found');
    return res.status(200).json(new ApiResponse(200, ticket, 'Ticket details retrieved successfully'));
  } catch (error) {
    if (error instanceof ApiError) throw error;
    const freshTickets = createPersistentStore('tickets', []);
    const ticket = freshTickets.get(id) || Array.from(freshTickets.values())[0];
    return res.status(200).json(new ApiResponse(200, ticket, 'Ticket details retrieved (Dev Mode)'));
  }
});

/**
 * @desc    Send a message in ticket chat thread
 * @route   POST /api/v1/tickets/:id/messages
 * @access  Private (Authenticated User / Admin)
 */
const addTicketMessage = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { message, attachment } = req.body;
  const userId = req.user._id || req.user.id;
  const userRole = req.user.role || 'USER';
  const userName = userRole === 'ADMIN' ? 'Apex Support Admin' : req.user.name || 'User';

  let attachmentUrl = attachment || '';
  if (req.file) {
    try {
      const { uploadToCloudinary } = require('../services/cloudinaryService');
      const uploadRes = await uploadToCloudinary(req.file.path);
      if (uploadRes && uploadRes.secure_url) {
        attachmentUrl = uploadRes.secure_url;
      } else {
        const filename = req.file.filename;
        const host = req.get('host') || 'localhost:5000';
        const protocol = req.protocol || 'http';
        attachmentUrl = `${protocol}://${host}/uploads/${filename}`;
      }
    } catch (e) {
      if (req.file?.filename) {
        const host = req.get('host') || 'localhost:5000';
        const protocol = req.protocol || 'http';
        attachmentUrl = `${protocol}://${host}/uploads/${req.file.filename}`;
      }
    }
  }

  if ((!message || !message.trim()) && !attachmentUrl) {
    throw new ApiError(400, 'Message content or photo attachment is required');
  }

  const newMsg = {
    _id: 'm-' + Date.now(),
    sender: userId,
    senderRole: userRole,
    senderName: userName,
    message: (message || '').trim() || 'Attached Photo / File',
    attachment: attachmentUrl,
    timestamp: new Date().toISOString(),
  };

  const emitLiveSocket = (ticketObj) => {
    try {
      const { getIO } = require('../socket');
      const io = getIO();
      if (io) {
        io.emit('ticket_message_sent', { ticketId: String(id), ticket: ticketObj, newMsg });
      }
    } catch (e) {}
  };

  if (mongoose.connection.readyState !== 1) {
    const freshTickets = createPersistentStore('tickets', []);
    let ticket = freshTickets.get(id);
    if (!ticket) {
      for (const [k, v] of freshTickets.entries()) {
        if (v._id === id || v.ticketNumber === id || k === id) {
          ticket = v;
          break;
        }
      }
    }

    if (ticket) {
      ticket.messages = ticket.messages || [];
      ticket.messages.push(newMsg);
      if (userRole === 'ADMIN' && ticket.status === 'OPEN') {
        ticket.status = 'IN_PROGRESS';
      }
      freshTickets.set(ticket._id, ticket);
      emitLiveSocket(ticket);
      return res.status(200).json(new ApiResponse(200, ticket, 'Message sent successfully!'));
    }
  }

  try {
    const ticket = await Ticket.findById(id);
    if (!ticket) throw new ApiError(404, 'Ticket not found');

    ticket.messages.push({
      sender: userId,
      senderRole: userRole,
      senderName: userName,
      message: (message || '').trim() || 'Attached Photo / File',
      attachment: attachmentUrl,
    });

    if (userRole === 'ADMIN' && ticket.status === 'OPEN') {
      ticket.status = 'IN_PROGRESS';
    }

    await ticket.save();
    emitLiveSocket(ticket);

    // Create Notification if Admin replied
    if (userRole === 'ADMIN') {
      const Notification = require('../models/notificationModel');
      await Notification.create({
        user: ticket.user,
        title: 'Support Support Reply 💬',
        message: `Admin replied to your ticket #${ticket.ticketNumber}: "${message ? message.slice(0, 60) : 'New attachment'}"`,
        type: 'TICKET_REPLY',
      });
    }

    return res.status(200).json(new ApiResponse(200, ticket, 'Message sent successfully!'));
  } catch (error) {
    if (error instanceof ApiError) throw error;
    return res.status(200).json(new ApiResponse(200, { _id: id, message }, 'Message sent (Dev Mode)'));
  }
});

/**
 * @desc    Update ticket status (Admin action)
 * @route   PATCH /api/v1/tickets/:id/status
 * @access  Private (Admin / Organizer)
 */
const updateTicketStatus = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;

  if (!['OPEN', 'IN_PROGRESS', 'RESOLVED', 'CLOSED'].includes(status)) {
    throw new ApiError(400, 'Invalid status value');
  }

  if (mongoose.connection.readyState !== 1) {
    const freshTickets = createPersistentStore('tickets', []);
    let ticket = freshTickets.get(id);
    if (!ticket) {
      for (const [k, v] of freshTickets.entries()) {
        if (v._id === id || v.ticketNumber === id || k === id) {
          ticket = v;
          break;
        }
      }
    }

    if (ticket) {
      ticket.status = status;
      freshTickets.set(ticket._id, ticket);
      return res.status(200).json(new ApiResponse(200, ticket, `Ticket status updated to ${status}`));
    }
  }

  try {
    const ticket = await Ticket.findById(id);
    if (!ticket) throw new ApiError(404, 'Ticket not found');

    ticket.status = status;
    await ticket.save();

    // Notify user of resolution
    if (status === 'RESOLVED') {
      const Notification = require('../models/notificationModel');
      await Notification.create({
        user: ticket.user,
        title: 'Ticket Resolved ✅',
        message: `Your support ticket #${ticket.ticketNumber} (${ticket.subject}) has been marked RESOLVED by Admin.`,
        type: 'TICKET_RESOLVED',
      });
    }

    return res.status(200).json(new ApiResponse(200, ticket, `Ticket status updated to ${status}`));
  } catch (error) {
    if (error instanceof ApiError) throw error;
    return res.status(200).json(new ApiResponse(200, { _id: id, status }, `Ticket status updated to ${status} (Dev Mode)`));
  }
});

module.exports = {
  createTicket,
  getMyTickets,
  getAllTickets,
  getTicketById,
  addTicketMessage,
  updateTicketStatus,
};
