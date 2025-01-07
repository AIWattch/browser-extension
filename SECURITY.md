## Data Collection

This extension:
- Only stores configuration settings
- Does not store conversation content
- Does not collect personal information
- Does not track user behavior
- Performs all calculations locally

### Data Storage
- Settings are stored locally in Chrome storage
- Only configuration values are saved:
- Token energy factors
- PUE value
- Grid emissions factor
- Characters per token ratio
- UI preferences (overlay position)
- No conversation data is persisted

## Logging

### Development Logs
- Console logs only appear in development mode
- No sensitive data is logged
- Logs are not persisted

### Error Logs Include:
- Timestamp
- Error type/message
- Chrome version (automatic detection)
- ChatGPT version (automatic detection)
- NO user data or conversation content

### Log Management
- Logs are stored only in browser console
- Logs are cleared on browser close
- No external transmission of logs
- No automatic log collection

## For Developers

### Logs can be accessed through:
- Chrome DevTools Console
- Extension debug mode

### Extension Permissions
The extension requires minimal permissions:
- storage: For saving configuration settings
- Host permission: Limited to chat.openai.com only

## Reporting a Security Vulnerability

If you discover a security issue:

1. Email: security@itclimateed.com
2. Include:
- Description of the issue
- Steps to reproduce
- Potential impact
3. We will respond within 48 hours

## Version
- Current version: 1.0
- Chrome minimum version: [specify]
- Works with: ChatGPT free version (as of Dec 2024)
