import json
import time
from typing import Dict, Any, Optional

from wastream.config.settings import settings
from wastream.utils.database import database
from wastream.utils.logger import database_logger


# ===========================
# Get Stats from Real Data
# ===========================
async def get_stats_summary() -> Dict[str, Any]:
    try:
        from wastream.main import SERVER_START_TIME
        uptime_seconds = int(time.time()) - SERVER_START_TIME

        users_count = await database.fetch_val("SELECT COUNT(*) FROM users") or 0
        dead_links_count = await database.fetch_val("SELECT COUNT(*) FROM dead_links") or 0

        cache_rows = await database.fetch_all("SELECT cache_key, content FROM content_cache")
        unique_titles = set()
        streams_total = 0
        by_source_total: Dict[str, int] = {}
        by_content_type_total: Dict[str, int] = {}

        if cache_rows:
            for row in cache_rows:
                cache_key = row["cache_key"]
                parts = cache_key.split(":", 1)
                if len(parts) > 1:
                    unique_titles.add(parts[1])

                try:
                    content = json.loads(row["content"])
                    if isinstance(content, list):
                        streams_total += len(content)
                        for item in content:
                            if isinstance(item, dict):
                                src = item.get("source", "Unknown")
                                by_source_total[src] = by_source_total.get(src, 0) + 1

                                if "_movie" in cache_key:
                                    by_content_type_total["movie"] = by_content_type_total.get("movie", 0) + 1
                                elif "_series" in cache_key:
                                    by_content_type_total["series"] = by_content_type_total.get("series", 0) + 1
                                elif "_anime" in cache_key:
                                    by_content_type_total["anime"] = by_content_type_total.get("anime", 0) + 1
                except (json.JSONDecodeError, TypeError):
                    pass

        searches_cached = len(unique_titles)

        return {
            "uptime_seconds": uptime_seconds,
            "users": users_count,
            "dead_links": dead_links_count,
            "searches_cached": searches_cached,
            "streams_total": streams_total,
            "by_source_total": by_source_total,
            "by_content_type_total": by_content_type_total
        }

    except Exception as e:
        database_logger.error(f"[Stats] Failed to get stats: {type(e).__name__}")
        return {
            "uptime_seconds": 0,
            "users": 0,
            "dead_links": 0,
            "searches_cached": 0,
            "streams_total": 0,
            "by_source_total": {},
            "by_content_type_total": {}
        }


# ===========================
# Get Dead Links List
# ===========================
async def get_dead_links_list(limit: int = 100, offset: int = 0, url_filter: Optional[str] = None) -> Dict[str, Any]:
    try:
        params = {"limit": limit, "offset": offset}

        if url_filter:
            params["url_filter"] = f"%{url_filter}%"
            total = await database.fetch_val(
                "SELECT COUNT(*) FROM dead_links WHERE url LIKE :url_filter",
                params
            ) or 0
            rows = await database.fetch_all(
                "SELECT url, expires_at FROM dead_links WHERE url LIKE :url_filter ORDER BY expires_at DESC LIMIT :limit OFFSET :offset",
                params
            )
        else:
            total = await database.fetch_val("SELECT COUNT(*) FROM dead_links") or 0
            rows = await database.fetch_all(
                "SELECT url, expires_at FROM dead_links ORDER BY expires_at DESC LIMIT :limit OFFSET :offset",
                params
            )

        links = []
        for row in rows:
            links.append({
                "url": row["url"],
                "expires_at": row["expires_at"],
                "permanent": row["expires_at"] == -1
            })

        return {
            "total": total,
            "limit": limit,
            "offset": offset,
            "links": links
        }

    except Exception as e:
        database_logger.error(f"[Stats] Failed to get dead links: {type(e).__name__}")
        return {"total": 0, "limit": limit, "offset": offset, "links": []}


# ===========================
# Delete Dead Links
# ===========================
async def delete_dead_links(urls: list) -> int:
    try:
        if not urls:
            return 0

        deleted = 0
        for url in urls:
            result = await database.execute(
                "DELETE FROM dead_links WHERE url = :url",
                {"url": url}
            )
            if result:
                deleted += 1

        return deleted
    except Exception as e:
        database_logger.error(f"[Stats] Failed to delete dead links: {type(e).__name__}")
        return 0


async def delete_all_dead_links() -> int:
    try:
        total = await database.fetch_val("SELECT COUNT(*) FROM dead_links") or 0
        await database.execute("DELETE FROM dead_links")
        return total
    except Exception as e:
        database_logger.error(f"[Stats] Failed to delete all dead links: {type(e).__name__}")
        return 0


async def add_dead_links(urls: list) -> int:
    try:
        if not urls:
            return 0

        added = 0
        for url in urls:
            url = url.strip()
            if not url:
                continue

            existing = await database.fetch_val(
                "SELECT 1 FROM dead_links WHERE url = :url",
                {"url": url}
            )
            if existing:
                continue

            if settings.DEAD_LINK_TTL == -1:
                expires_at = -1
            else:
                expires_at = int(time.time()) + settings.DEAD_LINK_TTL

            await database.execute(
                "INSERT INTO dead_links (url, expires_at) VALUES (:url, :expires_at)",
                {"url": url, "expires_at": expires_at}
            )
            added += 1

        return added
    except Exception as e:
        database_logger.error(f"[Stats] Failed to add dead links: {type(e).__name__}")
        return 0


# ===========================
# Get Users Count
# ===========================
async def get_users_count() -> int:
    try:
        return await database.fetch_val("SELECT COUNT(*) FROM users") or 0
    except Exception as e:
        database_logger.error(f"[Stats] Failed to get users count: {type(e).__name__}")
        return 0
