import api from "../utils/interceptor/axios";
import type { AxiosResponse } from "axios";

const baseUrl = import.meta.env.VITE_API_BASE_URL;

// ---------------------- Types ----------------------
export type ComponentType = 'text' | 'input' | 'date' | 'divider' | 'header' | 'rx' | 'lx';

export interface PrescriptionComponent {
    id: string;
    type: ComponentType;
    text?: string;
}

export interface PrescriptionTemplate {
    _id?: string;
    userId?: string;
    components: PrescriptionComponent[];
    color: string;
    createdAt?: string;
    updatedAt?: string;
}

export interface CreateTemplatePayload {
    components: PrescriptionComponent[];
    color: string;
}

export interface UpdateTemplatePayload {
    components: PrescriptionComponent[];
    color: string;
}

// Updated interfaces to match your backend response
export interface TemplateResponse {
    _id?: string;
    userId?: string;
    components: PrescriptionComponent[];
    color: string;
    createdAt?: string;
    updatedAt?: string;
}

export interface TemplateErrorResponse {
    error: string;
}

export interface TemplateErrorResponse {
    error: string;
}

// ---------------------- API Functions ----------------------

/**
 * Get all prescription templates for the current user
 * @returns Promise<PrescriptionTemplate[]>
 */
export const getTemplates = async (): Promise<PrescriptionTemplate[]> => {
    const response: AxiosResponse<PrescriptionTemplate[]> = await api.get(
        `${baseUrl}templates`
    );
    return response.data;
};

/**
 * Get templates with error handling
 * @returns Promise<PrescriptionTemplate[]>
 */
export const getCurrentUserTemplates = async (): Promise<PrescriptionTemplate[]> => {
    try {
        const templates = await getTemplates();

        if (Array.isArray(templates)) {
            return templates;
        }

        console.error('Templates response is not an array:', templates);
        return [];
    } catch (error) {
        console.error('Error fetching templates:', error);
        return [];
    }
};

/**
 * Get the first/default template for the user
 * @returns Promise<PrescriptionTemplate | null>
 */
export const getDefaultTemplate = async (): Promise<PrescriptionTemplate | null> => {
    try {
        const templates = await getCurrentUserTemplates();
        return templates.length > 0 ? templates[0] : null;
    } catch (error) {
        console.error('Error getting default template:', error);
        return null;
    }
};

/**
 * Create a new prescription template
 * @param payload - Template data to create
 * @returns Promise<TemplateResponse>
 */
export const createTemplate = async (
    payload: CreateTemplatePayload
): Promise<TemplateResponse> => {
    try {
        console.log('➕ Creating template with payload:', JSON.stringify(payload, null, 2));

        // Validate payload
        if (!payload || !payload.components) {
            throw new Error('Components are required to create a template');
        }

        if (!payload.color || payload.color.trim().length === 0) {
            throw new Error('Header color is required');
        }

        // Validate components
        if (!Array.isArray(payload.components)) {
            throw new Error('Components must be an array');
        }

        // Your backend expects: { components, color }
        const requestBody = {
            components: payload.components,
            color: payload.color
        };

        const response: AxiosResponse<TemplateResponse> = await api.post(
            `${baseUrl}templates`,
            requestBody
        );

        console.log('✅ Template created successfully:', response.data);
        return response.data;
    } catch (error: any) {
        console.error('❌ Error creating template:', error);

        if (error.response) {
            console.error('Create Template - Response data:', error.response.data);
            console.error('Create Template - Response status:', error.response.status);

            // Handle your backend's error format: { error: 'message' }
            if (error.response.status === 400) {
                const errorMessage = error.response.data?.error || 'Invalid template data';
                throw new Error(errorMessage);
            } else if (error.response.status === 401) {
                throw new Error('Authentication failed. Please login again.');
            } else if (error.response.status === 403) {
                throw new Error('You do not have permission to create templates');
            } else if (error.response.status >= 500) {
                const errorMessage = error.response.data?.error || 'Server error. Please try again later.';
                throw new Error(errorMessage);
            }
        }

        throw error;
    }
};

/**
 * Update an existing prescription template
 * @param payload - Template data to update
 * @returns Promise<TemplateResponse>
 */
export const updateTemplate = async (
    payload: UpdateTemplatePayload
): Promise<TemplateResponse> => {
    try {
        console.log('🔄 Updating template with payload:', JSON.stringify(payload, null, 2));

        // Validate payload
        if (!payload || !payload.components) {
            throw new Error('Components are required to update a template');
        }

        if (!payload.color || payload.color.trim().length === 0) {
            throw new Error('Header color is required');
        }

        // Validate components
        if (!Array.isArray(payload.components)) {
            throw new Error('Components must be an array');
        }

        // Your backend expects: { components, color }
        const requestBody = {
            components: payload.components,
            color: payload.color
        };

        const response: AxiosResponse<TemplateResponse> = await api.put(
            `${baseUrl}templates`,
            requestBody
        );

        console.log('✅ Template updated successfully:', response.data);
        return response.data;
    } catch (error: any) {
        console.error('❌ Error updating template:', error);

        if (error.response) {
            console.error('Update Template - Response data:', error.response.data);
            console.error('Update Template - Response status:', error.response.status);

            // Handle your backend's error format: { error: 'message' }
            if (error.response.status === 400) {
                const errorMessage = error.response.data?.error || 'Invalid template data';
                throw new Error(errorMessage);
            } else if (error.response.status === 401) {
                throw new Error('Authentication failed. Please login again.');
            } else if (error.response.status === 403) {
                throw new Error('You do not have permission to update templates');
            } else if (error.response.status === 404) {
                throw new Error('Template not found');
            } else if (error.response.status >= 500) {
                const errorMessage = error.response.data?.error || 'Server error. Please try again later.';
                throw new Error(errorMessage);
            }
        }

        throw error;
    }
};

/**
 * Delete a prescription template
 * @param templateId - ID of the template to delete
 * @returns Promise<TemplateResponse>
 */
export const deleteTemplate = async (templateId: string): Promise<TemplateResponse> => {
    if (!templateId || templateId.trim().length === 0) {
        throw new Error('Template ID is required');
    }

    const response: AxiosResponse<TemplateResponse> = await api.delete(
        `${baseUrl}templates/${templateId}`
    );

    return response.data;
};

/**
 * Save template (create if doesn't exist, update if exists)
 * @param payload - Template data to save
 * @returns Promise<TemplateResponse>
 */
export const saveTemplate = async (
    payload: CreateTemplatePayload
): Promise<TemplateResponse> => {
    try {
        console.log('🔄 Saving template with payload:', payload);

        // Check if templates exist
        const existingTemplates = await getCurrentUserTemplates();
        console.log('📋 Existing templates found:', existingTemplates.length);

        if (existingTemplates.length > 0) {
            // Update existing template
            console.log('🔄 Updating existing template...');
            return await updateTemplate(payload);
        } else {
            // Create new template
            console.log('➕ Creating new template...');
            return await createTemplate(payload);
        }
    } catch (error: any) {
        console.error('❌ Error saving template:', error);

        // Enhanced error logging
        if (error.response) {
            console.error('Response data:', error.response.data);
            console.error('Response status:', error.response.status);
            console.error('Response headers:', error.response.headers);
        } else if (error.request) {
            console.error('Request made but no response:', error.request);
        } else {
            console.error('Error message:', error.message);
        }

        throw error;
    }
};

/**
 * Save template and refresh templates list
 * @param payload - Template data to save
 * @returns Promise with save response and updated templates
 */
export const saveTemplateAndRefresh = async (
    payload: CreateTemplatePayload
): Promise<{
    saveResponse: TemplateResponse;
    updatedTemplates: PrescriptionTemplate[];
}> => {
    try {
        // Save template
        const saveResponse = await saveTemplate(payload);

        // Refresh templates list to get updated data
        const updatedTemplates = await getCurrentUserTemplates();

        return {
            saveResponse,
            updatedTemplates
        };
    } catch (error) {
        console.error('Error saving template and refreshing:', error);
        throw error;
    }
};

/**
 * Refresh templates and return updated data
 * @returns Promise<PrescriptionTemplate[]>
 */
export const refreshTemplates = async (): Promise<PrescriptionTemplate[]> => {
    try {
        // Force fresh API call
        const templates = await getTemplates();

        if (Array.isArray(templates)) {
            console.log('✅ Templates refreshed:', templates);
            return templates;
        }

        return [];
    } catch (error) {
        console.error('❌ Error refreshing templates:', error);
        return [];
    }
};

/**
 * Check if user has any templates
 * @returns Promise<boolean>
 */
export const hasTemplates = async (): Promise<boolean> => {
    try {
        const templates = await getCurrentUserTemplates();
        return templates.length > 0;
    } catch (error) {
        console.error('Error checking if user has templates:', error);
        return false;
    }
};

/**
 * Get template count for current user
 * @returns Promise<number>
 */
export const getTemplateCount = async (): Promise<number> => {
    try {
        const templates = await getCurrentUserTemplates();
        return templates.length;
    } catch (error) {
        console.error('Error getting template count:', error);
        return 0;
    }
};

/**
 * Validate prescription components
 * @param components - Components to validate
 * @returns Object with validation result and errors
 */
export const validatePrescriptionComponents = (components: PrescriptionComponent[]): {
    isValid: boolean;
    errors: string[];
} => {
    const errors: string[] = [];

    if (!Array.isArray(components)) {
        errors.push('Components must be an array');
        return { isValid: false, errors };
    }

    if (components.length === 0) {
        errors.push('At least one component is required');
    }

    const validTypes = ['text', 'input', 'date', 'divider', 'header', 'rx', 'lx'];
    const componentIds = new Set<string>();

    components.forEach((component, index) => {
        // Check if component has required fields
        if (!component.id) {
            errors.push(`Component at index ${index} is missing an ID`);
        } else if (componentIds.has(component.id)) {
            errors.push(`Duplicate component ID found: ${component.id}`);
        } else {
            componentIds.add(component.id);
        }

        if (!component.type) {
            errors.push(`Component at index ${index} is missing a type`);
        } else if (!validTypes.includes(component.type)) {
            errors.push(`Invalid component type at index ${index}: ${component.type}`);
        }

        // Validate text for text-based components
        if (['text', 'header', 'rx', 'lx'].includes(component.type) && component.text !== undefined) {
            if (typeof component.text !== 'string') {
                errors.push(`Component at index ${index} has invalid text type`);
            }
        }
    });

    return {
        isValid: errors.length === 0,
        errors
    };
};

/**
 * Validate color format (hex color)
 * @param color - Color string to validate
 * @returns boolean indicating if color is valid
 */
export const isValidHexColor = (color: string): boolean => {
    if (!color || typeof color !== 'string') return false;

    // Check if it's a valid hex color
    const hexColorRegex = /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/;
    return hexColorRegex.test(color);
};

/**
 * Validate template payload before saving
 * @param payload - Template payload to validate
 * @returns Object with validation result and errors
 */
export const validateTemplatePayload = (payload: CreateTemplatePayload): {
    isValid: boolean;
    errors: string[];
} => {
    const errors: string[] = [];

    // Validate components
    if (!payload.components) {
        errors.push('Components are required');
    } else {
        const componentValidation = validatePrescriptionComponents(payload.components);
        if (!componentValidation.isValid) {
            errors.push(...componentValidation.errors);
        }
    }

    // Validate color
    if (!payload.color) {
        errors.push('Header color is required');
    } else if (!isValidHexColor(payload.color)) {
        errors.push('Header color must be a valid hex color (e.g., #FF0000)');
    }

    return {
        isValid: errors.length === 0,
        errors
    };
};

/**
 * Generate a unique component ID
 * @returns string - Unique component ID
 */
export const generateComponentId = (): string => {
    return `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
};

/**
 * Create a new prescription component
 * @param type - Component type
 * @param text - Optional text content
 * @returns PrescriptionComponent
 */
export const createPrescriptionComponent = (
    type: ComponentType,
    text?: string
): PrescriptionComponent => {
    return {
        id: generateComponentId(),
        type,
        text: text || ''
    };
};

