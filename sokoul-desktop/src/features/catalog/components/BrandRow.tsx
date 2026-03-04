// BrandRow.tsx — Exact replica of Viewers.js from Disney+ clone
//
// 5 brand tiles (Disney/Pixar/Marvel/StarWars/NatGeo) in a 5-column grid
// padding-top 56.25% · border-radius 10px · border 3px · scale(1.05) hover
// img (z-index 1) + video (opacity 0→1 on hover) — exact Viewers.js CSS

import * as React from 'react';

// ── Brand data — exact same images/videos as clone ────────────────────────────

const BRANDS = [
  { name: 'Disney',              img: '/images/viewers-disney.png',    video: '/videos/1564674844-disney.mp4' },
  { name: 'Pixar',               img: '/images/viewers-pixar.png',     video: '/videos/1564676714-pixar.mp4' },
  { name: 'Marvel',              img: '/images/viewers-marvel.png',    video: '/videos/1564676115-marvel.mp4' },
  { name: 'Star Wars',           img: '/images/viewers-starwars.png',  video: '/videos/1608229455-star-wars.mp4' },
  { name: 'National Geographic', img: '/images/viewers-national.png',  video: '/videos/1564676296-national-geographic.mp4' },
] as const;

// ── BrandRow ──────────────────────────────────────────────────────────────────

const BrandRow: React.FC = () => {
  return (
    <div
      className="mt-[30px] grid gap-[25px]"
      style={{
        padding: '30px 0 26px',
        gridTemplateColumns: 'repeat(5, minmax(0, 1fr))',
      }}
    >
      {BRANDS.map((brand) => (
        <div
          key={brand.name}
          className="group/viewer relative overflow-hidden rounded-[10px] cursor-pointer"
          style={{
            paddingTop: '56.25%',
            border: '3px solid rgba(249,249,249,0.1)',
            boxShadow: 'rgb(0 0 0 / 69%) 0px 26px 30px -10px, rgb(0 0 0 / 73%) 0px 16px 10px -10px',
            transition: 'all 250ms cubic-bezier(0.25, 0.46, 0.45, 0.94) 0s',
          }}
          onMouseEnter={(e) => {
            const el = e.currentTarget;
            el.style.transform = 'scale(1.05)';
            el.style.borderColor = 'rgba(249,249,249,0.8)';
            el.style.boxShadow = 'rgb(0 0 0 / 80%) 0px 40px 58px -16px, rgb(0 0 0 / 72%) 0px 30px 22px -10px';
            const video = el.querySelector('video');
            if (video) video.style.opacity = '1';
          }}
          onMouseLeave={(e) => {
            const el = e.currentTarget;
            el.style.transform = 'scale(1)';
            el.style.borderColor = 'rgba(249,249,249,0.1)';
            el.style.boxShadow = 'rgb(0 0 0 / 69%) 0px 26px 30px -10px, rgb(0 0 0 / 73%) 0px 16px 10px -10px';
            const video = el.querySelector('video');
            if (video) video.style.opacity = '0';
          }}
        >
          <img
            src={brand.img}
            alt={brand.name}
            style={{
              inset: '0px',
              display: 'block',
              height: '100%',
              objectFit: 'cover',
              opacity: 1,
              position: 'absolute',
              transition: 'opacity 500ms ease-in-out 0s',
              width: '100%',
              zIndex: 1,
              top: 0,
            }}
          />
          <video
            autoPlay
            loop
            playsInline
            muted
            style={{
              width: '100%',
              height: '100%',
              position: 'absolute',
              top: '0px',
              opacity: 0,
              zIndex: 0,
              transition: 'opacity 500ms ease-in-out 0s',
            }}
          >
            <source src={brand.video} type="video/mp4" />
          </video>
        </div>
      ))}
    </div>
  );
};

export { BrandRow };
