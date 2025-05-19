import { Server } from 'http';
import { WebSocket, WebSocketServer } from 'ws';
import app from './app';
import { chatServices } from './app/modules/chat/chat.services';
import config from './config';
import { notificationServices } from './app/modules/notifications/notification.service';
import seedSuperAdmin from './app/DB';
import prisma from './app/helpers/prisma';
import { Message, SendMessage, ViewMessages } from './app/ws/websockettype';

interface ExtendedWebSocket extends WebSocket {
  roomId?: string;
  userId?: string;
}

const port = config.port || 9001;

async function main() {
  const server: Server = app.listen(port, () => {
    console.log('Server is running on🚀➡️ ', `http://localhost:${port}`);
  });

  await seedSuperAdmin();
  const activeUsers: Map<string, boolean> = new Map();

  const wss = new WebSocketServer({ server });

  wss.on('connection', (ws: ExtendedWebSocket) => {
    console.log('New client connected');

    ws.on('message', async (data: string) => {
      try {
        const parsedData: Message = JSON.parse(data);

        switch (parsedData.type) {
          case 'joinRoom':
            await handleJoinRoomMessage(ws, parsedData);
            break;
          case 'sendMessage':
            await handleSendMessage(ws, parsedData);
            break;
          case 'viewMessages':
            await handleViewMessages(ws, parsedData);
            break;
          default:
            console.log('Unknown message type:', parsedData);
        }
      } catch (error) {
        console.error('Error processing WebSocket message:', error);
      }
    });

    ws.on('close', () => {
      if (ws.userId) {
        activeUsers.set(ws.userId, false);
        console.log(`User ${ws.userId} is now inactive`);
      }
    });
  });

  async function handleJoinRoomMessage(
    ws: ExtendedWebSocket,
    data: JoinRoomMessage,
  ) {
    const { user1Id, user2Id } = data;

    ws.userId = user1Id;
    activeUsers.set(user1Id, true);

    console.log(`User ${user1Id} is now active`);

    const conversation = await chatServices.createConversationIntoDB(
      user1Id,
      user2Id,
    );
    ws.roomId = conversation.id;

    const unreadCount = await chatServices.countUnreadMessages(
      user1Id,
      ws.roomId,
    );
    const conversationWithMessages =
      await chatServices.getMessagesByConversationIntoDB(user1Id, user2Id);

    ws.send(
      JSON.stringify({
        type: 'loadMessages',
        conversation: conversationWithMessages,
        unreadCount,
      }),
    );
  }

  async function handleSendMessage(ws: ExtendedWebSocket, data: SendMessage) {
    const { chatroomId, senderId, receiverId, content } = data;

    const message = await chatServices.createMessageIntoDB(
      chatroomId,
      senderId,
      receiverId,
      content,
    );
    ws.send(JSON.stringify({ type: 'messageSent', message }));

    broadcastToRoomClients(chatroomId, { type: 'receiveMessage', message });

    const unreadCount = await chatServices.countUnreadMessages(
      receiverId,
      chatroomId,
    );
    sendUnreadCountToReceiver(receiverId, unreadCount);

    notifyReceiverIfInactive(receiverId, senderId);
  }

  async function handleViewMessages(ws: ExtendedWebSocket, data: ViewMessages) {
    const { chatroomId, userId } = data;

    await chatServices.getAllConversationMessages(userId, chatroomId, 1, 10);

    const unreadCount = await chatServices.countUnreadMessages(
      userId,
      chatroomId,
    );
    ws.send(JSON.stringify({ type: 'unreadCount', unreadCount }));
  }

  function broadcastToRoomClients(chatroomId: string, message: object) {
    wss.clients.forEach((client: ExtendedWebSocket) => {
      if (
        client.roomId === chatroomId &&
        client.readyState === WebSocket.OPEN
      ) {
        client.send(JSON.stringify(message));
      }
    });
  }

  async function sendUnreadCountToReceiver(
    receiverId: string,
    unreadCount: number,
  ) {
    wss.clients.forEach((client: ExtendedWebSocket) => {
      if (
        client.userId === receiverId &&
        client.readyState === WebSocket.OPEN
      ) {
        client.send(JSON.stringify({ type: 'unreadCount', unreadCount }));
      }
    });
  }

  async function notifyReceiverIfInactive(
    receiverId: string,
    senderId: string,
  ) {
    const isReceiverActive = Array.from(wss.clients).some(
      (client: ExtendedWebSocket) =>
        client.userId === receiverId && client.readyState === WebSocket.OPEN,
    );

    if (!isReceiverActive) {
      const senderProfile = await prisma.user.findUnique({
        where: { id: senderId },
        select: { email: true },
      });

      const notificationData = {
        title: 'New Message Received!',
        body: `${senderProfile?.email || 'Someone'} has sent you a new message.`,
      };

      try {
        await notificationServices.sendSingleNotification({
          params: { userId: receiverId },
          body: notificationData,
        });
      } catch (error) {
        console.error('Failed to send notification:', error);
      }
    }
  }
}

main();
