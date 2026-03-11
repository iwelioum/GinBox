# SOKOUL — API Error Codes

All API errors follow the standard format:
```json
{
  "error": {
    "code": "SCREAMING_SNAKE_CASE",
    "message": "Human readable message"
  }
}
```

## Error Code Reference

### Stream Errors
| Code | HTTP Status | Description |
|------|-------------|-------------|
| `STREAM_NOT_FOUND` | 404 | No streams found for the given content |
| `STREAM_FETCH_FAILED` | 502 | Failed to fetch streams from providers |
| `STREAM_TIMEOUT` | 504 | Provider request timed out |

### Debrid Errors
| Code | HTTP Status | Description |
|------|-------------|-------------|
| `DEBRID_AUTH_FAILED` | 401 | Real-Debrid API token is invalid or expired |
| `DEBRID_RATE_LIMITED` | 429 | Too many requests to Real-Debrid |
| `DEBRID_UNRESTRICT_FAILED` | 502 | Failed to unrestrict the link |
| `DEBRID_NOT_CACHED` | 200 | Link is not cached on Real-Debrid (returned with `is_cached: false`) |

### Catalog Errors
| Code | HTTP Status | Description |
|------|-------------|-------------|
| `CATALOG_NOT_FOUND` | 404 | Content not found in TMDB |
| `CATALOG_FETCH_FAILED` | 502 | Failed to fetch from TMDB API |
| `TMDB_API_ERROR` | 502 | TMDB API returned an error |

### Profile Errors
| Code | HTTP Status | Description |
|------|-------------|-------------|
| `PROFILE_NOT_FOUND` | 404 | Profile ID does not exist |
| `PROFILE_LIMIT_REACHED` | 400 | Maximum number of profiles reached |
| `PROFILE_VALIDATION_ERROR` | 400 | Invalid profile data (name too short, etc.) |

### Preference Errors
| Code | HTTP Status | Description |
|------|-------------|-------------|
| `PREFERENCE_NOT_FOUND` | 404 | Preference key does not exist |
| `PREFERENCE_INVALID_VALUE` | 400 | Invalid preference value |

### General Errors
| Code | HTTP Status | Description |
|------|-------------|-------------|
| `INTERNAL_ERROR` | 500 | Unexpected server error |
| `VALIDATION_ERROR` | 400 | Request validation failed |
| `NOT_FOUND` | 404 | Resource not found |
| `SERVICE_UNAVAILABLE` | 503 | External service is down |
