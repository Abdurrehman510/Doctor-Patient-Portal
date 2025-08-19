const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const passport = require('passport');
const dotenv = require('dotenv');
const http = require('http');
const { Server } = require("socket.io");
const moment = require('moment');
const cron = require('node-cron');
const path = require('path');

// Routes
const authRoutes = require('./routes/auth');
const doctorRoutes = require('./routes/doctor');
const patientRoutes = require('./routes/patient');
const chatRoutes = require('./routes/chat');
const notificationRoutes = require('./routes/notifications');
const analysisRoutes = require('./routes/analysis');

// Models
const Message = require('./models/Message');
const User = require('./models/User');
const Appointment = require('./models/Appointment');
const Patient = require('./models/Patient');
const Notification = require('./models/Notification');


dotenv.config();
require('./config/passport');

const app = express();
const server = http.createServer(app);

const io = new Server(server, {
  cors: { origin: "http://localhost:5173", methods: ["GET", "POST"] }
});

const userSockets = {};

app.set('socketio', io);
app.set('userSockets', userSockets);

app.use(cors({ origin: 'http://localhost:5173', credentials: true }));
app.use(express.json());
app.use(passport.initialize());

app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

mongoose.connect(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => console.log('MongoDB connected'))
  .catch((err) => console.error('MongoDB connection error:', err));

app.use('/api/auth', authRoutes);
app.use('/api/doctor', doctorRoutes);
app.use('/api/patient', patientRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/notifications', notificationRoutes);
app.get('/api/health', (req, res) => res.json({ status: 'Server running' }));
app.use('/api/analysis', analysisRoutes);

io.on('connection', (socket) => {
  const userId = socket.handshake.query.userId;
  if (userId) userSockets[userId] = socket.id;

  socket.on('sendMessage', async (data) => {
    const { senderId, receiverId, message } = data;
    const newMessage = new Message({ senderId, receiverId, message, messageType: 'text' });
    await newMessage.save();
    
    const receiverSocketId = userSockets[receiverId];
    const senderSocketId = userSockets[senderId];

    if (receiverSocketId) {
      io.to(receiverSocketId).emit('receiveMessage', newMessage);
    }
    if (senderSocketId) {
        io.to(senderSocketId).emit('receiveMessage', newMessage);
    }
  });

    socket.on('editMessage', async (data) => {
        try {
            const { messageId, newContent, senderId, receiverId } = data;
            const message = await Message.findById(messageId);

            if (!message || message.senderId.toString() !== senderId) {
                return; // Unauthorized or message not found
            }

            message.message = newContent;
            message.isEdited = true;
            await message.save();

            const updatedMessage = message.toObject();

            const receiverSocketId = userSockets[receiverId];
            const senderSocketId = userSockets[senderId];

            if (receiverSocketId) {
                io.to(receiverSocketId).emit('messageEdited', { updatedMessage });
            }
            if (senderSocketId) {
                io.to(senderSocketId).emit('messageEdited', { updatedMessage });
            }
        } catch (error) {
            console.error("Error editing message:", error);
        }
    });

  socket.on('deleteMessage', async (data) => {
    try {
        const { messageId, senderId, receiverId } = data;
        const message = await Message.findById(messageId);

        if (!message || message.senderId.toString() !== senderId) {
            return;
        }
        
        const isRequest = ['appointment_request', 'appointment_counter', 'appointment_reschedule_request'].includes(message.messageType);
        if (isRequest && message.status === 'pending') {
            const cancellationMessage = new Message({
                senderId: senderId,
                receiverId: receiverId,
                message: 'An appointment request was cancelled.',
                messageType: 'appointment_response'
            });
            await cancellationMessage.save();
             const receiverSocketId = userSockets[receiverId];
             if(receiverSocketId) {
                io.to(receiverSocketId).emit('receiveMessage', cancellationMessage);
             }
        }

        await Message.findByIdAndDelete(messageId);

        const receiverSocketId = userSockets[receiverId];
        const senderSocketId = userSockets[senderId];
        const payload = { messageId };
        
        if (receiverSocketId) {
            io.to(receiverSocketId).emit('messageDeleted', payload);
        }
        if (senderSocketId) {
            io.to(senderSocketId).emit('messageDeleted', payload);
        }

    } catch (error) {
        console.error("Error deleting message:", error);
    }
  });


  socket.on('updateAppointmentRequest', async (data) => {
    const { messageId, status, senderId, receiverId } = data; // Added senderId and receiverId
    try {
        const requestMessage = await Message.findById(messageId);
        if (!requestMessage) return;

        requestMessage.status = status;
        await requestMessage.save();

        let responseMessageText = '';
        let responseMessageType = 'appointment_response';

        if (status === 'accepted') {
            let patientUserId, doctorUserId;

            // Determine who is the patient and who is the doctor
            if (requestMessage.messageType === 'appointment_counter') { // Doctor sent counter
                patientUserId = requestMessage.receiverId;
                doctorUserId = requestMessage.senderId;
            } else { // Patient sent request
                patientUserId = requestMessage.senderId;
                doctorUserId = requestMessage.receiverId;
            }
            
            if (requestMessage.messageType === 'appointment_reschedule_request' && requestMessage.appointmentId) {
                const appointment = await Appointment.findById(requestMessage.appointmentId);
                if (appointment) {
                    appointment.date = requestMessage.requestedDate;
                    await appointment.save();
                    responseMessageText = `Your reschedule request was approved. Your appointment is now at ${moment(requestMessage.requestedDate).format('lll')}.`;
                }
            } else if (['appointment_request', 'appointment_counter'].includes(requestMessage.messageType)) {
                 const patientDoc = await Patient.findOne({ userId: patientUserId });
                 if (patientDoc) {
                    const newAppointment = new Appointment({
                        doctorId: doctorUserId,
                        patientId: patientDoc._id,
                        date: requestMessage.requestedDate,
                        notes: `Booked via chat request on ${new Date().toLocaleDateString()}`
                    });
                    await newAppointment.save();
                    responseMessageText = `Your appointment for ${moment(requestMessage.requestedDate).format('lll')} has been CONFIRMED.`;
                }
            }
        } else {
             responseMessageText = `Your request for an appointment on ${moment(requestMessage.requestedDate).format('lll')} was denied.`;
        }

        const responseMessage = new Message({ 
            senderId: receiverId, 
            receiverId: senderId, 
            message: responseMessageText, 
            messageType: responseMessageType 
        });
        await responseMessage.save();

        const patientSocketId = userSockets[senderId];
        const doctorSocketId = userSockets[receiverId];

        if (patientSocketId) {
            io.to(patientSocketId).emit('requestUpdated', requestMessage);
            io.to(patientSocketId).emit('receiveMessage', responseMessage);
        }
        if (doctorSocketId) {
            io.to(doctorSocketId).emit('requestUpdated', requestMessage);
            io.to(doctorSocketId).emit('receiveMessage', responseMessage);
        }
    } catch (error) {
        console.error("Error updating appointment request:", error);
    }
  });

  socket.on('counterAppointmentRequest', async (data) => {
      const { originalMessageId, newDate, senderId, receiverId } = data;
      try {
          const originalRequest = await Message.findById(originalMessageId);
          if (originalRequest) {
              originalRequest.status = 'countered';
              await originalRequest.save();
          }

          const counterMessage = new Message({
              senderId, // Doctor
              receiverId, // Patient
              message: `The requested time is unavailable. A new time has been proposed.`,
              messageType: 'appointment_counter',
              requestedDate: newDate,
              status: 'pending'
          });
          await counterMessage.save();

          const patientSocketId = userSockets[receiverId];
          const doctorSocketId = userSockets[senderId];

          if (patientSocketId) {
              io.to(patientSocketId).emit('receiveMessage', counterMessage);
              if(originalRequest) io.to(patientSocketId).emit('requestUpdated', originalRequest);
          }
           if (doctorSocketId && originalRequest) {
              io.to(doctorSocketId).emit('requestUpdated', originalRequest);
           }
      } catch (error) {
          console.error("Error countering appointment request:", error);
      }
  });

  socket.on('disconnect', () => {
    for (let id in userSockets) {
      if (userSockets[id] === socket.id) {
        delete userSockets[id];
        break;
      }
    }
  });
});

// IMPROVED NOTIFICATION CRON JOB
cron.schedule('*/2 * * * *', async () => {
    try {
        const unreadMessages = await Message.find({ read: false, notified: false }).populate('senderId');
        
        const notificationsMap = new Map();

        // Group messages by receiver and sender
        for (const msg of unreadMessages) {
            const receiverId = msg.receiverId.toString();
            const senderId = msg.senderId._id.toString();
            const conversationKey = `${receiverId}-${senderId}`;

            if (!notificationsMap.has(conversationKey)) {
                notificationsMap.set(conversationKey, {
                    receiverId,
                    sender: msg.senderId,
                    count: 0,
                    messageIds: [],
                });
            }
            const notificationGroup = notificationsMap.get(conversationKey);
            notificationGroup.count++;
            notificationGroup.messageIds.push(msg._id);
        }

        // Create and send notifications
        for (const [key, group] of notificationsMap.entries()) {
            const notification = new Notification({
                userId: group.receiverId,
                title: `New message from ${group.sender.name}`,
                message: `You have ${group.count} new message${group.count > 1 ? 's' : ''}.`,
                link: group.sender.role === 'Doctor' ? `/patient` : `/doctor`,
            });
            await notification.save();

            const receiverSocketId = userSockets[group.receiverId];
            if (receiverSocketId) {
                io.to(receiverSocketId).emit('newNotification', notification);
            }
            
            // Mark messages as notified
            await Message.updateMany({ _id: { $in: group.messageIds } }, { $set: { notified: true } });
        }
    } catch (error) {
        console.error('Error in notification cron job:', error);
    }
});


app.use((err, req, res, next) => {
  console.error('Server error:', err.stack);
  res.status(500).json({ message: 'Internal server error' });
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => console.log(`Server running on port ${PORT}`));