/* eslint-disable @typescript-eslint/no-require-imports */
const { createServer } = require('http');
const { Server } = require('socket.io');
const next = require('next');

const dev = process.env.NODE_ENV !== 'production';
const hostname = process.env.HOSTNAME || '0.0.0.0';
// Render provides PORT environment variable
const port = parseInt(process.env.PORT || '3000', 10);

const app = next({ dev, hostname, port });
const handler = app.getRequestHandler();

// In-memory storage for concerns
const concerns = [];

const generateId = () => Math.random().toString(36).substr(2, 9);

// Philippines timezone (Asia/Manila - UTC+8)
const PH_TIMEZONE = 'Asia/Manila';

const formatDate = (date) => {
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    timeZone: PH_TIMEZONE
  });
};

const formatTime = (date) => {
  return date.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: true,
    timeZone: PH_TIMEZONE
  });
};

// Get current time in Philippines timezone
const getNowInPH = () => {
  const now = new Date();
  const phTimeStr = now.toLocaleString('en-US', { timeZone: PH_TIMEZONE });
  return new Date(phTimeStr);
};

app.prepare().then(() => {
  const httpServer = createServer(handler);
  
  const io = new Server(httpServer, {
    path: '/socket.io',
    cors: {
      origin: "*",
      methods: ["GET", "POST"]
    },
    pingTimeout: 60000,
    pingInterval: 25000,
    maxHttpBufferSize: 50e6,
    transports: ['websocket', 'polling'],
    allowEIO3: true
  });

  io.on('connection', (socket) => {
    console.log(`Client connected: ${socket.id}`);

    // Send existing concerns to newly connected client (admin)
    socket.emit('initial-concerns', { concerns: concerns.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime()) });

    // Send current counts
    const today = formatDate(new Date());
    socket.emit('counts', {
      todayCount: concerns.filter(c => c.dateSubmitted === today).length,
      totalCount: concerns.length,
      unreadCount: concerns.filter(c => c.status === 'Unread').length,
      pendingCount: concerns.filter(c => c.status === 'Pending').length,
      completedCount: concerns.filter(c => c.status === 'Completed').length,
    });

    // Handle new concern submission from visitor form
    socket.on('submit-concern', (data) => {
      const now = new Date();
      const nowPH = getNowInPH();
      const newConcern = {
        ...data,
        id: generateId(),
        dateSubmitted: formatDate(now),
        timeSubmitted: formatTime(now),
        status: 'Unread',
        createdAt: nowPH,
        attachments: data.attachments || []
      };

      concerns.push(newConcern);

      // Broadcast new concern to all connected clients (admins)
      io.emit('new-concern', { concern: newConcern });

      // Broadcast updated counts
      const todayDate = formatDate(new Date());
      io.emit('counts', {
        todayCount: concerns.filter(c => c.dateSubmitted === todayDate).length,
        totalCount: concerns.length,
        unreadCount: concerns.filter(c => c.status === 'Unread').length,
        pendingCount: concerns.filter(c => c.status === 'Pending').length,
        completedCount: concerns.filter(c => c.status === 'Completed').length,
      });

      console.log(`New concern submitted by ${newConcern.fullName} at ${newConcern.timeSubmitted} PH Time with ${newConcern.attachments.length} attachments`);
    });

    // Handle delete concern
    socket.on('delete-concern', (data) => {
      const index = concerns.findIndex(c => c.id === data.id);
      if (index !== -1) {
        concerns.splice(index, 1);
        io.emit('concern-deleted', { id: data.id });

        // Broadcast updated counts
        const todayDate = formatDate(new Date());
        io.emit('counts', {
          todayCount: concerns.filter(c => c.dateSubmitted === todayDate).length,
          totalCount: concerns.length,
          unreadCount: concerns.filter(c => c.status === 'Unread').length,
          pendingCount: concerns.filter(c => c.status === 'Pending').length,
          completedCount: concerns.filter(c => c.status === 'Completed').length,
        });

        console.log(`Concern ${data.id} deleted`);
      }
    });

    // Handle update concern status
    socket.on('update-status', (data) => {
      const concern = concerns.find(c => c.id === data.id);
      if (concern) {
        concern.status = data.status;
        io.emit('status-updated', { id: data.id, status: data.status });

        // Broadcast updated counts
        const todayDate = formatDate(new Date());
        io.emit('counts', {
          todayCount: concerns.filter(c => c.dateSubmitted === todayDate).length,
          totalCount: concerns.length,
          unreadCount: concerns.filter(c => c.status === 'Unread').length,
          pendingCount: concerns.filter(c => c.status === 'Pending').length,
          completedCount: concerns.filter(c => c.status === 'Completed').length,
        });

        console.log(`Concern ${data.id} status updated to ${data.status}`);
      }
    });

    // Handle mark as pending (when admin views details)
    socket.on('mark-pending', (data) => {
      const concern = concerns.find(c => c.id === data.id);
      if (concern && concern.status === 'Unread') {
        concern.status = 'Pending';
        io.emit('status-updated', { id: data.id, status: 'Pending' });

        // Broadcast updated counts
        const todayDate = formatDate(new Date());
        io.emit('counts', {
          todayCount: concerns.filter(c => c.dateSubmitted === todayDate).length,
          totalCount: concerns.length,
          unreadCount: concerns.filter(c => c.status === 'Unread').length,
          pendingCount: concerns.filter(c => c.status === 'Pending').length,
          completedCount: concerns.filter(c => c.status === 'Completed').length,
        });

        console.log(`Concern ${data.id} marked as Pending`);
      }
    });

    // Handle get counts request
    socket.on('get-counts', () => {
      const todayDate = formatDate(new Date());
      socket.emit('counts', {
        todayCount: concerns.filter(c => c.dateSubmitted === todayDate).length,
        totalCount: concerns.length,
        unreadCount: concerns.filter(c => c.status === 'Unread').length,
        pendingCount: concerns.filter(c => c.status === 'Pending').length,
        completedCount: concerns.filter(c => c.status === 'Completed').length,
      });
    });

    socket.on('disconnect', () => {
      console.log(`Client disconnected: ${socket.id}`);
    });

    socket.on('error', (error) => {
      console.error(`Socket error (${socket.id}):`, error);
    });
  });

  httpServer.listen(port, '0.0.0.0', () => {
    console.log(`> Ready on http://0.0.0.0:${port}`);
  });
});
