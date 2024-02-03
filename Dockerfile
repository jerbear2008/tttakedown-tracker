ARG YT_DLP_VERSION=2023.12.30 \
  FFMPEG_VERSION=autobuild-2024-02-02-15-50

FROM denoland/deno:alpine

ARG YT_DLP_VERSION \
  FFMPEG_VERSION
# install ffmpeg, yt-dlp, and tubeup
RUN wget -qO- https://github.com/yt-dlp/FFmpeg-Builds/releases/download/${FFMPEG_VERSION}/ffmpeg-n6.1.1-1-g61b88b4dda-linux64-gpl-6.1.tar.xz \
  | tar xfJ - -C /bin --strip-components 2 "ffmpeg-n6.1.1-1-g61b88b4dda-linux64-gpl-6.1/bin/ffmpeg" "ffmpeg-n6.1.1-1-g61b88b4dda-linux64-gpl-6.1/bin/ffprobe" \
  && wget https://github.com/yt-dlp/yt-dlp/releases/download/${YT_DLP_VERSION}/yt-dlp_linux -O /bin/yt-dlp \
  && chmod a+rx /bin/yt-dlp \
  && apk add --no-cache python3 py3-pip \
  && python3 -m pip install -U pip tubeup

WORKDIR /app

COPY deno.lock deps.ts ./
RUN deno cache --lock=deno.lock deps.ts

COPY . .

CMD ["deno", "run", "-A", "main.ts"]
STOPSIGNAL SIGINT

VOLUME ["/app/data"]
