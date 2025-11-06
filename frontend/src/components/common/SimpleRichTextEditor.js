import React, { useRef, useState } from 'react';
import { Button, ButtonGroup, Form } from 'react-bootstrap';

const SimpleRichTextEditor = ({ value, onChange, placeholder, style }) => {
  const textareaRef = useRef(null);
  const [showPreview, setShowPreview] = useState(false);

  const insertTag = (openTag, closeTag = null) => {
    const textarea = textareaRef.current;
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = value.substring(start, end);
    
    let newText;
    if (closeTag) {
      newText = value.substring(0, start) + openTag + selectedText + closeTag + value.substring(end);
    } else {
      newText = value.substring(0, start) + openTag + value.substring(end);
    }
    
    onChange(newText);
    
    // Set cursor position after insertion
    setTimeout(() => {
      const newPos = closeTag ? start + openTag.length : start + openTag.length;
      textarea.focus();
      textarea.setSelectionRange(newPos, newPos + selectedText.length);
    }, 0);
  };

  const formatButtons = [
    { icon: 'bi-type-bold', title: 'Bold', openTag: '<b>', closeTag: '</b>' },
    { icon: 'bi-type-italic', title: 'Italic', openTag: '<i>', closeTag: '</i>' },
    { icon: 'bi-type-underline', title: 'Underline', openTag: '<u>', closeTag: '</u>' },
    { icon: 'bi-list-ul', title: 'Bullet List', openTag: '<ul>\n  <li>', closeTag: '</li>\n</ul>' },
    { icon: 'bi-list-ol', title: 'Numbered List', openTag: '<ol>\n  <li>', closeTag: '</li>\n</ol>' },
    { icon: 'bi-text-paragraph', title: 'Paragraph', openTag: '<p>', closeTag: '</p>' },
    { icon: 'bi-link-45deg', title: 'Link', openTag: '<a href="">', closeTag: '</a>' },
    { icon: 'bi-code-slash', title: 'Line Break', openTag: '<br/>\n', closeTag: null },
  ];

  return (
    <div className="simple-rich-text-editor">
      <div className="border rounded">
        {/* Toolbar */}
        <div className="bg-light border-bottom p-2">
          <div className="d-flex justify-content-between align-items-center">
            <ButtonGroup size="sm">
              {formatButtons.map((btn, idx) => (
                <Button
                  key={idx}
                  variant="outline-secondary"
                  onClick={() => insertTag(btn.openTag, btn.closeTag)}
                  title={btn.title}
                >
                  <i className={`bi ${btn.icon}`}></i>
                </Button>
              ))}
            </ButtonGroup>
            <Button
              size="sm"
              variant={showPreview ? 'primary' : 'outline-secondary'}
              onClick={() => setShowPreview(!showPreview)}
            >
              <i className="bi bi-eye me-1"></i>
              {showPreview ? 'Edit' : 'Preview'}
            </Button>
          </div>
        </div>

        {/* Editor/Preview Area */}
        {showPreview ? (
          <div 
            className="p-3" 
            style={{ minHeight: '200px', maxHeight: '400px', overflowY: 'auto' }}
            dangerouslySetInnerHTML={{ __html: value || '<p class="text-muted">No content to preview</p>' }}
          />
        ) : (
          <Form.Control
            as="textarea"
            ref={textareaRef}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder={placeholder}
            style={{ 
              border: 'none', 
              borderRadius: 0,
              minHeight: '200px',
              fontFamily: 'monospace',
              fontSize: '0.9rem',
              ...style
            }}
            className="p-3"
          />
        )}
      </div>
      <Form.Text className="text-muted">
        Use the toolbar buttons to add formatting. Selected text will be wrapped with tags.
      </Form.Text>
    </div>
  );
};

export default SimpleRichTextEditor;

