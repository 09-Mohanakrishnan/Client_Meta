import React, { useState } from 'react';
import { X, Play, Pause, Volume2, VolumeX, Maximize2, ExternalLink, Edit2, Check, Smartphone, Monitor } from 'lucide-react';

const InstagramIcon = ({ size = 14 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
    <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
    <line x1="17.5" y1="6.5" x2="17.51" y2="6.5" />
  </svg>
);

const MetaAdPreviewModal = ({ isOpen, onClose, ad, onSaveMedia }) => {
  if (!isOpen || !ad) return null;

  const [activePlacement, setActivePlacement] = useState('facebook_mobile'); // 'facebook_mobile' | 'facebook_desktop' | 'instagram'
  const [isPlaying, setIsPlaying] = useState(true);
  const [isMuted, setIsMuted] = useState(true);
  const [isEditingUrl, setIsEditingUrl] = useState(false);

  const imageUrl = ad.image || ad.imageUrl || '';
  const videoUrl = ad.video || ad.videoUrl || '';
  const isVideo = Boolean(videoUrl);

  const [mediaInput, setMediaInput] = useState(isVideo ? videoUrl : imageUrl);

  const handleSaveMediaUrl = (e) => {
    e.preventDefault();
    if (!mediaInput.trim()) return;
    onSaveMedia?.(ad._id, isVideo ? 'video' : 'image', mediaInput.trim());
    setIsEditingUrl(false);
  };

  const adHeadline = ad.headline || ad.name || 'Special Offer';
  const adPrimaryText = ad.primaryText || `Explore our latest collection and special updates. Quality and service you can trust. Tap Learn More to discover details!`;
  const pageName = ad.adSetName || 'Sri Durga Bhavan';

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.7)',
        backdropFilter: 'blur(3px)',
        zIndex: 1000,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '16px',
      }}
      onClick={onClose}
    >
      <div
        style={{
          backgroundColor: '#fff',
          borderRadius: '10px',
          width: '100%',
          maxWidth: '680px',
          maxHeight: '92vh',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '0 12px 36px rgba(0,0,0,0.3)',
          overflow: 'hidden',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div style={{
          padding: '14px 20px',
          borderBottom: '1px solid #e4e6eb',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          backgroundColor: '#f7f8fa',
        }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '16px', fontWeight: 700, color: '#1c1e21' }}>Ad Creative Preview</span>
              <span style={{
                fontSize: '11px',
                padding: '2px 8px',
                borderRadius: '12px',
                backgroundColor: ad.status === 'Active' ? '#e7f7ed' : '#f0f2f5',
                color: ad.status === 'Active' ? '#31a24c' : '#65676b',
                fontWeight: 600,
              }}>
                {ad.status || 'Active'}
              </span>
              <span style={{
                fontSize: '11px',
                padding: '2px 6px',
                borderRadius: '4px',
                backgroundColor: '#e7f3ff',
                color: '#1877f2',
                fontWeight: 600,
              }}>
                {isVideo ? 'Video Ad' : 'Image Ad'}
              </span>
            </div>
            <div style={{ fontSize: '12px', color: '#65676b', marginTop: '2px' }}>
              {ad.adId || 'AD'} · {ad.name}
            </div>
          </div>
          <button
            onClick={onClose}
            style={{
              background: '#e4e6eb',
              border: 'none',
              borderRadius: '50%',
              width: '32px',
              height: '32px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              color: '#1c1e21',
            }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Placement Selector Bar */}
        <div style={{
          display: 'flex',
          gap: '8px',
          padding: '8px 20px',
          borderBottom: '1px solid #e4e6eb',
          backgroundColor: '#fff',
        }}>
          <button
            onClick={() => setActivePlacement('facebook_mobile')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '6px 12px',
              borderRadius: '6px',
              fontSize: '12px',
              fontWeight: 600,
              border: 'none',
              cursor: 'pointer',
              backgroundColor: activePlacement === 'facebook_mobile' ? '#e7f3ff' : 'transparent',
              color: activePlacement === 'facebook_mobile' ? '#1877f2' : '#65676b',
            }}
          >
            <Smartphone size={14} />
            Facebook Mobile Feed
          </button>
          <button
            onClick={() => setActivePlacement('facebook_desktop')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '6px 12px',
              borderRadius: '6px',
              fontSize: '12px',
              fontWeight: 600,
              border: 'none',
              cursor: 'pointer',
              backgroundColor: activePlacement === 'facebook_desktop' ? '#e7f3ff' : 'transparent',
              color: activePlacement === 'facebook_desktop' ? '#1877f2' : '#65676b',
            }}
          >
            <Monitor size={14} />
            Facebook Desktop
          </button>
          <button
            onClick={() => setActivePlacement('instagram')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '6px 12px',
              borderRadius: '6px',
              fontSize: '12px',
              fontWeight: 600,
              border: 'none',
              cursor: 'pointer',
              backgroundColor: activePlacement === 'instagram' ? '#fce8f3' : 'transparent',
              color: activePlacement === 'instagram' ? '#d62976' : '#65676b',
            }}
          >
            <InstagramIcon size={14} />
            Instagram Feed
          </button>
        </div>

        {/* Scrollable Preview Area */}
        <div style={{
          overflowY: 'auto',
          padding: '20px',
          backgroundColor: '#f0f2f5',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          flex: 1,
        }}>
          {/* Mockup Ad Card */}
          <div style={{
            width: '100%',
            maxWidth: activePlacement === 'facebook_mobile' ? '440px' : activePlacement === 'instagram' ? '420px' : '520px',
            backgroundColor: '#fff',
            borderRadius: activePlacement === 'instagram' ? '4px' : '8px',
            boxShadow: '0 2px 10px rgba(0,0,0,0.08)',
            border: '1px solid #dddfe2',
            overflow: 'hidden',
          }}>
            {/* Post Header */}
            <div style={{ padding: '12px 14px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{
                  width: '38px',
                  height: '38px',
                  borderRadius: '50%',
                  backgroundColor: '#006b4c',
                  color: '#fff',
                  fontWeight: 700,
                  fontSize: '14px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}>
                  {pageName.charAt(0) || 'M'}
                </div>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <span style={{ fontSize: '13px', fontWeight: 700, color: '#1c1e21' }}>{pageName}</span>
                    <span style={{ color: '#1877f2', fontSize: '12px' }}>✓</span>
                  </div>
                  <div style={{ fontSize: '11px', color: '#65676b', display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <span>Sponsored</span>
                    <span>·</span>
                    <span>Paid partnership</span>
                  </div>
                </div>
              </div>
              <div style={{ color: '#65676b', fontSize: '16px', fontWeight: 700, cursor: 'pointer' }}>···</div>
            </div>

            {/* Post Body / Primary Text */}
            <div style={{ padding: '0 14px 10px 14px', fontSize: '13px', color: '#1c1e21', lineHeight: '1.4' }}>
              {adPrimaryText}
            </div>

            {/* Media Container */}
            <div style={{ position: 'relative', width: '100%', backgroundColor: '#000', minHeight: '260px', maxHeight: '420px', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
              {isVideo ? (
                <div style={{ width: '100%', height: '100%', position: 'relative' }}>
                  <video
                    id="meta-preview-video"
                    src={videoUrl}
                    controls
                    playsInline
                    autoPlay
                    muted={isMuted}
                    loop
                    style={{ width: '100%', maxHeight: '400px', display: 'block', margin: '0 auto', objectFit: 'contain' }}
                  />
                </div>
              ) : imageUrl ? (
                <img
                  src={imageUrl}
                  alt={ad.name}
                  style={{ width: '100%', maxHeight: '400px', objectFit: 'cover', display: 'block' }}
                  onError={(e) => {
                    e.target.onerror = null;
                    e.target.src = 'https://images.unsplash.com/photo-1542751371-adc38448a05e?w=800&auto=format&fit=crop&q=80';
                  }}
                />
              ) : (
                <div style={{ padding: '40px 20px', textAlign: 'center', color: '#8a8d91' }}>
                  <p style={{ fontSize: '14px', fontWeight: 600 }}>No creative media URL found for this ad.</p>
                  <p style={{ fontSize: '12px', marginTop: '4px' }}>Click "Edit Media URL" below to add an image or video.</p>
                </div>
              )}
            </div>

            {/* CTA Bar (Facebook Format) */}
            {activePlacement !== 'instagram' && (
              <div style={{
                backgroundColor: '#f0f2f5',
                padding: '10px 14px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                borderTop: '1px solid #ebedf0',
              }}>
                <div style={{ minWidth: 0, flex: 1, paddingRight: '8px' }}>
                  <div style={{ fontSize: '10px', color: '#65676b', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                    ADFLOW.META.COM/OFFER
                  </div>
                  <div style={{ fontSize: '14px', fontWeight: 700, color: '#1c1e21', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {adHeadline}
                  </div>
                </div>
                <button
                  style={{
                    backgroundColor: '#e4e6eb',
                    border: 'none',
                    borderRadius: '4px',
                    padding: '6px 14px',
                    fontSize: '13px',
                    fontWeight: 700,
                    color: '#1c1e21',
                    cursor: 'pointer',
                    whiteSpace: 'nowrap',
                  }}
                >
                  Learn More
                </button>
              </div>
            )}

            {/* Social Engagement Bar */}
            <div style={{
              padding: '8px 14px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-around',
              borderTop: '1px solid #ebedf0',
              color: '#65676b',
              fontSize: '12px',
              fontWeight: 600,
            }}>
              <span style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}>👍 Like</span>
              <span style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}>💬 Comment</span>
              <span style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}>↗ Share</span>
            </div>
          </div>
        </div>

        {/* Footer Actions / Edit Media URL */}
        <div style={{
          padding: '12px 20px',
          borderTop: '1px solid #e4e6eb',
          backgroundColor: '#fff',
          display: 'flex',
          flexDirection: 'column',
          gap: '8px',
        }}>
          {isEditingUrl ? (
            <form onSubmit={handleSaveMediaUrl} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <input
                type="text"
                value={mediaInput}
                onChange={(e) => setMediaInput(e.target.value)}
                placeholder="Enter valid image or video URL (https://...)"
                style={{
                  flex: 1,
                  padding: '6px 10px',
                  borderRadius: '6px',
                  border: '1px solid #1877f2',
                  fontSize: '13px',
                  outline: 'none',
                }}
                autoFocus
              />
              <button
                type="submit"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                  padding: '6px 14px',
                  backgroundColor: '#1877f2',
                  color: '#fff',
                  border: 'none',
                  borderRadius: '6px',
                  fontWeight: 600,
                  fontSize: '13px',
                  cursor: 'pointer',
                }}
              >
                <Check size={14} /> Save
              </button>
              <button
                type="button"
                onClick={() => setIsEditingUrl(false)}
                style={{
                  padding: '6px 12px',
                  backgroundColor: '#e4e6eb',
                  color: '#1c1e21',
                  border: 'none',
                  borderRadius: '6px',
                  fontWeight: 600,
                  fontSize: '13px',
                  cursor: 'pointer',
                }}
              >
                Cancel
              </button>
            </form>
          ) : (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <button
                  onClick={() => setIsEditingUrl(true)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    padding: '6px 12px',
                    backgroundColor: '#f0f2f5',
                    color: '#1c1e21',
                    border: '1px solid #dddfe2',
                    borderRadius: '6px',
                    fontSize: '12px',
                    fontWeight: 600,
                    cursor: 'pointer',
                  }}
                >
                  <Edit2 size={13} /> Edit Media URL
                </button>
                {(imageUrl || videoUrl) && (
                  <a
                    href={videoUrl || imageUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                      padding: '6px 12px',
                      backgroundColor: '#f0f2f5',
                      color: '#1877f2',
                      border: '1px solid #dddfe2',
                      borderRadius: '6px',
                      fontSize: '12px',
                      fontWeight: 600,
                      textDecoration: 'none',
                      cursor: 'pointer',
                    }}
                  >
                    <ExternalLink size={13} /> Open Raw Media
                  </a>
                )}
              </div>
              <button
                onClick={onClose}
                style={{
                  padding: '6px 16px',
                  backgroundColor: '#1877f2',
                  color: '#fff',
                  border: 'none',
                  borderRadius: '6px',
                  fontSize: '13px',
                  fontWeight: 700,
                  cursor: 'pointer',
                }}
              >
                Done
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default MetaAdPreviewModal;
