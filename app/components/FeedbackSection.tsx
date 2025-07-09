import React, { useState } from 'react';
import { Icon } from '@/app/components/icons';
import { Logger } from '@/app/lib/utils/logger';

const logger = Logger.getInstance().withContext({
  component: 'feedback-section'
});

interface FeedbackSectionProps {
    messageId: string;
    onFeedbackSubmit?: (messageId: string, type: 'like' | 'dislike', feedback?: string) => void;
}

const FeedbackSection: React.FC<FeedbackSectionProps> = ({ messageId, onFeedbackSubmit }) => {
    const [selectedFeedback, setSelectedFeedback] = useState<'like' | 'dislike' | null>(null);
    const [showFeedbackText, setShowFeedbackText] = useState(false);
    const [feedbackText, setFeedbackText] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleLike = () => {
        setSelectedFeedback('like');
        setShowFeedbackText(false);
        onFeedbackSubmit?.(messageId, 'like');
    };

    const handleDislike = () => {
        setSelectedFeedback('dislike');
        setShowFeedbackText(true);
    };

    const handleSubmitFeedback = async () => {
        if (!feedbackText.trim()) return;
        
        setIsSubmitting(true);
        try {
            await onFeedbackSubmit?.(messageId, 'dislike', feedbackText.trim());
            setShowFeedbackText(false);
            setFeedbackText('');
        } catch (error) {
            logger.error('Error submitting feedback', error, undefined, {
                messageId: messageId,
                feedbackType: 'dislike',
                hasFeedbackText: !!feedbackText.trim(),
                action: 'submit-negative-feedback'
            });
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleCancel = () => {
        setShowFeedbackText(false);
        setFeedbackText('');
        setSelectedFeedback(null);
    };

    return (
        <div className="mt-2 pt-2 border-t border-card-foreground/10">
            {!showFeedbackText ? (
                <div className="flex items-center justify-start space-x-2 rtl:space-x-reverse">
                    <span className="text-xs text-card-foreground/60">האם התשובה עזרה לך?</span>
                    <div className="flex space-x-1 rtl:space-x-reverse">
                        <button
                            onClick={handleLike}
                            disabled={selectedFeedback === 'like'}
                            className={`p-1 rounded transition-colors duration-150 ${
                                selectedFeedback === 'like' 
                                    ? 'bg-green-100 text-green-600' 
                                    : 'text-card-foreground/40 hover:text-card-foreground/70 hover:bg-card-foreground/5'
                            }`}
                        >
                            <Icon name="thumbsUp" className="w-3 h-3" />
                        </button>
                        <button
                            onClick={handleDislike}
                            disabled={selectedFeedback === 'dislike'}
                            className={`p-1 rounded transition-colors duration-150 ${
                                selectedFeedback === 'dislike' 
                                    ? 'bg-red-100 text-red-600' 
                                    : 'text-card-foreground/40 hover:text-card-foreground/70 hover:bg-card-foreground/5'
                            }`}
                        >
                            <Icon name="thumbsDown" className="w-3 h-3" />
                        </button>
                    </div>
                </div>
            ) : (
                <div className="space-y-2">
                    <div className="flex items-center space-x-1 rtl:space-x-reverse">
                        <Icon name="thumbsDown" className="w-3 h-3 text-red-500" />
                        <span className="text-xs text-card-foreground/80">איך נוכל לשפר את התשובה?</span>
                    </div>
                    <textarea
                        value={feedbackText}
                        onChange={(e) => setFeedbackText(e.target.value)}
                        placeholder="אנא שתף אותנו מה לא עבד טוב..."
                        className="w-full p-2 text-xs border border-card-foreground/20 rounded-lg resize-none focus:ring-1 focus:ring-accent/50 outline-none bg-background text-card-foreground min-h-[60px] max-h-[100px] scrollbar-thin scrollbar-thumb-muted"
                        rows={2}
                    />
                    <div className="flex justify-end space-x-2 rtl:space-x-reverse">
                        <button
                            onClick={handleCancel}
                            className="px-2 py-1 text-xs text-card-foreground/60 hover:text-card-foreground/80 transition-colors duration-150"
                        >
                            ביטול
                        </button>
                        <button
                            onClick={handleSubmitFeedback}
                            disabled={!feedbackText.trim() || isSubmitting}
                            className="px-2 py-1 text-xs bg-accent text-white rounded hover:bg-accent/90 transition-colors duration-150 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-1 rtl:space-x-reverse"
                        >
                            {isSubmitting ? (
                                <>
                                    <Icon name="loader2" className="w-3 h-3 animate-spin" />
                                    <span>שולח...</span>
                                </>
                            ) : (
                                <span>שלח</span>
                            )}
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default FeedbackSection;