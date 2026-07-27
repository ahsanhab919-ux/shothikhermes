# SHOTHIK Share System

A centralized sharing system that allows unlimited package users to share research pages and other content with others who can view but not interact with the chat.

## Features

- **Centralized Backend**: All sharing logic in `model/share/` folder
- **Frontend Components**: Reusable share components in `src/components/share/`
- **Multiple Content Types**: Support for research, chat, documents, and presentations
- **Permission Control**: Public/private sharing with expiration and view limits
- **Analytics**: Track views and access patterns
- **Easy Integration**: Simple hooks and components for any feature

## Backend Structure

```
model/
├── share/
│   ├── shareModel.js          # MongoDB schema for shares
│   └── shareService.js        # Business logic for sharing
├── controllers/
│   └── shareController.js     # API endpoints
└── routes/
    └── share.js              # Route definitions
```

## Frontend Structure

```
src/
├── services/
│   └── shareService.js        # API service layer
├── hooks/
│   └── useShare.js           # React hook for sharing
└── components/
    └── share/
        ├── ShareModal.jsx     # Advanced sharing modal
        ├── ShareButton.jsx    # Share button component
        └── index.js          # Export file
```

## Usage

### Basic Share Button

```jsx
import { ShareButton } from '../share';

<ShareButton
  shareData={{
    title: "Research Results",
    content: "Research content...",
    sources: [...],
    query: "Research query"
  }}
  contentType="research"
  variant="icon" // or "button" or "menu"
  onShare={(result) => console.log('Shared:', result)}
/>
```

### Advanced Share Modal

```jsx
import { ShareModal } from '../share';

<ShareModal
  open={modalOpen}
  onClose={() => setModalOpen(false)}
  shareData={researchData}
  contentType="research"
  title="Share Research"
/>
```

### Using the Hook

```jsx
import { useShare } from '../share';

const { shareResearch, isLoading, error } = useShare();

const handleShare = async () => {
  try {
    const result = await shareResearch(researchData, {
      isPublic: true,
      allowDownload: true,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days
    });
    console.log('Share created:', result);
  } catch (err) {
    console.error('Share failed:', err);
  }
};
```

## API Endpoints

- `POST /api/share` - Create a new share
- `GET /api/share/:shareId` - Get share by ID (public)
- `GET /api/share/user/shares` - Get user's shares
- `PUT /api/share/:shareId` - Update share
- `DELETE /api/share/:shareId` - Delete share
- `GET /api/share/:shareId/analytics` - Get share analytics

## Shared Content Pages

Shared content is accessible at: `/shared/[contentType]/[shareId]`

Example: `/shared/research/abc123def456`

## Integration with Research

The share system is already integrated with:
- `CombinedActions.jsx` - Share button in research actions
- `HeaderTitle.jsx` - Share button in research header

## Content Types Supported

1. **Research** - Research results with sources and content
2. **Chat** - Chat conversations and messages
3. **Document** - Documents and text content
4. **Presentation** - Presentation slides and content
5. **Other** - Generic content type

## Permissions

- **isPublic**: Make share publicly accessible
- **allowComments**: Allow comments on shared content
- **allowDownload**: Allow downloading of shared content
- **expiresAt**: Set expiration date for share
- **maxViews**: Limit number of views

## Security

- All shares require authentication to create
- Public shares are accessible without authentication
- Private shares require owner authentication
- Access logging for all shares
- Automatic cleanup of expired shares

## Future Enhancements

- [ ] Social sharing (Twitter, LinkedIn, etc.)
- [ ] Embed codes for websites
- [ ] Password-protected shares
- [ ] Share collections and folders
- [ ] Advanced analytics dashboard
- [ ] Share templates and presets
