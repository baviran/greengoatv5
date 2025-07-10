import React, { useEffect, useState, useCallback } from 'react';
import { Logger } from '@/app/lib/utils/logger';
import { useAppAuth, useAppSelector, appActions } from '@/app/lib/store/appStore';

// Define component props
interface ComponentTemplateProps {
  title?: string;
  onAction?: (data: any) => void;
  className?: string;
}

// Template for React components
export const ComponentTemplate: React.FC<ComponentTemplateProps> = ({
  title = 'Component Template',
  onAction,
  className = ''
}) => {
  // Logging setup
  const logger = Logger.getInstance();
  const { user } = useAppAuth();
  
  // State management
  const [localState, setLocalState] = useState<string>('');
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  
  // Store selectors
  const isLoading = useAppSelector(store => store.loading.isLoading('component-template'));
  const theme = useAppSelector(store => store.theme.theme);
  
  // Component did mount
  useEffect(() => {
    logger.info('Component mounted', {
      component: 'component-template',
      action: 'mount',
      userId: user?.uid
    });
    
    // Cleanup function
    return () => {
      logger.info('Component unmounted', {
        component: 'component-template',
        action: 'unmount',
        userId: user?.uid
      });
    };
  }, [logger, user?.uid]);
  
  // User interaction handlers
  const handleSubmit = useCallback(async (event: React.FormEvent) => {
    event.preventDefault();
    
    if (!user) {
      logger.warn('User not authenticated', {
        component: 'component-template',
        action: 'submit-attempt-no-auth'
      });
      return;
    }
    
    logger.info('Form submission started', {
      component: 'component-template',
      action: 'submit-form',
      userId: user.uid,
      hasData: !!localState
    });
    
    setIsProcessing(true);
    appActions.setLoading('component-template', true);
    
    try {
      // Business logic
      const result = await processFormData(localState);
      
      logger.info('Form submission successful', {
        component: 'component-template',
        action: 'submit-success',
        userId: user.uid,
        resultId: result.id
      });
      
      // Call parent callback if provided
      if (onAction) {
        onAction(result);
      }
      
      // Show success message
      appActions.showSuccess('Success', 'Form submitted successfully');
      
      // Reset form
      setLocalState('');
      
    } catch (error) {
      logger.error('Form submission failed', error, {
        component: 'component-template',
        action: 'submit-failed',
        userId: user.uid
      });
      
      appActions.showError('Error', 'Failed to submit form');
    } finally {
      setIsProcessing(false);
      appActions.setLoading('component-template', false);
    }
  }, [localState, user, onAction, logger]);
  
  const handleInputChange = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const value = event.target.value;
    setLocalState(value);
    
    // Only log significant changes to avoid spam
    if (value.length % 10 === 0) {
      logger.debug('Input changed', {
        component: 'component-template',
        action: 'input-change',
        userId: user?.uid,
        inputLength: value.length
      });
    }
  }, [logger, user?.uid]);
  
  const handleButtonClick = useCallback((action: string) => {
    logger.info('Button clicked', {
      component: 'component-template',
      action: 'button-click',
      buttonAction: action,
      userId: user?.uid
    });
    
    // Handle different button actions
    switch (action) {
      case 'cancel':
        setLocalState('');
        break;
      case 'reset':
        setLocalState('');
        appActions.showInfo('Info', 'Form reset');
        break;
      default:
        logger.warn('Unknown button action', {
          component: 'component-template',
          action: 'unknown-button-action',
          buttonAction: action,
          userId: user?.uid
        });
    }
  }, [logger, user?.uid]);
  
  // Render loading state
  if (isLoading) {
    return (
      <div className={`loading-container ${className}`}>
        <div className="loading-spinner">Loading...</div>
      </div>
    );
  }
  
  // Render authentication required state
  if (!user) {
    return (
      <div className={`auth-required-container ${className}`}>
        <p>Please sign in to access this feature.</p>
      </div>
    );
  }
  
  // Main render
  return (
    <div className={`component-template ${theme} ${className}`}>
      <h2 className="component-title">{title}</h2>
      
      <form onSubmit={handleSubmit} className="component-form">
        <div className="form-group">
          <label htmlFor="input-field" className="form-label">
            Input Field
          </label>
          <input
            id="input-field"
            type="text"
            value={localState}
            onChange={handleInputChange}
            placeholder="Enter your input here..."
            className="form-input"
            disabled={isProcessing}
          />
        </div>
        
        <div className="form-actions">
          <button
            type="submit"
            disabled={isProcessing || !localState.trim()}
            className="btn btn-primary"
          >
            {isProcessing ? 'Processing...' : 'Submit'}
          </button>
          
          <button
            type="button"
            onClick={() => handleButtonClick('cancel')}
            disabled={isProcessing}
            className="btn btn-secondary"
          >
            Cancel
          </button>
          
          <button
            type="button"
            onClick={() => handleButtonClick('reset')}
            disabled={isProcessing}
            className="btn btn-outline"
          >
            Reset
          </button>
        </div>
      </form>
    </div>
  );
};

// Helper function (replace with your actual implementation)
async function processFormData(data: string): Promise<{ id: string; data: string }> {
  // Your processing logic here
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve({
        id: 'generated-id',
        data: data
      });
    }, 1000);
  });
}

export default ComponentTemplate; 