import React from 'react';
import type { FormattedSegment } from '@/utils/messageFormatter';
import { MessageFormatter } from '@/utils/messageFormatter';
import type { ChatMessage as ChatMessageType } from '@/types/chat';

interface ChatMessageProps {
    message: ChatMessageType;
    className?: string;
}

const ChatMessage: React.FC<ChatMessageProps> = ({ message, className }) => {
    const segments = MessageFormatter.formatMessage(message.content);

    const renderSegment = (segment: FormattedSegment, index: number) => {
        switch (segment.type) {
            case 'text':
                return <span key={index}>{segment.content}</span>;
            case 'bold':
                return <strong key={index}>{segment.content}</strong>;
            case 'italic':
                return <em key={index}>{segment.content}</em>;
            case 'underline':
                return <u key={index}>{segment.content}</u>;
            case 'link':
                return (
                    <a
                        key={index}
                        href={segment.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-500 hover:text-blue-600 underline"
                    >
                        {segment.content}
                    </a>
                );
            case 'image':
                return (
                    <div key={index} className="max-w-full my-1">
                        <img
                            src={segment.url}
                            alt={segment.alt || 'Chat image'}
                            className="max-w-full h-auto rounded"
                            loading="lazy"
                        />
                    </div>
                );
            case 'video':
                return (
                    <div key={index} className="max-w-full my-1 aspect-video">
                        <iframe
                            src={segment.url}
                            title="YouTube video"
                            className="w-full h-full rounded"
                            allowFullScreen
                            loading="lazy"
                        />
                    </div>
                );
            default:
                return null;
        }
    };

    return (
        <div className={`px-4 py-2 hover:bg-gray-50 dark:hover:bg-gray-800 ${className}`}>
            <div className="flex items-start space-x-2">
                {/* Avatar placeholder - we'll implement this later */}
                <div className="w-8 h-8 rounded-full bg-gray-200 dark:bg-gray-700 flex-shrink-0" />
                
                <div className="flex-1 min-w-0">
                    <div className="flex items-baseline space-x-2">
                        <span className="font-medium text-sm text-gray-900 dark:text-gray-100">
                            {message.userId}
                        </span>
                        <span className="text-xs text-gray-500 dark:text-gray-400">
                            {new Date(message.createdAt).toLocaleTimeString()}
                        </span>
                    </div>
                    
                    <div className="mt-1 text-sm text-gray-800 dark:text-gray-200 break-words">
                        {segments.map((segment, index) => renderSegment(segment, index))}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ChatMessage;
