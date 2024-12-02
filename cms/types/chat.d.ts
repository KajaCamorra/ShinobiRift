export interface ChatMessage {
    id?: string;
    channelId: string;
    userId: string;
    content: string;
    messageType: 'chat' | 'direct' | 'command' | 'system';
    createdAt: string;
    mentionedUserId?: string;
}

export interface UserPresence {
    channelId: string;
    userId: string;
    displayName: string;
}

export interface ServerToClientEvents {
    messageReceived: (message: ChatMessage) => void;
    recentMessages: (messages: ChatMessage[]) => void;
    userJoined: (data: UserPresence) => void;
    userLeft: (data: UserPresence) => void;
    error: (error: { message: string }) => void;
}

export interface ClientToServerEvents {
    joinChannel: (channelId: string) => void;
    leaveChannel: (channelId: string) => void;
    sendMessage: (message: ChatMessage) => void;
}

export interface InterServerEvents {
    ping: () => void;
}

export interface SocketData {
    user?: {
        id: string;
        displayName: string;
    };
}
