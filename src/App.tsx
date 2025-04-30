import React from 'react';
import { JSONSchema7 } from 'json-schema';
import DynaForm from './components/DynaForm/DynaForm'; // Import the component
import { VisibilityCondition } from './services/schemaInterpreter'; // Import VisibilityCondition

// Define a custom type extending JSONSchema7 to include UI hints
// We need to allow these properties potentially anywhere in the schema
type UISchema = JSONSchema7 & {
  'ui:classNames'?: string;
  'ui:style'?: React.CSSProperties;
  'ui:placeholder'?: string; // Added placeholder for completeness
  'ui:widget'?: string; // Added widget for completeness
  'ui:visibleWhen'?: VisibilityCondition; // Add the new property
  'ui:options'?: { // Add options for repeating sections etc.
    addButtonText?: string;
    removeButtonText?: string;
    itemTitle?: string;
    // Add other potential options here if needed
  };
  properties?: {
    [key: string]: UISchema; // Allow properties to also be UISchemas
  };
  items?: UISchema | UISchema[]; // Allow items in arrays to be UISchemas
};


// Example JSON Schema using the extended type
const exampleSchema: UISchema = {
  title: "User Registration",
  description: "A simple user registration form with validation.",
  type: "object",
  // Make more fields required for demonstration
  required: ["firstName", "email", "age", "address", "terms", "addresses"], // Added addresses
  properties: {
    firstName: {
      type: "string",
      title: "First Name",
      description: "Min 2, Max 30 characters",
      minLength: 2,
      maxLength: 30, // Add maxLength
      default: "John",
      "ui:classNames": "custom-firstname-class" // Example custom class
    },
    lastName: {
      type: "string",
      title: "Last Name"
    },
    email: {
      type: "string",
      title: "Email Address",
      format: "email", // Hint for potential email validation/input type
      "ui:widget": "emailLink" // Add hint for the plugin
    },
    age: {
      type: "number",
      title: "Age",
      description: "Must be 18 or older",
      minimum: 18,
      "ui:style": { // Example inline style
          borderLeft: '3px solid blue',
          paddingLeft: '10px'
      }
    },
    newsletter: {
      type: "boolean",
      title: "Subscribe to newsletter?",
      format: "toggle", // Use toggle format
      default: true
    },
    color: {
      type: "string",
      title: "Favorite Color",
      enum: ["Red", "Green", "Blue", "Other"]
    },
    comments: {
      type: "string",
      title: "Additional Comments",
      format: "textarea",
      description: "Enter any additional comments here..." // Used as placeholder
    },
    // --- Card Section Example Start ---
    // This nested object will be rendered as a CardSection
    address: {
      type: "object",
      title: "Home Address", // This becomes the card header
      "ui:classNames": "address-card-custom-style", // Example class for the card section
      properties: {
        street: {
          type: "string",
          title: "Street Address"
        },
        city: {
          type: "string",
          title: "City"
        },
        zipCode: {
          type: "string", // Use string for zip codes that might start with 0
          title: "Zip Code",
          pattern: "^[0-9]{5}(?:-[0-9]{4})?$" // Example US zip code pattern
        }
      },
      // Make nested fields required within the address object
      required: ["street", "city", "zipCode"]
    },
    // --- Card Section Example End ---

    // --- Repeating Section Example ---
    addresses: {
      type: "array",
      title: "Other Addresses", // Changed title slightly to avoid confusion with the single 'address' fieldset
      minItems: 0, // Make it optional to start with zero addresses
      items: { // Define the structure of each item in the array
        type: "object",
        title: "Address", // Title for each item (used potentially in UI)
        properties: {
          type: { "type": "string", "title": "Type", "enum": ["Home", "Work", "Other"], "default": "Home" },
          street: { "type": "string", "title": "Street Address" },
          city: { "type": "string", "title": "City" },
          zip: { "type": "string", "title": "Zip Code", "pattern": "^\\d{5}(-\\d{4})?$" } // Example pattern
        },
        required: ["type", "street", "city", "zip"]
      },
      "ui:options": { // Optional UI hints for the array itself
        "addButtonText": "Add Address",
        "removeButtonText": "Remove",
        "itemTitle": "Address" // Base title for each item instance
      }
    },
    // --- End Repeating Section Example ---

    rating: { // Slider example
      type: "number",
      title: "Satisfaction Rating",
      format: "range",
      minimum: 0,
      maximum: 10,
      default: 5
    },
    birthDate: { // Date example
      type: "string",
      title: "Date of Birth",
      format: "date"
    },
    appointmentTime: { // DateTime example
      type: "string",
      title: "Appointment Time",
      format: "date-time"
    },
    topics: { // Multi-select example
      type: "array",
      title: "Interests",
      description: "Select topics you are interested in",
      items: {
        type: "string",
        enum: ["Technology", "Sports", "Music", "Art", "Travel", "Food"]
      },
      // Optionally add 'uniqueItems: true' if needed by schema validation
      uniqueItems: true,
      minItems: 1, // Require at least one topic
      default: ["Technology"] // Default value should be an array
    },
    terms: { // Add a required checkbox
        type: "boolean",
        title: "I agree to the terms and conditions",
        // Ajv requires 'const: true' for a required boolean checkbox
        // See: https://ajv.js.org/json-schema.html#required-boolean
        const: true,
        // You might need a custom error message for this in validationService if 'must be true' isn't clear
    }
  }
};

// Example Tabbed Schema
// Use type assertion to allow custom 'layout' property
const tabbedSchema = {
  title: "User Profile",
  type: "object",
  layout: {
    view: "tabs",
    groups: [
      {
        title: "Basic Info",
        fields: ["username", "email"]
      },
      {
        title: "Preferences",
        fields: ["theme", "notifications"]
      }
    ]
  },
  properties: {
    username: {
      type: "string",
      title: "Username"
    },
    email: {
      type: "string",
      title: "Email",
      format: "email"
    },
    theme: {
      type: "string",
      title: "UI Theme",
      enum: ["Light", "Dark", "System"],
      default: "System"
    },
    notifications: {
      type: "boolean",
      title: "Enable Notifications",
      default: false
    }
  },
  required: ["username", "email"]
} as const satisfies JSONSchema7 & { layout?: Record<string, unknown> }; // Type assertion

// Example Schema with Conditional Logic
const conditionalSchema: UISchema = {
  title: "Conditional Form Example",
  type: "object",
  properties: {
    contactMethod: {
      type: "string",
      title: "Preferred Contact Method",
      enum: ["Email", "Phone", "None"],
      default: "None"
    },
    emailAddress: {
      type: "string",
      title: "Email Address",
      format: "email",
      "ui:visibleWhen": {
        fieldPath: "contactMethod",
        operator: "equals",
        value: "Email"
      }
    },
    phoneNumber: {
      type: "string",
      title: "Phone Number",
      // Example pattern for a simple US phone number format
      pattern: "^\\(?([0-9]{3})\\)?[-. ]?([0-9]{3})[-. ]?([0-9]{4})$",
      "ui:visibleWhen": {
        fieldPath: "contactMethod",
        operator: "equals",
        value: "Phone"
      }
    },
    reasonForNoContact: {
      type: "string",
      title: "Reason for No Contact",
      format: "textarea",
      "ui:visibleWhen": {
        fieldPath: "contactMethod",
        operator: "equals",
        value: "None"
      }
    },
    provideDetails: {
        type: "boolean",
        title: "Provide Additional Details?",
        default: false,
        "ui:visibleWhen": {
            fieldPath: "contactMethod",
            operator: "notEquals", // Show if contact method is NOT 'None'
            value: "None"
        }
    },
    additionalDetails: {
        type: "string",
        title: "Additional Details",
        format: "textarea",
        "ui:visibleWhen": {
            fieldPath: "provideDetails", // Depends on the checkbox above
            operator: "equals",
            value: true
        }
    }
  },
  // Make contactMethod required, others are conditionally required via logic/validation service later
  required: ["contactMethod"]
};

// Example Schema for Repeating Sections Only
const repeatingSchema: UISchema = {
  title: "Repeating Sections Demo",
  type: "object",
  properties: {
    addresses: {
      type: "array",
      title: "Addresses",
      minItems: 1, // Start with one item
      items: {
        type: "object",
        title: "Address",
        properties: {
          type: { "type": "string", "title": "Type", "enum": ["Home", "Work", "Other"], "default": "Home" },
          street: { "type": "string", "title": "Street Address" },
          city: { "type": "string", "title": "City" },
          zip: { "type": "string", "title": "Zip Code", "pattern": "^\\d{5}(-\\d{4})?$" }
        },
        required: ["type", "street", "city", "zip"]
      },
      "ui:options": {
        "addButtonText": "Add Another Address",
        "removeButtonText": "Remove This Address",
        "itemTitle": "Address"
      }
    }
  },
  required: ["addresses"]
};


function App() {
  // Keep only one definition of handleFormSubmit INSIDE App component
  const handleFormSubmit = (formId: string, formData: Record<string, unknown>) => {
    console.log(`App received form data for [${formId}]:`, formData);
    alert(`Form [${formId}] Submitted! Check console for data.`);
  };

  // REMOVE duplicated lines below
  //  console.log(`App received form data for [${formId}]:`, formData);
  //  alert(`Form [${formId}] Submitted! Check console for data.`);
  //};

  return (
    <div style={{ padding: '20px', maxWidth: '700px', margin: 'auto' }}>
      <h1>DynaForm Generation System</h1>

      <hr style={{ margin: '2rem 0' }} />
      <h2>Example 1: Simple Form</h2>
      <DynaForm schema={exampleSchema} onSubmit={(data) => handleFormSubmit('simple', data)} />

      <hr style={{ margin: '2rem 0' }} />
      <h2>Example 2: Tabbed Form</h2>
      <DynaForm schema={tabbedSchema} onSubmit={(data) => handleFormSubmit('tabbed', data)} />

      <hr style={{ margin: '2rem 0' }} />
      <h2>Example 3: Conditional Fields</h2>
      <DynaForm schema={conditionalSchema} onSubmit={(data) => handleFormSubmit('conditional', data)} />

      <hr style={{ margin: '2rem 0' }} />
      <h2>Example 4: Repeating Sections</h2>
      <DynaForm schema={repeatingSchema} onSubmit={(data) => handleFormSubmit('repeating', data)} />
    </div>
  );
}

export default App;
