// /lib/protocol-config.js
// Shared configuration for protocol creation across the system
// Range Medical

// Injection medications list
export const INJECTION_MEDICATIONS = [
  'NAD+ 100mg',
  'NAD+ 200mg',
  'B12',
  'Glutathione',
  'Vitamin D',
  'Biotin',
  'Lipo-C',
  'Skinny Shot',
  'Toradol'
];

// Frequency options
export const FREQUENCY_OPTIONS = [
  { value: '2x daily', label: '2x Daily' },
  { value: 'daily', label: 'Daily' },
  { value: 'every other day', label: 'Every Other Day' },
  { value: 'every 5 days', label: 'Every 5 Days' },
  { value: '2x weekly', label: '2x Weekly' },
  { value: 'weekly', label: 'Weekly' },
  { value: 'as needed', label: 'As Needed' }
];

// Parse template name to extract protocol type and delivery method
export const parseTemplateName = (name) => {
  const deliveryMatch = name.match(/\((In Clinic|Take Home)\)/i);
  const delivery = deliveryMatch ? deliveryMatch[1] : null;
  
  let type = name
    .replace(/^(Injection Therapy|Peptide Therapy|HBOT|HRT|Red Light|Weight Loss)\s*-?\s*/i, '')
    .replace(/\s*\((In Clinic|Take Home)\)\s*/i, '')
    .trim();
  
  return { type, delivery };
};

// Get unique protocol types for a category
export const getProtocolTypes = (templates, category) => {
  const categoryTemplates = templates.filter(t => t.category === category);
  const types = new Set();
  
  categoryTemplates.forEach(t => {
    const { type } = parseTemplateName(t.name);
    if (type) types.add(type);
  });
  
  return [...types].sort();
};

// Check if a protocol type has delivery options
export const hasDeliveryOptions = (templates, category, protocolType) => {
  const categoryTemplates = templates.filter(t => t.category === category);
  const matchingTemplates = categoryTemplates.filter(t => {
    const { type } = parseTemplateName(t.name);
    return type === protocolType;
  });
  
  return matchingTemplates.some(t => {
    const { delivery } = parseTemplateName(t.name);
    return delivery !== null;
  });
};

// Get delivery options for a protocol type
export const getDeliveryOptions = (templates, category, protocolType) => {
  const categoryTemplates = templates.filter(t => t.category === category);
  const options = new Set();
  
  categoryTemplates.forEach(t => {
    const { type, delivery } = parseTemplateName(t.name);
    if (type === protocolType && delivery) {
      options.add(delivery);
    }
  });
  
  return [...options].sort();
};

// Find template by category, protocol type, and delivery method
export const findTemplate = (templates, category, protocolType, deliveryMethod) => {
  return templates.find(t => {
    if (t.category !== category) return false;
    const { type, delivery } = parseTemplateName(t.name);
    if (type !== protocolType) return false;
    if (deliveryMethod && delivery !== deliveryMethod) return false;
    if (!deliveryMethod && delivery) return false;
    return true;
  }) || templates.find(t => {
    if (t.category !== category) return false;
    const { type } = parseTemplateName(t.name);
    return type === protocolType;
  });
};

// Format category name for display
export const formatCategoryName = (category) => {
  if (!category) return 'Other';
  return category.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
};
