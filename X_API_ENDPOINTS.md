# X API Integration for XPulse

## Credentials
- **Consumer Key**: XlatuT09IXormkTTmuhAUL6ck
- **Secret Key**: Vb36Ob2agDRR3HbrNdzTyFuzcUNthb0HQCoDjuaHRz9DIWSeKe
- **Bearer Token**: (Configured in .env)

## Endpoints Currently Used

### 1. General Post Stream (`/monitor` without handle)
**Endpoint**: `GET https://api.x.com/2/tweets/search/recent`
**Query**: `(tech OR AI OR crypto OR bitcoin OR market OR breaking) -is:retweet lang:en`
**Fields**:
- `tweet.fields`: created_at, public_metrics, author_id
- `user.fields`: username, name, profile_image_url, verified
- `expansions`: author_id

### 2. User-Specific Monitoring (`/monitor?handle=username`)

#### Step 1: Get User Info
**Endpoint**: `GET https://api.x.com/2/users/by/username/:username`
**Fields**:
- `user.fields`: id, name, username, verified, profile_image_url, public_metrics, description

#### Step 2: Get User's Posts
**Endpoint**: `GET https://api.x.com/2/users/:id/tweets`
**Fields**:
- `tweet.fields`: created_at, public_metrics, referenced_tweets, entities
- `expansions`: referenced_tweets.id, referenced_tweets.id.author_id

#### Step 3: Get Mentions
**Endpoint**: `GET https://api.x.com/2/tweets/search/recent`
**Query**: `@username -from:username -is:retweet lang:en`
**Purpose**: Find posts mentioning the user (excluding their own posts)

#### Step 4: Get Replies
**Endpoint**: `GET https://api.x.com/2/tweets/search/recent`
**Query**: `to:username -from:username -is:retweet lang:en`
**Purpose**: Find replies to the user's posts

## Rate Limits (with Bearer Token)
- Search endpoint: 450 requests per 15-minute window
- User lookup: 900 requests per 15-minute window
- User tweets: 1,500 requests per 15-minute window

## Current Implementation Files

### Backend
- `backend/src/userMonitor.js`: User activity monitoring service
- `backend/src/grok.js`: AI analysis with Grok
- `backend/src/index.js`: Socket.io integration

### Frontend
- `src/app/monitor/page.tsx`: Monitor page with dual-mode support

## Example: Monitoring @elonmusk

```javascript
// Client-side (Frontend)
const socket = io('https://api.xpulse.buzz');
socket.emit('monitor:start', { username: 'elonmusk' });

// Backend receives and:
// 1. Calls: GET /2/users/by/username/elonmusk
// 2. Gets user ID (e.g., "44196397")
// 3. Calls: GET /2/users/44196397/tweets
// 4. Searches: GET /2/tweets/search/recent?query=@elonmusk
// 5. Searches: GET /2/tweets/search/recent?query=to:elonmusk
// 6. Sends results via Socket.io events:
//    - monitor:user-info
//    - monitor:activity
//    - monitor:analysis (Grok AI)
```

## Important Notes

1. **Bearer Token** = App-only authentication (read-only)
2. **No OAuth required** for public data
3. **Polling strategy**: Every 15 seconds to avoid rate limits
4. **Deduplication**: Track processed tweet IDs to avoid duplicates
5. **AI Analysis**: Uses Grok API every 30 seconds for insights

## Testing

To test user monitoring:
```bash
# Visit in browser
https://xpulse.buzz/monitor?handle=elonmusk

# Should show:
# - User profile card
# - Grok AI analysis
# - Activity filters (Mentions/Replies/Own Posts)
# - Real-time activity stream
```

## Common Issues

### "No data for @elon"
**Problem**: Username "elon" doesn't exist
**Solution**: Use full handle "elonmusk"

### "User not found"
**Problem**: Invalid username
**Solution**: Check X.com to verify correct username

### Rate limit errors
**Problem**: Too many requests
**Solution**: Backend automatically throttles (15s polling interval)
