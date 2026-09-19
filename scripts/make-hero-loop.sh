#!/usr/bin/env bash
# Homepage hero loop, v5 — eleven shots, real-time playback.
#
# v4 played at 0.8x; this is straight 1.0x at the native 30fps, with ordinary
# 2.1s holds and 0.5s dissolves. No speed manipulation, no extended holds.
#
# Shot selection is measured, not eyeballed (see scripts/detect_stills.py and
# scripts/detect_captions.py). Every window below is caption-free with an
# optical-flow residual >= 0.9 mean and >= 0.5 at every moment, so no panned
# stills and no burnt-in lower thirds.
set -e
SRC=zh-film-master.mp4
XF=0.5

#        ration  women   doctor  mats-A  drums  volnteer kids    move    women+  mats-B  kids
#        hand    circle                                  celebr  circle  toddler         drums
STARTS=(137.8   77.6    194.8   230.6   32.6   239.6    96.2    223.4   80.8    233.6   248.0)
DURS=(    2.1     2.1     2.1     2.1    2.1     2.1     2.1      2.1     2.1     2.1     2.1)

N=${#STARTS[@]}
TOTAL=$(awk "BEGIN{split(\"${DURS[*]}\",d,\" \");s=0;for(i=1;i<=$N;i++)s+=d[i];printf \"%.2f\", s-($N-1)*$XF}")
FADEOUT=$(awk "BEGIN{printf \"%.2f\", $TOTAL - 0.5}")
echo "clips=$N  total=${TOTAL}s  real time @ 30fps"

IN=()
for i in "${!STARTS[@]}"; do IN+=(-ss "${STARTS[$i]}" -t "${DURS[$i]}" -i "$SRC"); done

FC=""
for ((i=0; i<N; i++)); do
  FC+="[$i:v]scale=1920:1080:force_original_aspect_ratio=increase,crop=1920:1080,setsar=1,"
  FC+="fps=30,setpts=PTS-STARTPTS[v$i];"
done
for ((i=0; i<N-1; i++)); do
  OFF=$(awk "BEGIN{split(\"${DURS[*]}\",d,\" \");s=0;for(j=1;j<=$i+1;j++)s+=d[j];printf \"%.3f\", s-($i+1)*$XF}")
  SRCLBL=$([ $i -eq 0 ] && echo "[v0]" || echo "[x$i]")
  FC+="${SRCLBL}[v$((i+1))]xfade=transition=fade:duration=$XF:offset=$OFF[x$((i+1))];"
done
FC+="[x$((N-1))]fade=t=in:st=0:d=0.5,fade=t=out:st=$FADEOUT:d=0.5,format=yuv420p[out]"

ffmpeg -y -v error -stats "${IN[@]}" -filter_complex "$FC" -map "[out]" -an -r 30 \
  -c:v libx264 -preset slow -crf 29 -maxrate 1600k -bufsize 3200k \
  -profile:v high -level 4.0 -g 60 -movflags +faststart \
  zh-hero-loop.mp4
echo
ffprobe -v error -show_entries format=duration,size -show_entries stream=r_frame_rate,nb_frames \
  -of default=noprint_wrappers=1 zh-hero-loop.mp4
