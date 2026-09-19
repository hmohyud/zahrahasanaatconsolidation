"""
Tell panned stills apart from live footage.

Frame differencing can't do it: a photo panned quickly produces just as much
pixel change as people moving. So for each frame pair compute dense optical
flow, fit an affine model to the whole flow field (that absorbs pan, zoom,
rotation — i.e. everything a Ken Burns move does), subtract it, and measure
what's left. What's left is subject motion: people moving independently of
the camera. A panned photograph has essentially none.

Emits per-second `global` (camera move, px/sample) and `residual` (subject
motion, px RMS).
"""
import cv2
import numpy as np
import sys

SRC = sys.argv[1] if len(sys.argv) > 1 else 'zh-film-master.mp4'
OUT = sys.argv[2] if len(sys.argv) > 2 else 'stills.txt'
STEP = 3          # compare every 3rd frame (~10 samples/sec)
W, H = 400, 225

cap = cv2.VideoCapture(SRC)
fps = cap.get(cv2.CAP_PROP_FPS) or 30.0

# affine design matrix: flow ~ a0 + a1*x + a2*y, solved once for the fixed grid
ys, xs = np.mgrid[0:H, 0:W].astype(np.float32)
A = np.stack([np.ones(W * H, np.float32), xs.ravel() / W, ys.ravel() / H], 1)
pinv = np.linalg.pinv(A)

prev = None
idx = 0
rows = []
while True:
    ok, frame = cap.read()
    if not ok:
        break
    if idx % STEP == 0:
        g = cv2.cvtColor(cv2.resize(frame, (W, H)), cv2.COLOR_BGR2GRAY)
        if prev is not None:
            flow = cv2.calcOpticalFlowFarneback(prev, g, None, 0.5, 3, 15, 3, 5, 1.2, 0)
            fx, fy = flow[..., 0].ravel(), flow[..., 1].ravel()
            mx, my = A @ (pinv @ fx), A @ (pinv @ fy)          # global component
            rx, ry = fx - mx, fy - my                           # subject motion
            rows.append((
                idx / fps,
                float(np.sqrt(np.mean(mx ** 2 + my ** 2))),
                float(np.sqrt(np.mean(rx ** 2 + ry ** 2))),
            ))
        prev = g
    idx += 1
cap.release()

with open(OUT, 'w') as f:
    for t, gmag, res in rows:
        f.write(f"{t:.3f} {gmag:.4f} {res:.4f}\n")
print(f"wrote {len(rows)} samples over {rows[-1][0]:.1f}s -> {OUT}")
