"""
Find every second of the film that has a burnt-in lower-third caption.

Picking clips by hand kept catching captions I'd missed, so detect them:
a caption is bright, THIN (letter strokes) and TEMPORALLY STATIC while the
footage behind it moves. Bright-but-thick (a white shirt) or bright-but-moving
(a sunlit window panning) both fail the test.

Emits one line per sampled frame: time, score.
"""
import cv2
import numpy as np
import sys

SRC = sys.argv[1] if len(sys.argv) > 1 else 'zh-film-master.mp4'
OUT = sys.argv[2] if len(sys.argv) > 2 else 'captions.txt'
STEP = 3
W, H = 640, 360
BAND = (int(H * 0.70), int(H * 0.99))     # lower third, where the titles sit

cap = cv2.VideoCapture(SRC)
fps = cap.get(cv2.CAP_PROP_FPS) or 30.0
kernel = np.ones((3, 3), np.uint8)

masks, times = [], []
idx = 0
while True:
    ok, frame = cap.read()
    if not ok:
        break
    if idx % STEP == 0:
        g = cv2.cvtColor(cv2.resize(frame, (W, H)), cv2.COLOR_BGR2GRAY)[BAND[0]:BAND[1]]
        bright = (g > 205).astype(np.uint8)
        # thin structure only: what an erosion destroys is stroke-width detail
        thin = cv2.subtract(bright, cv2.erode(bright, kernel, iterations=1))
        masks.append(thin)
        times.append(idx / fps)
    idx += 1
cap.release()

masks = np.array(masks, dtype=np.float32)
# persistence over a ~1s sliding window: text holds still, footage does not
R = 5
scores = []
for i in range(len(masks)):
    lo, hi = max(0, i - R), min(len(masks), i + R + 1)
    persist = masks[lo:hi].min(axis=0)      # pixel thin+bright in EVERY frame
    scores.append(float(persist.sum()))

with open(OUT, 'w') as f:
    for t, s in zip(times, scores):
        f.write(f"{t:.3f} {s:.1f}\n")
print(f"wrote {len(scores)} samples -> {OUT}")

known_on = [30.5, 41.0, 61.0, 68.0, 117.0, 137.0, 142.5, 161.0, 187.5, 194.0, 204.0, 92.5, 215.0, 255.0]
known_off = [33.8, 78.0, 122.0, 232.0, 240.0, 248.0, 210.0, 225.0]
def at(t):
    i = min(range(len(times)), key=lambda j: abs(times[j] - t))
    return scores[i]
print("  caption present:", " ".join(f"{t:.0f}s={at(t):.0f}" for t in sorted(known_on)))
print("  caption absent: ", " ".join(f"{t:.0f}s={at(t):.0f}" for t in sorted(known_off)))
