// ══════════════════════════════════════════════════════════════════════
// flaresolverr.rs — Auto-configure FlareSolverr proxy in Prowlarr
//
// At startup:
//   1. Check FlareSolverr is reachable
//   2. Create/find "flaresolverr" tag in Prowlarr
//   3. Create FlareSolverr proxy in Prowlarr if it doesn't exist
//   4. Tag known Cloudflare-protected indexers (e.g. 1337x)
// ══════════════════════════════════════════════════════════════════════

use crate::AppState;
use serde::Deserialize;
use serde_json::{json, Value};
use std::sync::Arc;
use tracing::{info, warn};

// ── Prowlarr API types ────────────────────────────────────────────────

#[derive(Debug, Deserialize)]
struct ProwlarrTag {
    id: i32,
    label: String,
}

#[derive(Debug, Deserialize)]
struct ProwlarrIndexer {
    id: i32,
    name: String,
    tags: Vec<i32>,
}

#[derive(Debug, Deserialize)]
struct ProxyResource {
    id: i32,
    implementation: Option<String>,
    fields: Option<Vec<Value>>,
    tags: Option<Vec<i32>>,
}

// ── Indexers known to require Cloudflare bypass ───────────────────────

const CF_PROTECTED_INDEXERS: &[&str] = &["1337x", "thepiratebay", "yts", "limetorrents"];

// ── Public entry point ────────────────────────────────────────────────

pub async fn setup_flaresolverr_proxy(state: &Arc<AppState>) {
    if state.flaresolverr_url.is_empty() {
        info!("FLARESOLVERR_URL not set — skipping FlareSolverr setup");
        return;
    }
    if state.prowlarr_url.is_empty() || state.prowlarr_key.is_empty() {
        info!("Prowlarr not configured — skipping FlareSolverr setup");
        return;
    }

    if !check_flaresolverr_alive(state).await {
        warn!(
            "FlareSolverr not reachable at {} — skipping setup",
            state.flaresolverr_url
        );
        return;
    }

    let tag_id = match ensure_tag(state).await {
        Ok(id) => id,
        Err(e) => {
            warn!("Failed to create FlareSolverr tag in Prowlarr: {}", e);
            return;
        }
    };

    if let Err(e) = ensure_proxy(state, tag_id).await {
        warn!("Failed to configure FlareSolverr proxy in Prowlarr: {}", e);
        return;
    }

    if let Err(e) = tag_cf_indexers(state, tag_id).await {
        warn!("Failed to tag CF-protected indexers: {}", e);
    }
}

// ── Step 1: FlareSolverr health check ────────────────────────────────

async fn check_flaresolverr_alive(state: &Arc<AppState>) -> bool {
    state
        .http_client
        .get(&state.flaresolverr_url)
        .timeout(std::time::Duration::from_secs(5))
        .send()
        .await
        .map(|r| r.status().is_success())
        .unwrap_or(false)
}

// ── Step 2: Create or find the "flaresolverr" tag ─────────────────────

async fn ensure_tag(state: &Arc<AppState>) -> Result<i32, String> {
    let url = format!("{}/api/v1/tag", state.prowlarr_url);

    let tags: Vec<ProwlarrTag> = state
        .http_client
        .get(&url)
        .header("X-Api-Key", &state.prowlarr_key)
        .send()
        .await
        .map_err(|e| e.to_string())?
        .json()
        .await
        .map_err(|e| e.to_string())?;

    if let Some(existing) = tags.iter().find(|t| t.label.eq_ignore_ascii_case("flaresolverr")) {
        info!("FlareSolverr tag already exists (id={})", existing.id);
        return Ok(existing.id);
    }

    let created: ProwlarrTag = state
        .http_client
        .post(&url)
        .header("X-Api-Key", &state.prowlarr_key)
        .json(&json!({ "label": "flaresolverr" }))
        .send()
        .await
        .map_err(|e| e.to_string())?
        .json()
        .await
        .map_err(|e| e.to_string())?;

    info!("Created FlareSolverr tag in Prowlarr (id={})", created.id);
    Ok(created.id)
}

// ── Step 3: Create FlareSolverr proxy if absent ───────────────────────

async fn ensure_proxy(state: &Arc<AppState>, tag_id: i32) -> Result<(), String> {
    let list_url = format!("{}/api/v1/indexerproxy", state.prowlarr_url);

    let proxies: Vec<ProxyResource> = state
        .http_client
        .get(&list_url)
        .header("X-Api-Key", &state.prowlarr_key)
        .send()
        .await
        .map_err(|e| e.to_string())?
        .json()
        .await
        .map_err(|e| e.to_string())?;

    let prowlarr_host = if !state.flaresolverr_prowlarr_url.is_empty() {
        state.flaresolverr_prowlarr_url.trim_end_matches('/')
    } else {
        state.flaresolverr_url.trim_end_matches('/')
    };

    // If proxy already exists, check if host URL is correct and fix it if needed
    if let Some(existing) = proxies.iter().find(|p| {
        p.implementation
            .as_deref()
            .map(|s| s.eq_ignore_ascii_case("FlareSolverr"))
            .unwrap_or(false)
    }) {
        let current_host = existing
            .fields
            .as_ref()
            .and_then(|f| f.iter().find(|field| field["name"].as_str() == Some("host")))
            .and_then(|f| f["value"].as_str())
            .unwrap_or("")
            .trim_end_matches('/');

        if current_host.eq_ignore_ascii_case(prowlarr_host) {
            info!("FlareSolverr proxy already correct ({})", current_host);
            return Ok(());
        }

        // Wrong host — update it
        info!("FlareSolverr proxy has wrong host ({}) — updating to {}", current_host, prowlarr_host);
        return update_proxy_host(state, existing.id, prowlarr_host, existing.tags.clone().unwrap_or_default()).await;
    }

    // Fetch schema to get correct configContract + field structure
    let schema_url = format!("{}/api/v1/indexerproxy/schema", state.prowlarr_url);
    let schemas: Vec<Value> = state
        .http_client
        .get(&schema_url)
        .header("X-Api-Key", &state.prowlarr_key)
        .send()
        .await
        .map_err(|e| e.to_string())?
        .json()
        .await
        .map_err(|e| e.to_string())?;

    let schema = schemas
        .iter()
        .find(|s| {
            s["implementation"]
                .as_str()
                .map(|v| v.eq_ignore_ascii_case("FlareSolverr"))
                .unwrap_or(false)
        })
        .cloned()
        .ok_or_else(|| "FlareSolverr implementation not found in Prowlarr schema — is it supported by your Prowlarr version?".to_string())?;

    // Patch fields: set host = flaresolverr_url
    let mut fields: Vec<Value> = schema["fields"]
        .as_array()
        .cloned()
        .unwrap_or_default();

    for field in &mut fields {
        if field["name"].as_str() == Some("host") {
            field["value"] = json!(prowlarr_host);
        }
    }

    let body = json!({
        "name": "FlareSolverr",
        "implementation": schema["implementation"],
        "implementationName": schema["implementationName"],
        "configContract": schema["configContract"],
        "fields": fields,
        "tags": [tag_id],
    });

    let resp = state
        .http_client
        .post(&list_url)
        .header("X-Api-Key", &state.prowlarr_key)
        .json(&body)
        .send()
        .await
        .map_err(|e| e.to_string())?;

    if resp.status().is_success() {
        info!("FlareSolverr proxy created in Prowlarr (tag_id={})", tag_id);
        Ok(())
    } else {
        let status = resp.status();
        let body = resp.text().await.unwrap_or_default();
        Err(format!("Prowlarr returned {} when creating proxy: {}", status, body))
    }
}

// ── Update existing proxy host ────────────────────────────────────────

async fn update_proxy_host(state: &Arc<AppState>, proxy_id: i32, host: &str, tags: Vec<i32>) -> Result<(), String> {
    let url = format!("{}/api/v1/indexerproxy/{}", state.prowlarr_url, proxy_id);
    let body = json!({
        "id": proxy_id,
        "name": "FlareSolverr",
        "implementation": "FlareSolverr",
        "implementationName": "FlareSolverr",
        "configContract": "FlareSolverrSettings",
        "fields": [
            {"name": "host", "value": host},
            {"name": "requestTimeout", "value": 60}
        ],
        "tags": tags,
    });

    let resp = state
        .http_client
        .put(&url)
        .header("X-Api-Key", &state.prowlarr_key)
        .json(&body)
        .send()
        .await
        .map_err(|e| e.to_string())?;

    if resp.status().is_success() {
        info!("FlareSolverr proxy host updated to {}", host);
        Ok(())
    } else {
        let status = resp.status();
        let body = resp.text().await.unwrap_or_default();
        Err(format!("Prowlarr returned {} when updating proxy: {}", status, body))
    }
}

// ── Step 4: Tag CF-protected indexers ────────────────────────────────

async fn tag_cf_indexers(state: &Arc<AppState>, tag_id: i32) -> Result<(), String> {
    let list_url = format!("{}/api/v1/indexer", state.prowlarr_url);

    let indexers: Vec<ProwlarrIndexer> = state
        .http_client
        .get(&list_url)
        .header("X-Api-Key", &state.prowlarr_key)
        .send()
        .await
        .map_err(|e| e.to_string())?
        .json()
        .await
        .map_err(|e| e.to_string())?;

    for indexer in indexers {
        let name_lc = indexer.name.to_lowercase();
        let is_cf_protected = CF_PROTECTED_INDEXERS
            .iter()
            .any(|n| name_lc.contains(n));

        if !is_cf_protected || indexer.tags.contains(&tag_id) {
            continue;
        }

        // Fetch full indexer resource to PATCH it
        let detail_url = format!("{}/api/v1/indexer/{}", state.prowlarr_url, indexer.id);
        let mut full: Value = state
            .http_client
            .get(&detail_url)
            .header("X-Api-Key", &state.prowlarr_key)
            .send()
            .await
            .map_err(|e| e.to_string())?
            .json()
            .await
            .map_err(|e| e.to_string())?;

        // Append tag_id
        if let Some(tags) = full["tags"].as_array_mut() {
            if !tags.iter().any(|t| t.as_i64() == Some(tag_id as i64)) {
                tags.push(json!(tag_id));
            }
        }

        let resp = state
            .http_client
            .put(&detail_url)
            .header("X-Api-Key", &state.prowlarr_key)
            .json(&full)
            .send()
            .await
            .map_err(|e| e.to_string())?;

        if resp.status().is_success() {
            info!("Tagged indexer '{}' with flaresolverr tag", indexer.name);
        } else {
            warn!("Failed to tag indexer '{}': {}", indexer.name, resp.status());
        }
    }

    Ok(())
}
