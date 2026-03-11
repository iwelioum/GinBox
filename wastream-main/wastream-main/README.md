<p align="center"><img src="https://raw.githubusercontent.com/Dyhlio/wastream/refs/heads/main/wastream/public/wastream-logo.jpg" width="150"></p>

<p align="center">
  <a href="https://github.com/Dyhlio/wastream/releases/latest">
    <img alt="GitHub release" src="https://img.shields.io/github/v/release/Dyhlio/wastream?style=flat-square&logo=github&logoColor=white&labelColor=1C1E26&color=4A5568">
  </a>
  <a href="https://www.python.org/">
    <img alt="Python 3.11+" src="https://img.shields.io/badge/python-3.11+-blue?style=flat-square&logo=python&logoColor=white&labelColor=1C1E26&color=4A5568">
  </a>
  <a href="https://github.com/Dyhlio/wastream/blob/main/LICENSE">
    <img alt="License" src="https://img.shields.io/github/license/Dyhlio/wastream?style=flat-square&labelColor=1C1E26&color=4A5568">
  </a>
</p>

<p align="center">
  <strong>Unofficial Stremio addon to convert DDL (Direct Download Links) into streamable content via debrid services</strong>
</p>

---

## About

**WAStream** is a Stremio addon that converts direct download links (DDL) from various sources into instant streamable content through debrid services. It provides seamless integration of multiple DDL sources directly into your Stremio interface.

> **Note:** This project is a fork of [spel987/Wawacity-Stremio-Addon](https://github.com/spel987/Wawacity-Stremio-Addon), which has been archived. I released version 2.0.0 on the original repository, I have now taken over the entire project based on that v2.0.0 release.

### What WAStream Does

- **Multi-source aggregation**: Scrapes and aggregates content from configured DDL sources
- **Debrid integration**: Converts DDL into streamable links via debrid services
- **Smart caching**: Intelligent cache system with distributed locking for optimal performance
- **Instant availability check**: Verifies link availability before streaming
- **Advanced filtering**: Filter by quality, language, size, and more
- **Multi-language support**: Handles multiple audio tracks and subtitle languages
- **Metadata enrichment**: Integrates TMDB and Kitsu for comprehensive metadata

---

## Features

### Supported Content Types

- **Movies** / **Series** / **Anime**

### Supported Debrid Services

- **AllDebrid** - Multi-host support
- **TorBox** - Multi-host support
- **Premiumize** - Multi-host support
- **1Fichier** - Direct 1Fichier premium
- **NZBDav** - Usenet via SABnzbd + WebDAV

### Smart Features

- **Instant cache check** - Verifies availability before conversion
- **Round-robin processing** - Optimized link checking algorithm
- **Quality filtering** - Filter by resolution (4K, 1080p, 720p, etc.)
- **Language filtering** - Multi-language and subtitle support
- **Size filtering** - Filter by file size
- **Deduplication** - Hide identical results from different hosters
- **Password protection** - Optional addon password protection
- **Database support** - SQLite or PostgreSQL

### Admin Dashboard

- **Statistics** - Users, searches, streams, cache stats
- **Live logs** - Real-time log viewer with filtering
- **Source status** - Monitor source and proxy health
- **System info** - RAM/CPU usage, database status
- **Dead links management** - Add/remove dead links
- **WASource** - Add custom links compatible with all debrid services
- **Remote system** - Share dead links, cache and WASource between instances

---

## Installation

> **For environment configuration, see [`.env.example`](.env.example)**

### Docker Compose (Recommended)

1. **Create a `docker-compose.yml` file**:

```yaml
services:
  wastream:
    image: dyhlio/wastream:latest
    container_name: wastream
    ports:
      - "7000:7000"
    volumes:
      - ./data:/app/data
    environment:
      - SECRET_KEY=your-secret-key-min-32-chars # Required - Generate with: openssl rand -hex 32
      - ADMIN_PASSWORD=your-admin-password-here # (Optional) Password for admin dashboard - Leave empty to disable admin
      - WAWACITY_URL=https://example.com
      - FREE_TELECHARGER_URL=https://example.com
      - DARKI_API_URL=https://api.example.com
      - DARKI_API_KEY=your_api_key_here
      - MOVIX_URL=https://example.com
      - WEBSHARE_URL=https://example.com
      - DATABASE_TYPE=sqlite
      - DATABASE_PATH=/app/data/wastream.db
    restart: unless-stopped
```

2. **Start the container**:
```bash
docker-compose up -d
```

3. **Check logs**:
```bash
docker-compose logs -f wastream
```

### Manual Installation

#### Prerequisites
- Python 3.11 or higher
- Git

#### Steps

1. **Clone the repository**:
```bash
git clone https://github.com/Dyhlio/wastream.git
cd wastream
```

2. **Install dependencies**:
```bash
pip install .
```

3. **Configure environment**:
```bash
cp .env.example .env
# Edit .env according to your needs
```

4. **Start the application**:
```bash
python -m wastream.main
```

---

## Configuration

### Add to Stremio

1. **Access** `http://localhost:7000` in your browser
2. **Configure** your debrid API keys and TMDB token
3. **Click** "Generate link"

The addon will appear in your Stremio addon list.

### Admin Dashboard

1. **Set** `ADMIN_PASSWORD` in your `.env` file
2. **Access** `http://localhost:7000/admin` in your browser
3. **Login** with your admin password

### Environment Variables

See [`.env.example`](.env.example) for all available configuration options.

**Required:**
- `SECRET_KEY` - Encryption key for user configs (min 32 chars) - Generate with: `openssl rand -hex 32`
- `WAWACITY_URL`, `FREE_TELECHARGER_URL`, `DARKI_API_URL`, `MOVIX_URL` or `WEBSHARE_URL` - At least one source must be configured
- Debrid API key - Configured via web interface
- TMDB API token - Configured via web interface

**Optional:**
- `ADMIN_PASSWORD` - Password for admin dashboard
- `DARKI_API_KEY` - Optional API key for Darki-API
- `ADDON_PASSWORD` - Password protect your addon
- `LOG_LEVEL` - Set log level (DEBUG, INFO, ERROR)
- `PROXY_URL` - HTTP proxy for source access
- And many more... (see `.env.example`)

---

## Troubleshooting

### Debug

```bash
# Health check
curl http://localhost:7000/health

# Docker logs
docker-compose logs -f wastream

# Enable debug mode
LOG_LEVEL=DEBUG python -m wastream.main
```

---

## License

This project is licensed under the MIT License. See the [LICENSE](LICENSE) file for details.

---

## Disclaimer

**WAStream is an unofficial project developed independently.**

- **NOT affiliated with any DDL source**
- **NOT affiliated with Stremio**
- **Use this addon at your own risk**
- **Respect the terms of service of source sites**
- **The author disclaims all responsibility for the use of this addon**

This addon is provided "as is" without any warranty. It is the user's responsibility to verify the legality of its use in their jurisdiction.

---
