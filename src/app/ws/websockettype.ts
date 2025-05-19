interface JoinRoomMessage {
  type: 'joinRoom';
  user1Id: string;
  user2Id: string;
}

export interface SendMessage {
  type: 'sendMessage';
  chatroomId: string;
  senderId: string;
  receiverId: string;
  content: string;
}

export interface ViewMessages {
  type: 'viewMessages';
  chatroomId: string;
  userId: string;
}

export type Message = JoinRoomMessage | SendMessage | ViewMessages;
