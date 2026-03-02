// ══════════════════════════════════════════════════════════
// debrid.rs — Routes Real-Debrid
// RÈGLES :
//   POST /debrid/:info_hash  → pipeline magnet complet (add → wait → unrestrict)
//   POST /debrid/unrestrict  → unrestrict direct d'un lien RD-hébergé
// ══════════════════════════════════════════════════════════

use axum::{
    extract::{Path, State},
    response::Json,
    routing::post,
    Router,
};
use serde::Deserialize;
use serde_json::json;
use std::sync::Arc;
use crate::AppState;
use crate::errors::AppError;
use crate::models::Stream;
use crate::services::realdebrid;

pub fn router() -> Router<Arc<AppState>> {
    Router::new()
        // Route spécifique AVANT la route paramétrique
        .route("/unrestrict", post(unrestrict_handler))
        .route("/:info_hash", post(debrid_handler))
}

// ── POST /debrid/:info_hash ─────────────────────────────────────────────────
// Pipeline complet : magnet → add RD → wait downloaded → unrestrict → URL directe
pub async fn debrid_handler(
    Path(info_hash): Path<String>,
    State(state): State<Arc<AppState>>,
) -> Result<Json<serde_json::Value>, AppError> {
    let stream_stub = Stream {
        info_hash: Some(info_hash),
        url: None,
        file_idx: None,
        title: None,
        parsed_meta: crate::parser::parse_stream_title(""),
        behavior_hints: None,
    };
    let direct_link = realdebrid::get_direct_link(&stream_stub, &state).await?;
    Ok(Json(json!({ "url": direct_link })))
}

// ── POST /debrid/unrestrict ─────────────────────────────────────────────────
// Corps : { "magnet": "magnet:?xt=...", "cached": true/false }
// Retourne : { "stream_url": "<url-directe>" }
// Point d'entrée unique depuis usePlayback.ts → endpoints.debrid.unrestrict(magnet, cached)
#[derive(Deserialize)]
pub struct UnrestrictBody {
    pub magnet: String,
    #[allow(dead_code)]  // utilisé côté frontend pour l'UX (messages de statut)
    pub cached: bool,
}

pub async fn unrestrict_handler(
    State(state): State<Arc<AppState>>,
    Json(body): Json<UnrestrictBody>,
) -> Result<Json<serde_json::Value>, AppError> {
    let magnet_raw = body.magnet.trim();
    tracing::info!("Demande de débridage reçue pour: {}", magnet_raw);

    // Cas 1 : lien magnet direct
    if magnet_raw.starts_with("magnet:") {
        let info_hash = extract_info_hash(magnet_raw)
            .ok_or_else(|| AppError::NotFound("Impossible d'extraire l'info_hash du lien magnet".into()))?;

        tracing::info!("Traitement magnet via info_hash: {}", info_hash);
        let stream_stub = Stream {
            info_hash: Some(info_hash),
            url: None,
            file_idx: None,
            title: None,
            parsed_meta: crate::parser::parse_stream_title(""),
            behavior_hints: None,
        };
        let url = realdebrid::get_direct_link(&stream_stub, &state).await?;
        return Ok(Json(json!({ "stream_url": url })));
    }

    // Cas 2 : URL HTTP (Prowlarr ou RD)
    if magnet_raw.starts_with("http") {
        // Gérer les URLs localhost (Prowlarr)
        if magnet_raw.contains("localhost") || magnet_raw.contains("127.0.0.1") {
            tracing::info!("Lien Prowlarr détecté, tentative de téléchargement du torrent...");
            let resp = state.http_client.get(magnet_raw).send().await
                .map_err(|e| AppError::NetworkError(format!("Échec téléchargement Prowlarr: {}", e)))?;
            
            // Le client http de reqwest suit les redirections par défaut.
            // Donc, si on arrive ici avec une réponse, le 301 a déjà été géré.
            // On ne vérifie pas is_success() ici pour les 3xx qui seraient suivis.
            // Toute erreur non-2xx sur la destination finale sera gérée par la lecture des bytes.

            let bytes = resp.bytes().await
                .map_err(|e| AppError::NetworkError(format!("Échec lecture Prowlarr bytes: {}", e)))?;
            
            // Certains indexeurs renvoient un fichier texte contenant un magnet: au lieu d'un binaire torrent
            if bytes.starts_with(b"magnet:") {
                let magnet_str = String::from_utf8_lossy(&bytes);
                tracing::info!("Le lien Prowlarr a renvoyé un lien magnet textuel: {}", magnet_str);
                if let Some(info_hash) = extract_info_hash(&magnet_str) {
                    let stream_stub = Stream {
                        info_hash: Some(info_hash),
                        url: None,
                        file_idx: None,
                        title: None,
                        parsed_meta: crate::parser::parse_stream_title(""),
                        behavior_hints: None,
                    };
                    let url = realdebrid::get_direct_link(&stream_stub, &state).await?;
                    return Ok(Json(json!({ "stream_url": url })));
                }
            }

            // Validation : un fichier .torrent bencoded commence TOUJOURS par 'd'
            // Si Prowlarr a retourné du HTML, JSON d'erreur ou autre, on l'intercepte ici
            // au lieu d'envoyer du contenu invalide à Real-Debrid (qui retournerait 403 wrong_parameter)
            if !bytes.starts_with(b"d") {
                let preview = String::from_utf8_lossy(&bytes[..bytes.len().min(200)]);
                tracing::error!("Prowlarr n'a pas retourné un fichier .torrent valide ({} octets). Début: {}", bytes.len(), &preview[..preview.len().min(100)]);
                return Err(AppError::ExternalApiError(
                    "La source Prowlarr n'a pas fourni un fichier .torrent valide (l'indexeur a peut-être retourné une erreur). Essayez une autre source.".into()
                ));
            }

            // Sinon, traiter comme un fichier .torrent binaire
            tracing::info!("Envoi du fichier torrent binaire à Real-Debrid ({} octets)...", bytes.len());
            let url = realdebrid::get_direct_link_from_file(bytes.to_vec(), &state).await?;
            return Ok(Json(json!({ "stream_url": url })));
        }

        // Lien déjà Real-Debrid ou rdeb.io
        if magnet_raw.contains("real-debrid.com") || magnet_raw.contains("rdeb.io") {
            tracing::info!("Lien Real-Debrid direct détecté, unrestrict immédiat.");
            let result = realdebrid::unrestrict_link(magnet_raw, &state).await?;
            return Ok(Json(json!({ "stream_url": result.download })));
        }
        
        // URL Torrentio resolve (contient /resolve/realdebrid/) ou autre lien HTTP direct
        tracing::info!("Lien HTTP direct ou déjà résolu détecté: {}", magnet_raw);
        return Ok(Json(json!({ "stream_url": magnet_raw })));
    }

    tracing::warn!("Format de lien non reconnu: {}", magnet_raw);
    Err(AppError::NotFound("Format de lien non reconnu (doit être magnet: ou http)".into()))
}

// ── Extraction info_hash depuis un lien magnet ──────────────────────────────
fn extract_info_hash(magnet: &str) -> Option<String> {
    // Format standard : magnet:?xt=urn:btih:<HASH>&...
    for part in magnet.split('&') {
        let part = part.trim_start_matches("magnet:?");
        if part.starts_with("xt=urn:btih:") {
            let hash = part.trim_start_matches("xt=urn:btih:");
            // Stopper au prochain '&' si présent
            let hash = hash.split('&').next().unwrap_or(hash);
            return Some(hash.to_lowercase());
        }
    }
    None
}
