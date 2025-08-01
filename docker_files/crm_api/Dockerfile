FROM python:3.11-slim

WORKDIR /app

COPY ../../code_base/crm_api/requirements.txt ./
RUN pip install --no-cache-dir -r requirements.txt

COPY ../../code_base/crm_api ./
EXPOSE 8000

CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
