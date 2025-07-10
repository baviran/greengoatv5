import { Logger } from '@/app/lib/utils/logger';
import { ValidationError, NotFoundError } from '@/app/lib/errors/app-errors';

// Define types for your service
interface ServiceData {
  id?: string;
  userId: string;
  email?: string;
  // Add other fields as needed
}

interface LogContext {
  userId?: string;
  requestId?: string;
  component?: string;
  action?: string;
  // Add other context fields as needed
}

// Template for service classes
export class ExampleService {
  private logger = Logger.getInstance().withContext({
    component: 'example-service'
  });

  async createItem(data: ServiceData, context?: LogContext): Promise<ServiceData> {
    const mergedContext = { ...context, action: 'create-item' };
    
    this.logger.info('Starting item creation', mergedContext, {
      userId: data.userId,
      email: data.email
    });
    
    try {
      // Input validation
      this.validateCreateData(data);
      
      // Business logic
      const createdItem = await this.performCreate(data);
      
      this.logger.info('Item created successfully', mergedContext, {
        itemId: createdItem.id,
        userId: data.userId
      });
      
      return createdItem;
    } catch (error) {
      this.logger.error('Item creation failed', error, mergedContext);
      throw error;
    }
  }

  async getItem(id: string, userId: string, context?: LogContext): Promise<ServiceData> {
    const mergedContext = { ...context, action: 'get-item' };
    
    this.logger.info('Retrieving item', mergedContext, {
      itemId: id,
      userId
    });
    
    try {
      // Validation
      if (!id) {
        throw new ValidationError('Item ID is required', 'id');
      }
      
      // Business logic
      const item = await this.performGet(id);
      
      // Security check - ensure user owns the item
      if (item.userId !== userId) {
        throw new NotFoundError('Item', id);
      }
      
      this.logger.info('Item retrieved successfully', mergedContext, {
        itemId: id,
        userId
      });
      
      return item;
    } catch (error) {
      this.logger.error('Item retrieval failed', error, mergedContext);
      throw error;
    }
  }

  async updateItem(id: string, data: Partial<ServiceData>, userId: string, context?: LogContext): Promise<ServiceData> {
    const mergedContext = { ...context, action: 'update-item' };
    
    this.logger.info('Updating item', mergedContext, {
      itemId: id,
      userId,
      updateFields: Object.keys(data)
    });
    
    try {
      // Validation
      if (!id) {
        throw new ValidationError('Item ID is required', 'id');
      }
      
      // Check if item exists and user owns it
      const existingItem = await this.getItem(id, userId, context);
      
      // Business logic
      const updatedItem = await this.performUpdate(id, data);
      
      this.logger.info('Item updated successfully', mergedContext, {
        itemId: id,
        userId
      });
      
      return updatedItem;
    } catch (error) {
      this.logger.error('Item update failed', error, mergedContext);
      throw error;
    }
  }

  async deleteItem(id: string, userId: string, context?: LogContext): Promise<void> {
    const mergedContext = { ...context, action: 'delete-item' };
    
    this.logger.info('Deleting item', mergedContext, {
      itemId: id,
      userId
    });
    
    try {
      // Check if item exists and user owns it
      const existingItem = await this.getItem(id, userId, context);
      
      // Business logic
      await this.performDelete(id);
      
      this.logger.info('Item deleted successfully', mergedContext, {
        itemId: id,
        userId
      });
    } catch (error) {
      this.logger.error('Item deletion failed', error, mergedContext);
      throw error;
    }
  }

  // Private validation methods
  private validateCreateData(data: ServiceData): void {
    if (!data.userId) {
      throw new ValidationError('User ID is required', 'userId');
    }
    
    if (!data.email) {
      throw new ValidationError('Email is required', 'email');
    }
    
    // Add more validation as needed
  }

  // Private business logic methods (replace with your actual implementation)
  private async performCreate(data: ServiceData): Promise<ServiceData> {
    // Your database/API logic here
    return {
      id: 'generated-id',
      userId: data.userId,
      email: data.email
    };
  }

  private async performGet(id: string): Promise<ServiceData> {
    // Your database/API logic here
    return {
      id,
      userId: 'user-id',
      email: 'user@example.com'
    };
  }

  private async performUpdate(id: string, data: Partial<ServiceData>): Promise<ServiceData> {
    // Your database/API logic here
    return {
      id,
      userId: 'user-id',
      email: 'updated@example.com',
      ...data
    };
  }

  private async performDelete(id: string): Promise<void> {
    // Your database/API logic here
    // Implementation depends on your data layer
  }
} 