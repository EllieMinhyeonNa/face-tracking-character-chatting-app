# Face Tracking Character Chat - Architecture

## 📁 Project Structure

```
face-tracking-character-chatting-app/
├── index.html                  # Entry point, loads all dependencies
├── sketch.js                   # Main p5.js sketch, orchestrates everything
├── networking-peer.js          # PeerJS P2P networking for 2 people
├── config.js                   # Visual configuration (all tweakable parameters)
│
├── constants/
│   └── keypoints.js           # MediaPipe face mesh landmark indices
│
├── components/
│   ├── eyes.js                # Eye rendering with pupil tracking
│   ├── lips.js                # Lip rendering with open/closed states
│   └── eyebrows.js            # Eyebrow rendering with raise detection
│
└── effects/
    ├── events.js              # Event detection (surprised, etc.)
    └── speedlines.js          # Speed line visual effects

```

## 🔄 Data Flow

### 1. Face Detection (Local)
```
Webcam → ml5.faceMesh → 468 keypoints → faces[] array
```

### 2. Data Extraction
```
faces[0] → extractFaceData() → ~50 essential keypoints + expressions
```

### 3. P2P Transmission
```
Local face data → PeerJS connection → Remote device
Remote device data → PeerJS connection → Local display
```

### 4. Rendering
```
For local character:
  faces[0] (full keypoints) → drawEyes/Lips/Eyebrows → Canvas

For remote character:
  Received keypoints → reconstructFaceFromKeypoints() → drawEyes/Lips/Eyebrows → Canvas
```

## 🎨 Rendering Pipeline

### Local Character (Full Quality)
1. Direct access to all 468 face keypoints
2. Precise pupil tracking
3. Accurate lip contours
4. Real-time eyebrow raise detection

### Remote Character (High Quality)
1. Receives ~50 essential keypoints via P2P
2. Reconstructs sparse face.keypoints array
3. Uses same drawing functions as local
4. 90% data reduction, maintains visual quality

## 🌐 Networking Architecture

### PeerJS P2P (Current Implementation)
- **Type**: Direct peer-to-peer connection
- **Capacity**: 2 people
- **Latency**: Very low (direct connection)
- **Server**: None needed (uses PeerJS cloud signaling)

### Connection Flow:
```
Person 1:                          Person 2:
Opens app
  ↓
Creates room (gets ID)
  ↓
Shows room code                    Gets room code URL
  ↓                               Opens URL with ?room=ID
Accepts connection      ←---P2P--->  Connects to Person 1
  ↓                               ↓
Both exchange face data continuously
```

## 📊 Data Optimization

### Transmitted Data (~50 points):
- **Face structure**: 4 points (nose, face edges)
- **Eyes**: 10 points (pupils, corners, top/bottom)
- **Eyebrows**: 20 points (5 per row × 2 eyebrows × 2 rows)
- **Lips**: 14 points (corners, center, smooth curves)
- **Metadata**: Scale, expressions, timestamp

### NOT Transmitted:
- 418 unused face mesh points
- Full lip contours (reconstructed from subset)
- Redundant facial structure data

**Result**: ~10KB/frame instead of ~100KB/frame (90% reduction)

## 🎯 Key Design Decisions

### 1. Component-Based Architecture
**Why**: Each facial feature is independent, making it easy to:
- Add new features (nose, ears, etc.)
- Modify individual components without affecting others
- Reuse components for local and remote rendering

### 2. Configuration Centralization
**Why**: All visual parameters in `config.js` allows:
- Easy tweaking during development
- Keyboard shortcuts to toggle debug features
- Consistent styling across components

### 3. PeerJS vs Socket.io
**Why PeerJS**:
- ✅ No server setup required
- ✅ Lower latency (direct P2P)
- ✅ Simpler demo setup (just share URL)
- ✅ No hosting costs

**Why NOT Socket.io**:
- ❌ Requires server deployment
- ❌ Higher latency (data goes through server)
- ❌ More complex demo setup

### 4. Essential Keypoints Only
**Why**: Transmitting all 468 points would:
- ❌ Cause network lag
- ❌ Increase bandwidth usage
- ❌ Provide no visual improvement

Transmitting 50 points:
- ✅ 90% smaller payload
- ✅ Maintains high visual quality
- ✅ Enables smooth real-time updates

## 🚀 Extensibility

### Adding New Facial Features
1. Create `components/FEATURE.js`
2. Define required keypoints in `constants/keypoints.js`
3. Add keypoints to `extractFaceData()` in `networking-peer.js`
4. Add drawing function calls in `sketch.js`
5. Add configuration in `config.js`

### Adding New Effects
1. Create `effects/EFFECT.js`
2. Define trigger conditions in `effects/events.js`
3. Call effect in `sketch.js` based on events

### Scaling to More People
To support 3+ people, would need to:
1. Switch from PeerJS to mesh network or star topology
2. Update grid layout in `sketch.js`
3. Handle multiple remote participants in rendering loop

## 🐛 Known Limitations

1. **2-person maximum**: PeerJS simple connection limits to 2
2. **HTTPS required**: Camera access needs secure connection for remote devices
3. **Same network helpful**: P2P works best when on same WiFi (NAT traversal can be tricky)
4. **No persistence**: Room codes expire when host disconnects

## 📝 Configuration Guide

### Visual Tweaking (`config.js`)
- `eyes.exaggerationFactor`: How much bigger than real eyes (1.7 = 170%)
- `eyebrows.raiseHeightMultiplier`: How dramatic eyebrow raises are
- `lips.strokeWeight`: Thickness of lip outline
- `debug.showKeypoints`: Show/hide green face mesh dots

### Keyboard Shortcuts
- `K`: Toggle keypoints display
- `I`: Toggle keypoint indices
- `V`: Toggle video feed
- `D`: Toggle eyebrow debug
- `P`: Toggle participant IDs
- `H`: Show help menu

## 🎬 Demo Instructions

### For Presenter (Person 1):
1. Open `https://localhost:8080` in Chrome
2. Allow camera access
3. Share the URL shown in the overlay with Person 2

### For Participant (Person 2):
1. Open the shared URL (with `?room=...`)
2. Allow camera access
3. Both characters appear side-by-side!

### Troubleshooting:
- **Camera not working**: Make sure using HTTPS (not HTTP)
- **Can't connect**: Check both on same WiFi network
- **Frozen screen**: Refresh both browsers
