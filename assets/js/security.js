// Security utilities for XSS prevention

/**
 * Sanitize HTML to prevent XSS attacks
 * @param {string} html - HTML string to sanitize
 * @returns {string} - Sanitized HTML
 */
function sanitizeHTML(html) {
  const temp = document.createElement('div');
  temp.textContent = html;
  return temp.innerHTML;
}

/**
 * Escape HTML special characters
 * @param {string} str - String to escape
 * @returns {string} - Escaped string
 */
function escapeHTML(str) {
  if (!str) return '';
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}

/**
 * Create a safe element with escaped text content
 * @param {string} tagName - HTML tag name
 * @param {string} textContent - Text content to set
 * @param {Object} attributes - Optional attributes
 * @returns {HTMLElement} - Created element
 */
function createSafeElement(tagName, textContent, attributes = {}) {
  const element = document.createElement(tagName);
  element.textContent = textContent; // textContent is safe from XSS
  
  // Set attributes safely
  for (const [key, value] of Object.entries(attributes)) {
    if (key === 'href' || key === 'src') {
      // Validate URLs
      if (isSafeURL(value)) {
        element.setAttribute(key, value);
      }
    } else if (key.startsWith('data-')) {
      element.setAttribute(key, value);
    } else if (key === 'class') {
      element.className = value;
    } else if (key === 'id') {
      element.id = value;
    }
  }
  
  return element;
}

/**
 * Validate if URL is safe
 * @param {string} url - URL to validate
 * @returns {boolean} - True if safe
 */
function isSafeURL(url) {
  if (!url) return false;
  
  try {
    const parsedUrl = new URL(url, window.location.origin);
    // Only allow http, https, and relative URLs
    return ['http:', 'https:', 'data:'].includes(parsedUrl.protocol);
  } catch {
    // If URL parsing fails, check if it's a relative URL
    return url.startsWith('/') || url.startsWith('./') || url.startsWith('../');
  }
}

/**
 * Safely set inner HTML using DOMPurify if available, otherwise sanitize
 * @param {HTMLElement} element - Target element
 * @param {string} html - HTML to set
 */
function setSafeHTML(element, html) {
  if (typeof DOMPurify !== 'undefined') {
    element.innerHTML = DOMPurify.sanitize(html);
  } else {
    // Fallback: create a text node (no HTML rendering)
    element.textContent = html;
    console.warn('DOMPurify not available, falling back to textContent');
  }
}

/**
 * Validate and sanitize input fields
 * @param {string} input - Input to validate
 * @param {string} type - Type of validation (email, phone, text)
 * @returns {string} - Sanitized input
 */
function sanitizeInput(input, type = 'text') {
  if (!input) return '';
  
  // Remove any HTML tags
  let sanitized = input.replace(/<[^>]*>/g, '');
  
  switch (type) {
    case 'email':
      // Basic email sanitization
      sanitized = sanitized.toLowerCase().trim();
      break;
    case 'phone':
      // Remove non-digit characters except +
      sanitized = sanitized.replace(/[^\d+]/g, '');
      break;
    case 'number':
      // Remove non-numeric characters
      sanitized = sanitized.replace(/[^\d.-]/g, '');
      break;
    case 'alphanumeric':
      // Remove special characters
      sanitized = sanitized.replace(/[^a-zA-Z0-9]/g, '');
      break;
    default:
      // General text sanitization
      sanitized = sanitized.trim();
  }
  
  return sanitized;
}

/**
 * Create safe table row with escaped content
 * @param {Array} cells - Array of cell contents
 * @param {boolean} isHeader - Whether to use th instead of td
 * @returns {HTMLTableRowElement} - Created row
 */
function createSafeTableRow(cells, isHeader = false) {
  const row = document.createElement('tr');
  const cellTag = isHeader ? 'th' : 'td';
  
  cells.forEach(cellContent => {
    const cell = document.createElement(cellTag);
    if (typeof cellContent === 'object' && cellContent.html) {
      // If explicitly marked as safe HTML
      cell.innerHTML = cellContent.html;
    } else {
      // Default: escape as text
      cell.textContent = cellContent;
    }
    row.appendChild(cell);
  });
  
  return row;
}

/**
 * Safely append multiple children to an element
 * @param {HTMLElement} parent - Parent element
 * @param {Array} children - Array of child elements
 */
function appendSafeChildren(parent, children) {
  const fragment = document.createDocumentFragment();
  children.forEach(child => {
    if (child instanceof HTMLElement) {
      fragment.appendChild(child);
    }
  });
  parent.appendChild(fragment);
}

// Export functions
if (typeof window !== 'undefined') {
  window.SecurityUtils = {
    sanitizeHTML,
    escapeHTML,
    createSafeElement,
    isSafeURL,
    setSafeHTML,
    sanitizeInput,
    createSafeTableRow,
    appendSafeChildren,
  };
}
