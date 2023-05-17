FROM denoland/deno:1.33.3

ARG CAPROVER_GIT_COMMIT_SHA=${CAPROVER_GIT_COMMIT_SHA}
ENV DENO_DEPLOYMENT_ID=${CAPROVER_GIT_COMMIT_SHA}

WORKDIR /app

COPY . .
RUN deno cache main.ts --import-map=import_map.json

EXPOSE 8000

CMD ["run", "-A", "main.ts"]