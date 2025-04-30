import Ajv, { ErrorObject } from 'ajv';
import addFormats from 'ajv-formats';
import ajvErrors from 'ajv-errors'; // Import ajv-errors
import { JSONSchema7 } from 'json-schema';

// Define a structure for validation results
export interface ValidationResult {
    isValid: boolean;
    errors: Record<string, string>; // Map field path (e.g., "address.street") to error message
}

// Initialize Ajv instance
const ajv = new Ajv({
    allErrors: true, // Collect all errors, not just the first
    coerceTypes: false, // Disable type coercion
    // $data: true // Enable $data references if needed later
    // Remove jsonPointers: true if it exists, ajv-errors handles paths
});
addFormats(ajv); // Add standard formats like 'email', 'date', 'date-time'
ajvErrors(ajv /*, {singleError: true} */); // Add ajv-errors functionality

/**
 * Validates form data against a JSON schema using Ajv.
 *
 * @param schema The JSON schema to validate against.
 * @param formData The data object to validate.
 * @returns A ValidationResult object.
 */
export function validateFormData(schema: JSONSchema7, formData: Record<string, unknown>): ValidationResult {
    // Log the data being passed to validation
    console.log("[validationService] Validating formData:", JSON.stringify(formData, null, 2));

    // Use direct validation instead of compile first
    const isValid = ajv.validate(schema, formData);
    const validationErrors = ajv.errors; // Get errors from the instance after validate

    // Log the immediate result of validation
    console.log(`[validationService] After ajv.validate(): isValid=${isValid}, errors=`, validationErrors);

    const errors: Record<string, string> = {};

    if (!isValid && validationErrors) {
        console.log("[validationService] Ajv validation errors (inside if):", JSON.stringify(validationErrors, null, 2));

        // Corrected loop: Use validationErrors and remove duplicate line
        validationErrors.forEach((error: ErrorObject) => {
            // ajv-errors modifies the error object to include the custom message
            // It also handles path mapping better in many cases.

            // Get the field path. ajv-errors might provide a better path in some cases.
            // Prefer instancePath, fallback to schemaPath for structure issues.
            let fieldPath = error.instancePath ? error.instancePath.substring(1).replace(/\//g, '.') : '';

            // Handle root-level required errors specifically
            if (error.keyword === 'required' && error.instancePath === '') {
                fieldPath = error.params.missingProperty;
            }
            // Handle array item errors (map to the array field itself)
            else if (fieldPath.includes('.')) {
                const parts = fieldPath.split('.');
                if (parts.length > 1 && /^\d+$/.test(parts[1])) { // Check if the second part is a number (array index)
                    fieldPath = parts[0]; // Map 'arrayName.0' to 'arrayName'
                }
            }
            // Handle root array errors (e.g. '/0')
            else if (/^\d+$/.test(fieldPath)) {
                 // This case might indicate an error directly on an array item at the root
                 // We might need a way to signal this, perhaps a generic form error?
                 // For now, let's log it and potentially assign a generic error later.
                 console.warn(`[validationService] Unhandled root array item error path: ${fieldPath}`, error);
                 fieldPath = ''; // Clear path to avoid assigning to a numeric key
            }


            // Use the message provided by ajv-errors (which includes custom messages)
            // Fallback to a generic message if somehow missing.
            const message = error.message || 'Invalid value';

            // Log the mapped path and message for debugging
            console.log(`[validationService] Mapped error: path="${fieldPath}", keyword="${error.keyword}", message="${message}"`);

            // Avoid overwriting errors if multiple exist for the same field (show first one)
            if (fieldPath && !errors[fieldPath]) {
                errors[fieldPath] = message;
            } else if (!fieldPath) {
                // Handle cases where path couldn't be determined (e.g., root array item error)
                console.warn("[validationService] Could not determine field path for Ajv error:", error);
                // Optionally assign a generic form error if needed:
                // if (!errors['form']) errors['form'] = message;
            }
        });
    }

    return {
        isValid,
        errors,
    };
}
