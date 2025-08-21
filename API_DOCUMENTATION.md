# Planning Poker API Documentation

## Base URL
```
http://localhost:3000/api
```

## Authentication
All endpoints requiring user authentication use the `x-user-id` header to identify the user.

## Endpoints

### Sessions

#### List Active Sessions
```http
GET /sessions
```

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "name": "Sprint Planning",
      "userCount": 5,
      "createdAt": "2024-01-01T00:00:00Z"
    }
  ]
}
```

#### Create Session
```http
POST /sessions
```

**Request Body:**
```json
{
  "name": "Sprint Planning",
  "user": {
    "id": "user-id",
    "name": "John Doe",
    "avatar": "https://example.com/avatar.png"
  }
}
```

**Response (201):**
```json
{
  "success": true,
  "data": {
    "id": "session-uuid",
    "name": "Sprint Planning",
    "scrumMasterId": "user-id",
    "users": [...],
    "createdAt": "2024-01-01T00:00:00Z"
  }
}
```

#### Get Session Details
```http
GET /sessions/{sessionId}
```

#### Delete Session
```http
DELETE /sessions/{sessionId}
```
**Headers:** `x-user-id: {scrumMasterId}`

#### Update Session
```http
PATCH /sessions/{sessionId}
```
**Headers:** `x-user-id: {scrumMasterId}`

### Users

#### List Session Users
```http
GET /sessions/{sessionId}/users
```

#### Join Session
```http
POST /sessions/{sessionId}/users
```

**Request Body:**
```json
{
  "user": {
    "id": "user-id",
    "name": "Jane Doe",
    "avatar": "https://example.com/avatar.png"
  }
}
```

#### Leave/Kick User
```http
DELETE /sessions/{sessionId}/users/{userId}
```
**Headers:** `x-user-id: {requestingUserId}`

#### Reconnect User
```http
PATCH /sessions/{sessionId}/users/{userId}
```

### Voting

#### Get Voting Status
```http
GET /sessions/{sessionId}/voting
```

#### Start Voting Round
```http
POST /sessions/{sessionId}/voting
```
**Headers:** `x-user-id: {scrumMasterId}`

#### Submit Vote
```http
PATCH /sessions/{sessionId}/voting
```
**Headers:** `x-user-id: {userId}`

**Request Body:**
```json
{
  "value": 5
}
```
Valid values: 1, 2, 3, 5, 8, 13, 21, "coffee"

#### Reveal Votes
```http
POST /sessions/{sessionId}/voting/reveal
```
**Headers:** `x-user-id: {scrumMasterId}`

**Response:**
```json
{
  "success": true,
  "data": {
    "votes": [
      {
        "userId": "user-1",
        "value": 5,
        "submittedAt": "2024-01-01T00:00:00Z"
      }
    ],
    "statistics": {
      "average": 6.5,
      "distribution": [
        { "value": 5, "count": 2 },
        { "value": 8, "count": 1 }
      ],
      "hasConsensus": false,
      "totalVotes": 3,
      "coffeeVotes": 0
    }
  }
}
```

### Role Management

#### Transfer Scrum Master Role
```http
POST /sessions/{sessionId}/transfer
```
**Headers:** `x-user-id: {currentScrumMasterId}`

**Request Body:**
```json
{
  "newScrumMasterId": "user-id"
}
```

## Error Responses

All error responses follow this format:
```json
{
  "success": false,
  "error": "Error message",
  "timestamp": "2024-01-01T00:00:00Z"
}
```

### Common Status Codes
- `200` - Success
- `201` - Created
- `400` - Bad Request
- `401` - Unauthorized
- `404` - Not Found
- `409` - Conflict (e.g., max sessions reached)
- `500` - Internal Server Error

## WebSocket Events

The API endpoints emit corresponding Socket.io events for real-time synchronization:

- `sessionUpdated` - Emitted when session state changes
- `userJoined` - When a user joins a session
- `userLeft` - When a user leaves a session
- `userDisconnected` - When a user disconnects
- `userReconnected` - When a user reconnects
- `votingStarted` - When voting round begins
- `voteSubmitted` - When a user submits their vote
- `votesRevealed` - When votes are revealed
- `scrumMasterChanged` - When Scrum Master role is transferred
- `sessionEnded` - When session is terminated
- `sessionPaused` - When Scrum Master disconnects
- `sessionResumed` - When Scrum Master reconnects
- `activeSessions` - Updates list of active sessions

## Rate Limits & Constraints

- Maximum 3 concurrent sessions
- Maximum 16 users per session
- Sessions expire after 10 minutes of inactivity
- Scrum Master has 5-minute grace period for reconnection
- Vote values limited to Fibonacci sequence (1, 2, 3, 5, 8, 13, 21) or "coffee"