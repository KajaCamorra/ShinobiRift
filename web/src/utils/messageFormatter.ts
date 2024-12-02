interface FormattedSegment {
    type: 'text' | 'bold' | 'italic' | 'underline' | 'link' | 'image' | 'video';
    content: string;
    url?: string;
    alt?: string;
}

export class MessageFormatter {
    private static readonly PATTERNS = {
        BOLD: /\*\*(.*?)\*\*/g,
        ITALIC: /\*(.*?)\*/g,
        UNDERLINE: /__(.*?)__/g,
        LINK: /\[(.*?)\]\((https?:\/\/[^\s<>[\]()]+)\)/g,
        IMAGE: /!image\[\](https?:\/\/[^\s<>[\]()]+)/g,
        VIDEO: /!video\[\](https?:\/\/(?:www\.)?youtube\.com\/watch\?v=([a-zA-Z0-9_-]+))/g
    };

    private static readonly URL_REGEX = /^https?:\/\/[^\s<>[\]()]+$/;
    private static readonly ALLOWED_IMAGE_EXTENSIONS = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.mp4'];
    private static readonly MAX_IMAGE_SIZE = 5 * 1024 * 1024; // 5MB

    /**
     * Parses a message into segments that can be rendered
     */
    public static parseMessage(message: string): FormattedSegment[] {
        const segments: FormattedSegment[] = [];
        let remainingText = message;
        let lastIndex = 0;

        // Helper function to add plain text segment
        const addTextSegment = (text: string) => {
            if (text) {
                segments.push({ type: 'text', content: text });
            }
        };

        // Process each pattern
        while (lastIndex < remainingText.length) {
            let earliestMatch: { pattern: RegExp; type: string; index: number; match: RegExpExecArray } | null = null;

            // Find the earliest match among all patterns
            for (const [key, pattern] of Object.entries(MessageFormatter.PATTERNS)) {
                pattern.lastIndex = lastIndex;
                const match = pattern.exec(remainingText);
                if (match && (!earliestMatch || match.index < earliestMatch.index)) {
                    earliestMatch = {
                        pattern,
                        type: key.toLowerCase(),
                        index: match.index,
                        match
                    };
                }
            }

            if (!earliestMatch) {
                // No more patterns found, add remaining text
                addTextSegment(remainingText.slice(lastIndex));
                break;
            }

            // Add text before the match
            addTextSegment(remainingText.slice(lastIndex, earliestMatch.index));

            // Process the match based on its type
            switch (earliestMatch.type) {
                case 'bold':
                    segments.push({
                        type: 'bold',
                        content: earliestMatch.match[1]
                    });
                    break;
                case 'italic':
                    segments.push({
                        type: 'italic',
                        content: earliestMatch.match[1]
                    });
                    break;
                case 'underline':
                    segments.push({
                        type: 'underline',
                        content: earliestMatch.match[1]
                    });
                    break;
                case 'link':
                    if (this.isValidUrl(earliestMatch.match[2])) {
                        segments.push({
                            type: 'link',
                            content: earliestMatch.match[1],
                            url: earliestMatch.match[2]
                        });
                    } else {
                        addTextSegment(earliestMatch.match[0]);
                    }
                    break;
                case 'image':
                    if (this.isValidImageUrl(earliestMatch.match[1])) {
                        segments.push({
                            type: 'image',
                            content: '',
                            url: earliestMatch.match[1]
                        });
                    } else {
                        addTextSegment(earliestMatch.match[0]);
                    }
                    break;
                case 'video':
                    if (this.isValidYoutubeUrl(earliestMatch.match[1])) {
                        segments.push({
                            type: 'video',
                            content: '',
                            url: `https://www.youtube.com/embed/${earliestMatch.match[2]}`
                        });
                    } else {
                        addTextSegment(earliestMatch.match[0]);
                    }
                    break;
            }

            lastIndex = earliestMatch.index + earliestMatch.match[0].length;
        }

        return segments;
    }

    /**
     * Validates a URL string
     */
    private static isValidUrl(url: string): boolean {
        try {
            new URL(url);
            return MessageFormatter.URL_REGEX.test(url);
        } catch {
            return false;
        }
    }

    /**
     * Validates an image URL
     */
    private static isValidImageUrl(url: string): boolean {
        if (!this.isValidUrl(url)) return false;
        return MessageFormatter.ALLOWED_IMAGE_EXTENSIONS.some(ext => 
            url.toLowerCase().endsWith(ext)
        );
    }

    /**
     * Validates a YouTube URL
     */
    private static isValidYoutubeUrl(url: string): boolean {
        return this.isValidUrl(url) && url.includes('youtube.com/watch?v=');
    }

    /**
     * Sanitizes text content to prevent XSS
     */
    public static sanitizeText(text: string): string {
        return text
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#039;');
    }

    /**
     * Formats a message for display, returning an array of segments
     */
    public static formatMessage(message: string): FormattedSegment[] {
        // First sanitize the raw text
        const sanitizedMessage = this.sanitizeText(message);
        // Then parse the formatting
        return this.parseMessage(sanitizedMessage);
    }
}

export type { FormattedSegment };
