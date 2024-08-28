# Stage 1: Builder Stage
FROM python:3.12-slim AS builder

WORKDIR /app

COPY . .

RUN pip install --no-cache-dir poetry \
    && poetry build -f wheel

# Stage 2: Production Stage
FROM python:3.12-slim

WORKDIR /app

COPY --from=builder /app/dist/*.whl ./
RUN pip install --no-cache-dir *.whl \
    && rm *.whl

EXPOSE 8501

RUN useradd --create-home appuser
USER appuser

CMD ["ptv-deploy"]